#!/usr/bin/env bash
# Pushes keys from .env.secrets to Supabase Edge Function secrets and Vercel.
# Usage: ./scripts/set-secrets.sh [path/to/.env.secrets]
# Needs: Supabase role Owner/Administrator on the project; `vercel login` on the GlobeHouse team.
set -euo pipefail
cd "$(dirname "$0")/.."

FILE="${1:-.env.secrets}"
REF=ohfjvvllqlkbxduslypl
[ -f "$FILE" ] || { echo "Missing $FILE (copy .env.secrets.example)"; exit 1; }

SERVER_KEYS="STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET ANTHROPIC_API_KEY CLOUDINARY_CLOUD_NAME CLOUDINARY_API_KEY CLOUDINARY_API_SECRET"
TMP=$(mktemp); trap 'rm -f "$TMP"' EXIT; chmod 600 "$TMP"

val() { grep -E "^$1=" "$FILE" | tail -1 | cut -d= -f2- | sed -E 's/^["'\'']|["'\'']$//g'; }

for k in $SERVER_KEYS; do
  v=$(val "$k" || true)
  [ -n "$v" ] && printf '%s=%s\n' "$k" "$v" >> "$TMP"
done

# Safety: secret and publishable key must be the same Stripe account and mode.
sk=$(val STRIPE_SECRET_KEY || true); pk=$(val VITE_STRIPE_PUBLISHABLE_KEY || true)
if [ -n "$sk" ] && [ -n "$pk" ]; then
  [ "${sk:3:4}" = "${pk:3:4}" ] || { echo "Stripe keys mix test/live (${sk:0:7} vs ${pk:0:7})"; exit 1; }
  [ "${sk:8:10}" = "${pk:8:10}" ] || { echo "Stripe keys are from different accounts"; exit 1; }
fi

if [ -s "$TMP" ]; then
  echo "Supabase secrets: $(cut -d= -f1 "$TMP" | tr '\n' ' ')"
  supabase secrets set --project-ref "$REF" --env-file "$TMP"
  # Functions read secrets at boot; redeploy the ones that cache them.
  for f in createStripePaymentIntent distributeTransactionFees; do
    supabase functions deploy "$f" --project-ref "$REF" --use-api
  done
  supabase functions deploy stripeWebhook --project-ref "$REF" --use-api --no-verify-jwt
fi

if [ -n "$pk" ]; then
  echo "Vercel: VITE_STRIPE_PUBLISHABLE_KEY (production + preview)"
  for env in production preview; do
    vercel env rm VITE_STRIPE_PUBLISHABLE_KEY "$env" --yes --scope globe-house >/dev/null 2>&1 || true
    printf '%s' "$pk" | vercel env add VITE_STRIPE_PUBLISHABLE_KEY "$env" --scope globe-house
  done
  echo "Redeploy Vercel so the new key is built in."
fi
echo "Done."
