-- Viewer tiers: Free with ads (AVOD), Subscription (SVOD), pay-per-title (TVOD) and The Vault.
-- Additive only: every existing episode stays 'free' and keeps playing exactly as before.

-- 1. Episode access settings ------------------------------------------------------------
alter table public.episode add column if not exists access_tier text not null default 'free';
alter table public.episode add column if not exists purchase_price double precision;
alter table public.episode add column if not exists rental_price double precision;
alter table public.episode add column if not exists rental_hours integer;
alter table public.episode add column if not exists trailer_url text;
do $$ begin
  alter table public.episode add constraint episode_access_tier_check
    check (access_tier in ('free', 'subscription', 'tvod', 'vault'));
exception when duplicate_object then null; end $$;

-- 2. Locked video links -------------------------------------------------------------------
-- Episodes are publicly readable, so a locked episode's video links live here instead and are
-- only returned to viewers who may watch it. The app client merges them back into the episode.
create table if not exists public.episode_media (
  episode_id text primary key,
  vimeo_url text,
  youtube_url text,
  updated_date timestamptz not null default now()
);
alter table public.episode_media enable row level security;

-- 3. What each viewer has paid for --------------------------------------------------------
-- Written only by the Stripe webhook (service role). Viewers can read their own rows.
create table if not exists public.entitlement (
  id text primary key default replace(gen_random_uuid()::text, '-', ''),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text,
  kind text not null check (kind in ('subscription', 'purchase', 'rental')),
  episode_id text,
  status text not null default 'active',
  plan_interval text,
  amount double precision,
  currency text default 'usd',
  expires_at timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  stripe_checkout_session_id text unique
);
create index if not exists entitlement_user_idx on public.entitlement (user_id, kind);
alter table public.entitlement enable row level security;

-- Stripe customer per user. Kept out of profiles because users may update their own profile row.
create table if not exists public.stripe_customer (
  user_id uuid primary key references auth.users(id) on delete cascade,
  customer_id text not null unique,
  created_date timestamptz not null default now()
);
alter table public.stripe_customer enable row level security; -- service role only, no policies

-- 4. Prices and ad settings (one row, admin-only writes) ---------------------------------
create table if not exists public.monetization_settings (
  id text primary key default 'default' check (id = 'default'),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by text,
  created_by_id uuid,
  currency text not null default 'usd',
  subscription_monthly_price double precision default 9.99,
  subscription_yearly_price double precision default 99,
  subscription_name text default 'GlobeHouse Membership',
  default_rental_hours integer default 48,
  ads_enabled boolean default true,
  ad_skip_after_seconds integer default 5
);
insert into public.monetization_settings (id) values ('default') on conflict (id) do nothing;
alter table public.monetization_settings enable row level security;

-- 5. House ads for the free tier ----------------------------------------------------------
create table if not exists public.ad_creative (
  id text primary key default replace(gen_random_uuid()::text, '-', ''),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by text,
  created_by_id uuid,
  title text,
  advertiser text,
  video_url text,
  image_url text,
  click_url text,
  duration_seconds integer default 15,
  weight integer default 1,
  active boolean default true
);
alter table public.ad_creative enable row level security;

create table if not exists public.ad_event (
  id text primary key default replace(gen_random_uuid()::text, '-', ''),
  created_date timestamptz not null default now(),
  ad_id text,
  episode_id text,
  event text not null check (event in ('impression', 'click', 'skip', 'complete')),
  user_id uuid default auth.uid()
);
alter table public.ad_event enable row level security;

-- 6. Access rules -------------------------------------------------------------------------
create or replace function public.gh_has_subscription(uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.entitlement
    where user_id = uid and kind = 'subscription'
      and status in ('active', 'trialing', 'past_due')
      and (expires_at is null or expires_at > now())
  );
$$;

create or replace function public.gh_can_watch(ep_id text) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare ep record; uid uuid := auth.uid();
begin
  select access_tier, created_by_id into ep from public.episode where id = ep_id;
  if not found then return false; end if;
  if ep.access_tier = 'free' then return true; end if;
  if uid is null then return false; end if;
  if ep.created_by_id = uid or public.gh_is_staff() then return true; end if;
  if ep.access_tier = 'subscription' then return public.gh_has_subscription(uid); end if;
  -- tvod and vault: bought, or rented and not expired. Never included in the subscription.
  return exists (
    select 1 from public.entitlement
    where user_id = uid and episode_id = ep_id and status = 'active'
      and (kind = 'purchase' or (kind = 'rental' and expires_at > now()))
  );
