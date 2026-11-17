# Stripe Integration TODO

This site already uses **hosted Stripe Checkout**: the customer is sent to a payment page hosted by Stripe.
The Checkout Studio settings below were added to the existing checkout calls. No new files, routes or endpoints were added.

## Values to Replace

**None.** `mode`, `success_url`, `cancel_url` and `line_items` already use real values from the code:

| Field | Current value | Notes |
|-------|---------------|-------|
| mode | `subscription` (membership) / `payment` (buy or rent a title) | Chosen per product type. Correct. |
| success_url | `{site}{return_path}?checkout=success&session_id={CHECKOUT_SESSION_ID}` | Built from the request origin, falling back to `SITE_URL` and then `https://www.ghitv.com`. |
| cancel_url | `{site}{return_path}?checkout=cancel` | Same base as `success_url`. |
| line_items | Inline `price_data` | Prices come from the `monetization_settings` table (membership) and per-episode prices, so no Stripe Price IDs are needed. Admins change prices on the Monetization page. |

## Configured Parameters

**Files containing these parameters:**
- [supabase/functions/createCheckoutSession/index.ts](supabase/functions/createCheckoutSession/index.ts) (both the membership call and the title purchase/rental call)

| Parameter | Value |
|-----------|-------|
| ui_mode | `hosted` (installed `npm:stripe@17.5.0` is below 21.0.0; change to `hosted_page` after upgrading the SDK to 21 or later) |
| billing_address_collection | `auto` |
| phone_number_collection | `{ enabled: false }` |
| automatic_tax | `{ enabled: false }` |
| allow_promotion_codes | `false` |
| payment_method_collection | `always` (membership/subscription call only) |
| submit_type | `auto` |
| integration_identifier | `hosted_mobile_app_0001` |
| origin_context | `web` |

Existing parameters such as `customer`, `client_reference_id`, `metadata`, `subscription_data` and `payment_intent_data` were **kept on purpose**. The webhook uses them to grant access after payment, so removing them would break fulfillment.

> `origin_context` is `web` because GHITV.com is a website. Use `mobile_app` only in future phone/TV apps.

## Status (2026-11-16, TEST mode)
Done: migration applied to live DB, functions deployed, webhook `we_1UcU0i7P3LrslTgxYnXdbdv6` (7 events) + `STRIPE_WEBHOOK_SECRET` set, Customer Portal `bpc_1UcU0s7P3LrslTgxHYw9Z56P` saved. End-to-end tested: title purchase unlocks video, monthly membership active, billing portal opens.
Left: switch to live keys (new live webhook + portal), real membership prices.

## Setup and next steps

### Environment variables (Supabase Edge Function secrets, never in the frontend)
- `STRIPE_SECRET_KEY`: `sk_test_...` / `sk_live_...`
- `STRIPE_WEBHOOK_SECRET`: `whsec_...` from the webhook endpoint
- `SITE_URL`: `https://www.ghitv.com` (optional fallback for return URLs)
- Frontend (`.env.local` / Vercel): `VITE_STRIPE_PUBLISHABLE_KEY` = `pk_test_...` (used only by the older product payment flow)

Set them all in one go with `scripts/set-secrets.sh`.

### Deploy
```
supabase functions deploy createCheckoutSession
supabase functions deploy createBillingPortalSession
supabase functions deploy stripeWebhook --no-verify-jwt
```
Apply `supabase/migrations/20261114000000_viewer_tiers.sql` first.

### Stripe webhook
Endpoint: `https://ohfjvvllqlkbxduslypl.supabase.co/functions/v1/stripeWebhook`
Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `payment_intent.succeeded`, `payment_intent.payment_failed`.

Also save the **Customer Portal** settings in the Stripe Dashboard so that "Manage billing / cancel" works.

### How it works
1. The viewer clicks Join, Buy or Rent. The frontend calls `createCheckoutSession`, which returns the Stripe URL, and the browser redirects to it.
2. The viewer pays on Stripe's page and returns to `success_url`.
3. Stripe calls `stripeWebhook`, which writes an `entitlement` row. The page polls for that row and unlocks the content.

### Testing
- Card `4242 4242 4242 4242`, any future date, any CVC succeeds.
- Card `4000 0025 0000 3155` requires 3D Secure.
- Card `4000 0000 0000 9995` is declined.
- Use test-mode keys until everything works, then switch to live keys and create a live webhook.

### Resources
- https://support.stripe.com
- https://docs.stripe.com/mcp
