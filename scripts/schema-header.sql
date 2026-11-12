-- An earlier rebuild left a differently shaped site_settings table. Keep it (renamed) instead of dropping it.
do $$ begin
  if to_regclass('public.site_settings') is not null and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'site_settings' and column_name = 'created_by_id'
  ) then
    alter table public.site_settings rename to site_settings_legacy;
  end if;
end $$;

-- Users: Base44 "User" entity -> profiles table keyed by auth.users.id
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  role text not null default 'user' check (role in ('admin','editor','user')),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
-- profiles may already exist from the earlier rebuild; add whatever it is missing
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists role text not null default 'user';
alter table public.profiles add column if not exists created_date timestamptz not null default now();
alter table public.profiles add column if not exists updated_date timestamptz not null default now();
alter table public.profiles enable row level security;

create or replace function public.gh_is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','editor'));
$$;

create or replace function public.gh_is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

drop policy if exists "profiles read own or admin" on public.profiles;
create policy "profiles read own or admin" on public.profiles for select using (id = auth.uid() or public.gh_is_admin());
drop policy if exists "profiles update own name" on public.profiles;
create policy "profiles update own name" on public.profiles for update using (id = auth.uid() or public.gh_is_admin())
  with check (public.gh_is_admin() or role = (select p.role from public.profiles p where p.id = auth.uid()));

-- Create a profile row for every new auth user
create or replace function public.gh_handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.gh_handle_new_user();

-- Fill created_by / updated_date like Base44 does
create or replace function public.gh_set_meta() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if new.created_by_id is null then new.created_by_id := auth.uid(); end if;
    if new.created_by is null then new.created_by := (select email from public.profiles where id = auth.uid()); end if;
  else
    new.created_date := old.created_date;
    new.created_by := old.created_by;
    new.created_by_id := old.created_by_id;
  end if;
  new.updated_date := now();
  return new;
end $$;

-- Public file uploads (Base44 Core.UploadFile)
insert into storage.buckets (id, name, public) values ('uploads', 'uploads', true) on conflict (id) do nothing;
drop policy if exists "uploads read" on storage.objects;
create policy "uploads read" on storage.objects for select using (bucket_id = 'uploads');
drop policy if exists "uploads insert" on storage.objects;
create policy "uploads insert" on storage.objects for insert with check (bucket_id = 'uploads' and auth.uid() is not null);