end $$;

-- Move video links of locked episodes into episode_media on every save, and back when an
-- episode becomes free again. Saves that don't send links (e.g. trigger edits) leave them alone.
create or replace function public.gh_episode_media_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare m record;
begin
  if new.access_tier is distinct from 'free' then
    if new.vimeo_url is not null or new.youtube_url is not null then
      insert into public.episode_media (episode_id, vimeo_url, youtube_url)
      values (new.id, new.vimeo_url, new.youtube_url)
      on conflict (episode_id) do update set
        vimeo_url = coalesce(excluded.vimeo_url, episode_media.vimeo_url),
        youtube_url = coalesce(excluded.youtube_url, episode_media.youtube_url),
        updated_date = now();
    end if;
    new.vimeo_url := null;
    new.youtube_url := null;
  else
    select * into m from public.episode_media where episode_id = new.id;
    if found then
      new.vimeo_url := coalesce(new.vimeo_url, m.vimeo_url);
      new.youtube_url := coalesce(new.youtube_url, m.youtube_url);
      delete from public.episode_media where episode_id = new.id;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists episode_media_guard on public.episode;
create trigger episode_media_guard before insert or update on public.episode
  for each row execute function public.gh_episode_media_guard();

create or replace function public.gh_episode_media_cleanup() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  delete from public.episode_media where episode_id = old.id;
  return old;
end $$;
drop trigger if exists episode_media_cleanup on public.episode;
create trigger episode_media_cleanup after delete on public.episode
  for each row execute function public.gh_episode_media_cleanup();

-- 7. Policies -----------------------------------------------------------------------------
drop policy if exists "episode_media read" on public.episode_media;
create policy "episode_media read" on public.episode_media for select
  using (public.gh_is_staff() or public.gh_can_watch(episode_id));

drop policy if exists "entitlement read own" on public.entitlement;
create policy "entitlement read own" on public.entitlement for select
  using (user_id = auth.uid() or public.gh_is_staff());

drop policy if exists "monetization_settings read" on public.monetization_settings;
create policy "monetization_settings read" on public.monetization_settings for select using (true);
drop policy if exists "monetization_settings update" on public.monetization_settings;
create policy "monetization_settings update" on public.monetization_settings for update
  using (public.gh_is_admin()) with check (public.gh_is_admin());

drop policy if exists "ad_creative read" on public.ad_creative;
create policy "ad_creative read" on public.ad_creative for select using (active or public.gh_is_staff());
drop policy if exists "ad_creative insert" on public.ad_creative;
create policy "ad_creative insert" on public.ad_creative for insert with check (public.gh_is_staff());
drop policy if exists "ad_creative update" on public.ad_creative;
create policy "ad_creative update" on public.ad_creative for update using (public.gh_is_staff());
drop policy if exists "ad_creative delete" on public.ad_creative;
create policy "ad_creative delete" on public.ad_creative for delete using (public.gh_is_staff());

drop policy if exists "ad_event insert" on public.ad_event;
create policy "ad_event insert" on public.ad_event for insert
  with check (user_id is null or user_id = auth.uid());
drop policy if exists "ad_event read" on public.ad_event;
create policy "ad_event read" on public.ad_event for select using (public.gh_is_staff());

-- created_by / updated_date bookkeeping, same as the Base44 tables
drop trigger if exists set_meta on public.ad_creative;
create trigger set_meta before insert or update on public.ad_creative
  for each row execute function public.gh_set_meta();
drop trigger if exists set_meta on public.monetization_settings;
create trigger set_meta before insert or update on public.monetization_settings
  for each row execute function public.gh_set_meta();

-- gh_has_subscription takes any user id, so only the database itself and the service role may call it.
revoke execute on function public.gh_has_subscription(uuid) from public, anon, authenticated;
grant execute on function public.gh_has_subscription(uuid) to service_role;
