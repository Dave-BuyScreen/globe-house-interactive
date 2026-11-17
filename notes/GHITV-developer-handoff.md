# GlobeHouse Interactive — Project History

Developer handoff copy of the project history. Updated 2026-11-15. Keys/secrets are NOT in this file — ask Abhi.

## Project overview
- Client: Dave (GlobeHouse / BuyScreen). Current site: www.GlobeHouse-ar.com (Base44 app "GlobeHouse Immersive AR").
- Goal: rebuild the Base44 app on our own stack (GitHub + Supabase + Vercel), matching its look and behavior,
  launch it at www.GHITV.com (GoDaddy domain), then maintain and extend it (viewer tiers, TV apps).
- Repo: Dave-BuyScreen/globe-house-interactive. Working branches: base44-port (the rebuild), viewer-tiers (paid tiers, uncommitted locally).

## Access
| Platform | What | Level |
|---|---|---|
| GitHub | Dave-BuyScreen/globe-house-interactive (Abhi's account) | write/push, NOT admin |
| Supabase | org "GlobveHouse-BuyScreen", project "Dave-BuyScreen's Project" ref ohfjvvllqlkbxduslypl | can set secrets (confirmed 2026-11-14) |
| Vercel | team "GlobeHouse" (slug globe-house) | Member |
| Base44 | GlobeHouse Immersive AR editor | invited 2026-11-11 3:41 PM |
| GoDaddy | GHITV.com / GlobeHouse-ar.com | A+CNAME done 2026-11-14, _vercel TXT verify pending |
| Stripe | Dave's account "BuyScreen sandbox" (TEST mode) | pk_test + sk_test received 2026-11-14 7:18 PM via WhatsApp; keys in .env.secrets only |

## Timeline
- 2026-11-10: Dave reached out — Vercel deploy shows blank black screen. AI assistant had
  ported his Base44 app to Vite/React/Supabase.
- 2026-11-11: Cloned repo. Diagnosis:
  1. VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing at build → createClient throws
     "supabaseUrl is required." → React never mounts → black screen.
  2. No tailwind/postcss config → raw @tailwind in CSS.
  3. Real pages stranded in src/lib/src/... and src/lib/src/src/...; folder "dashboard⁠"
     had hidden U+2060 char; Dashboard.jsx empty; Player.jsx missing final `}`; imports
     `@/components/ui/button` that didn't exist; main.jsx used placeholder App.
  4. node_modules (~8,100 files) + dist committed, no .gitignore.
- 2026-11-11: Fix commit d07166c pushed to main ("Fix blank screen and wire up full
  GlobeHouse app"). Built Dashboard, Button, router App, configs, vercel.json, .gitignore.
- Vercel team "GlobeHouse" was empty → created project globe-house-interactive in it,
  added env vars (prod/preview/dev), deployed:
  **https://globe-house-interactive-two.vercel.app** (working, connected to Supabase).
- `vercel git connect` failed: Vercel GitHub app has no access to Dave's repo. Needs Dave
  to install github.com/apps/vercel on the repo, or make Abhi repo admin.
- Dave's own Vercel project (globe-house-interactive.vercel.app, personal account, no
  access) — Dave added env vars himself ~3:27 PM. Said result is "a bit off" vs Base44.
- Dave invited Abhi to Base44 (first as app user via email → opened live site; then as
  builder collaborator). Dave agreed to care plan, wants new site to look/work exactly
  like globehouse-ar.com.

- 2026-11-11 (late): Exported full Base44 source via editor API (/api/apps/{id}/code/file-list +
  /code/content/batch; 244 files) and entity data (/entities/{Name}; 33 rows, Users not exportable).
  Base44 app id 6999eeb5400ab46cf574d543. Raw export lives in session scratchpad; data SQL at
  supabase/data/base44-data.sql (gitignored — has customer emails).
- Branch `base44-port` commit 0a829f7 (NOT pushed): full Base44 source + Supabase shim
  (src/api/base44Client.js), Supabase Auth login (/login), 23-table migration with RLS,
  12 Edge Functions via supabase/functions/_shared/base44.ts. Build OK, Dashboard renders locally.
- Old empty tables episodes/products/video_object_mappings are unused now (new names: episode, product,
  video_object_mapping...). Leave until Dave OKs dropping.
- Supabase CLI here is logged into a different account (Dave's project not listed) → apply SQL via
  dashboard SQL editor or get Dave to grant access / an access token.

- 2026-11-12 ~1:30am: Schema + data applied by Abhi via SQL editor (pre-existing profiles/site_settings
  handled; old site_settings renamed site_settings_legacy). Counts verified (7 episodes, 10 registry...).
  Local build against live DB: Dashboard identical to globehouse-ar.com. Preview deploy
  globe-house-interactive-lyacxzipd-globe-house.vercel.app is behind Vercel team protection.
  Dave's concern: Base44 code "designed not to work outside the platform" — answered: we use original
  source from Base44 export + Supabase shim; only Dashboard verified so far. Draft Dave update sent to Abhi.
  NOT yet tested: login/signup, editor pages, uploads, Player/AR triggers, edge functions (not deployed).

- 2026-11-12: Page sweep (local vs live DB): /, Dashboard, Marketplace, Player, LiveTV, Videos,
  FoundersRegistry (empty = all 3 certs Revoked, same on live), Virtual, ARLandingPage, EpisodePreview,
  Verify, EmbedLive, ARPreview, EpisodeEditor, Orders, UserProfile → no console errors, match live.
  Base44 had no public login button; admins use /login directly.
  Shim fixes: strip nulls on read; filter writes to known columns, skip undefined.
  Design assets self-hosted in public/brand. 30 data media files staged in ~/Desktop/globehouse-media-upload
  → upload to Storage uploads/base44, then run supabase/sql/rewrite-base44-media.sql.
  Preview: globe-house-interactive-e757aq5ts-globe-house.vercel.app (team-protected).

## Next steps (updated 2026-11-11)
A. Sign into supabase.com dashboard → run migration SQL, then data SQL. Make Dave's user admin.
B. Deploy Edge Functions (needs CLI access to project). Secrets: ANTHROPIC_API_KEY, STRIPE_SECRET_KEY,
   STRIPE_WEBHOOK_SECRET, CLOUDINARY_*. Base44 had these — ask Dave for values.
C. Copy ~30 media files from base44 hosts into Supabase storage `uploads`, rewrite URLs.
D. Distribute Transaction Fees workflow (Transaction create/update) → DB webhook or call from stripeWebhook.
E. Page-by-page visual compare vs globehouse-ar.com, then preview deploy, then Dave approval → merge to main.

## Older next steps
1. Log in to app.base44.com → open GlobeHouse Immersive AR → inventory every page,
   feature, entity/table, auth flow, AR overlay behavior. Export code if Base44 allows.
2. Send Dave feature checklist + timeline.
3. Rebuild page by page to match Base44 (design + function). Login page (Supabase Auth),
   RLS policies (public read episodes/products; admin write).
4. Match Supabase schema to Base44 entities; migrate data.
5. Decide which Vercel project is canonical (recommend globe-house team project); get
   GitHub auto-deploy connected.
6. GoDaddy: connect GHITV.com to Vercel (A 76.76.21.21 / CNAME cname.vercel-dns.com),
   decide what happens to globehouse-ar.com (redirect).

- 2026-11-12: Abhi got a Stripe TEST secret key (account prefix 51TZhqh...). NOT stored in repo/notes.
  Mismatch: BuyScreenPanel.jsx hardcodes a pk_live from a DIFFERENT account (51LlEa3...). Need matching
  pk_test from 51TZhqh account + webhook signing secret. Set sk via `supabase secrets set` once CLI has access.
- 2026-11-12: Planned business model: 3 viewer tiers, Subscription (SVOD), Free w/ ads (AVOD),
  TVOD (pay per title). Plus "The Vault" = one-off special projects. Not in Base44 source yet
  (only merchant.subscription_tier + platform_settings.subscription_tiers). Build after the port matches live.
- 2026-11-12 PM: commit on base44-port (not pushed): VITE_STRIPE_PUBLISHABLE_KEY env (fallback live pk),
  distributeTransactionFees locked to service-role caller, scripts/upload-base44-media.mjs (signs in as app
  user, uploads ~/Desktop/globehouse-media-upload → uploads/base44). Step D already handled: stripeWebhook
  invokes distributeTransactionFees directly. Still blocked on B (no CLI access to project).
- 2026-11-12 ~6:20pm: Supabase CLI now sees Dave's project (org GlobveHouse-BuyScreen) → linked, deployed
  all 12 Edge Functions. CLI 2.90 lowercased config key → stray "stripewebhook" + stripeWebhook had JWT on;
  fixed: redeployed stripeWebhook --no-verify-jwt, deleted stray. ALWAYS deploy stripeWebhook with --no-verify-jwt.
  arTriggers 200 OK (DB works). Stripe fns 500 = STRIPE_SECRET_KEY missing. `secrets set` → 403: Abhi's
  role lacks secrets privilege. Need Dave to make Abhi Owner/Admin, or set secrets in dashboard.
  Webhook URL: https://ohfjvvllqlkbxduslypl.supabase.co/functions/v1/stripeWebhook
- 2026-11-12 night: Step C DONE via CLI (storage cp + db query work with Abhi's role): 30 files in uploads/base44,
  40 DB refs rewritten, 0 base44 URLs left. Step E QA w/ Playwright as temp admin: login OK, 23 logged-in pages
  0 console errors / 0 failed requests; CRUD + UploadFile + arTriggers OK. Fixed shim: update with only unknown
  fields → return record (commit after 125187c). RLS test as normal user: can't self-promote, edit/delete others'
  episodes, read others' profiles/orders. Old tables (episodes, products, ...) RLS on + no policies = locked.
  Player "Edit" button renders as blank white pill — SAME on live Base44 (bg-background white). Left as-is.
  Temp QA users/files deleted. 13 functions deployed (not 12).
  REMAINING: secrets (needs Owner/Admin or dashboard), Stripe pk_test + whsec, Vercel env
  VITE_STRIPE_PUBLISHABLE_KEY, Dave approval → merge base44-port to main, GHITV.com DNS, GitHub→Vercel connect.
- 2026-11-12 late: Tested "not tested" list. AR triggers fire during Vimeo playback (desktop + iPhone):
  prompt → portal card → BuyScreen → Stripe checkout form → submit. Fixed: base44.analytics.track missing in
  shim (threw on every trigger click); Stripe fns crashed at boot w/o key (vague CORS error) → now 503 JSON
  "Payments are not configured yet". Mobile: 11 public pages fit iPhone width, match live visually.
  Signup: open, email confirmation ON → needs custom SMTP (default only sends to team emails). AI/video fns
  return clear errors w/o ANTHROPIC/CLOUDINARY keys; processVideoUpload falls back to original URL.
- 2026-11-13: Added scripts/set-secrets.sh + .env.secrets.example (commit f130f69). Fill .env.secrets → run script:
  sets Supabase secrets, redeploys Stripe fns (webhook w/ --no-verify-jwt), sets Vercel VITE_STRIPE_PUBLISHABLE_KEY,
  refuses mismatched Stripe account/mode. Vercel CLI logged out ("Not authorized") → Abhi must `vercel login`.
  Abhi will add keys later.
- 2026-11-13: vercel login fixed (GlobeHouse team). Preview w/ all fixes: globe-house-interactive-z5y7yjx1x-globe-house.vercel.app (Ready, team-protected).
- 2026-11-14: Supabase secrets WRITE access confirmed (Dave upgraded role): test secret set+unset OK, no 403.
  Blocker B cleared. Next: fill .env.secrets → scripts/set-secrets.sh. Still need pk_test (51TZhqh acct), whsec, ANTHROPIC, CLOUDINARY_*.
- 2026-11-14: GoDaddy DNS done (apex A 76.76.21.21, www CNAME cname.vercel-dns.com). Domain claimed by another Vercel acct
  (likely Dave's personal) → added ghitv.com (308→www) + www.ghitv.com to globe-house-interactive via API, unverified.
  Need 2 GoDaddy TXT records at _vercel: vc-domain-verify=www.ghitv.com,43bb3bd9472b51ffda61 and vc-domain-verify=ghitv.com,abbb51b71c7c0060f6b9.
  Prod deploy is 42ivbgb56 (3d old, pre-port) — deploy base44-port to prod after Dave OK.
- 2026-11-14: VIEWER TIERS started on branch `viewer-tiers` (off base44-port, uncommitted). Tiers: free w/ ads, subscription,
  tvod (buy/rent), vault (buy only, never in subscription). Migration supabase/migrations/20261114000000_viewer_tiers.sql:
  episode.access_tier/purchase_price/rental_price/rental_hours/trailer_url; locked episodes' video links moved by trigger to
  episode_media (RLS: gh_can_watch) and merged back by both shims; entitlement (webhook-only writes), stripe_customer,
  monetization_settings (row id 'default', admin writes), ad_creative, ad_event. Tested on local Postgres: 22/22 access checks OK.
  New fns createCheckoutSession, createBillingPortalSession (Stripe Checkout w/ inline price_data, no Stripe products needed);
  stripeWebhook handles checkout.session.completed/async_payment_succeeded + customer.subscription.*, skips viewer PIs/invoices
  in old product-order path. Pages: /Subscribe, /Vault, /Monetization (admin), Paywall + AdBreak in Player, Access & Pricing in editor.
  NOT yet applied to live DB / deployed. Stripe webhook must add events: checkout.session.completed,
  checkout.session.async_payment_succeeded, customer.subscription.created/updated/deleted. Billing portal must be saved once in Stripe.
- 2026-11-14: Sent Abhi a ready-to-paste message for Dave: add 2 TXT records, heads-up that verifying moves GHITV.com off his
  personal Vercel acct, and asking for pk_test, whsec, ANTHROPIC + CLOUDINARY keys.
- Local test DB recipe (used for tiers): initdb in scratchpad, start with `-c listen_addresses=127.0.0.1 -c unix_socket_directories=''`
  (scratchpad path too long for a unix socket), stub auth/storage schemas + anon/authenticated/service_role roles, apply both migrations.

## Status & remaining (2026-11-14)
WAITING ON DAVE: (1) GoDaddy TXT records  (2) Stripe keys RECEIVED (test) — whsec we create ourselves (later live keys)  (3) ANTHROPIC + CLOUDINARY keys
  (4) approve base44-port → merge to main  (5) real membership prices (placeholders $9.99/mo, $99/yr)
  (6) house ads only vs ad network (Google Ad Manager/VAST) later  (7) OK to drop old empty tables.
OURS: fill .env.secrets → scripts/set-secrets.sh → test checkout end to end; verify GHITV.com + SSL; merge + prod deploy
  (decide canonical Vercel project, switch off Dave's personal one); connect GitHub→Vercel (needs Dave, Abhi not repo admin);
  globehouse-ar.com redirect; custom SMTP for signup emails; weekly DB backups.
VIEWER TIERS NEXT (waiting for Abhi's OK — touches live Supabase): apply 20261114000000_viewer_tiers.sql to live DB, deploy
  createCheckoutSession + createBillingPortalSession + stripeWebhook (--no-verify-jwt), click-through test, then commit branch.
  Stripe dashboard: add webhook events checkout.session.completed, checkout.session.async_payment_succeeded,
  customer.subscription.created/updated/deleted; save Customer Portal settings once.
- 2026-11-14 later: www.ghitv.com VERIFIED, https 200 (serves old prod deploy). Apex TXT has typo (space: 'abb b51b...') → apex unverified, no SSL. Fix GoDaddy value to vc-domain-verify=ghitv.com,abbb51b71c7c0060f6b9.

- 2026-11-14 evening: PRODUCTION DEPLOY of rebuild (from worktree in scratchpad gh-prod, commit f130f69, not main):
  globe-house-interactive-ogrha3pdi-globe-house.vercel.app → www.ghitv.com now looks like globehouse-ar.com
  (title "GlobeHouse Immersive AR", intro video, 6 pages desktop+iPhone, 0 console errors). Rollback target: 42ivbgb56.
- 2026-11-14: Explained payment model + SEO plan to Dave; monthly planning call agreed.
- 2026-11-14: Stripe Checkout Studio settings (pasted from Dave's Stripe) applied to BOTH checkout calls in
  supabase/functions/createCheckoutSession/index.ts: ui_mode 'hosted' (SDK npm:stripe@17.5.0 < 21, else 'hosted_page'),
  billing_address_collection auto, phone_number_collection off, automatic_tax off, allow_promotion_codes false,
  submit_type auto, integration_identifier 'hosted_mobile_app_0001', origin_context 'mobile_app',
  payment_method_collection 'always' (subscription only). Kept customer/client_reference_id/metadata/subscription_data/
  payment_intent_data on purpose (webhook fulfillment needs them). All params confirmed in Stripe API docs.
  OPEN QUESTION to Dave: origin_context 'mobile_app' vs 'web' (site is web → recommend 'web'; mobile_app for TV/phone apps later).
  Wrote STRIPE_INTEGRATION_TODO.md (repo root, uncommitted) = checklist: env vars, deploy cmds, webhook URL+events, test cards.
- 2026-11-14 7:18 PM: Dave sent pk_test + sk_test in WhatsApp (no whsec). Verified sk works (account "BuyScreen sandbox",
  test mode; pk/sk same account). DONE: Supabase secrets STRIPE_SECRET_KEY + SITE_URL=https://www.ghitv.com set;
  Vercel VITE_STRIPE_PUBLISHABLE_KEY set (production + preview, applies on next deploy); also in .env.local.
  Did NOT run scripts/set-secrets.sh (it redeploys stripeWebhook from the unmerged viewer-tiers branch).
  Checked Stripe (read only): NO webhook endpoints, NO Customer Portal config yet.
  Told Dave: keys work, we set up webhook + portal, test card coming; live keys to be sent privately.
NEXT (waiting for Abhi's "go"): (1) create Stripe test webhook → https://ohfjvvllqlkbxduslypl.supabase.co/functions/v1/stripeWebhook
  with 7 events (checkout.session.completed, checkout.session.async_payment_succeeded, customer.subscription.created/
  updated/deleted, payment_intent.succeeded, payment_intent.payment_failed), put whsec into .env.secrets + Supabase secret
  STRIPE_WEBHOOK_SECRET  (2) create Customer Portal config  (3) apply 20261114000000_viewer_tiers.sql to live DB
  (4) deploy createCheckoutSession, createBillingPortalSession, stripeWebhook --no-verify-jwt  (5) test checkout with 4242 card,
  confirm entitlement row + unlock; then send Dave test instructions. Later: live keys, commit viewer-tiers, merge to main.

## Next builds (roadmap from Dave)
1. Viewer tiers (in progress, branch viewer-tiers): free w/ ads, subscription, TVOD, The Vault. See 2026-11-14 entries.
2. **TV apps with BuyScreen (requested 2026-11-14):** bring the BuyScreen in-video shopping (timed triggers →
   product portal → buy) to smart TV / TV apps: **Apple TV (tvOS), Roku, Amazon Fire TV**. Not started; scope + price TBD.
   Notes for planning (not decided yet):
   - Reuse Supabase as the backend: episodes, triggers (episode.triggers jsonb), products, entitlements/tiers, arTriggers fn.
   - Each platform is its own app + store review: tvOS (Swift/SwiftUI + AVPlayer, App Store), Roku (BrightScript/SceneGraph,
     Roku Channel Store), Fire TV (Android TV/Leanback or React Native for TV, Amazon Appstore). React Native tvOS + Android TV
     could share one codebase for Apple TV + Fire TV; Roku always needs its own.
   - TV remotes can't do card entry well → buying on TV = show product on screen + QR code / "send to my phone" link that opens
     checkout on the phone (QRCodeLauncher component already exists for AR). Wishlist/"save for later" fits TV too.
   - Device sign-in via code/QR on phone (TV device-code flow), so purchases and memberships match the web account.
   - Video must play natively (HLS). Vimeo embeds won't work in native TV players → need HLS/MP4 URLs (Vimeo Pro/Premium
     direct links or Cloudflare Stream / Mux). Locked-episode links must come from a server check, not public fields.
   - In-app purchase rules: Apple/Amazon/Roku may require their own billing for subscriptions/rentals sold inside the TV app
     (physical products via BuyScreen are usually exempt). Check each store's rules before pricing.
   - Needs developer accounts in Dave's name: Apple Developer ($99/yr), Roku developer (free), Amazon developer (free).
