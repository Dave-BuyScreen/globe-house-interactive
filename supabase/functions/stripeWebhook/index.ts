import { createClientFromRequest, serve } from '../_shared/base44.ts';
import Stripe from 'npm:stripe@17.5.0';
import { serviceClient } from '../_shared/viewer.ts';

// Checked per request (not at boot) so a missing key returns a readable JSON error with CORS
// headers instead of crashing the worker, which browsers report as a vague CORS failure.
const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: '2024-12-18.acacia' }) : null;
const stripeMissing = () =>
  Response.json({ error: 'Payments are not configured yet (STRIPE_SECRET_KEY is not set)' }, { status: 503 });

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

serve(async (req) => {
  if (!stripe) return stripeMissing();
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature || !webhookSecret) {
      return Response.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
    }

    // Verify webhook signature
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Viewer tiers: memberships, title purchases and rentals (see createCheckoutSession).
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      await handleViewerCheckout(event.data.object as Stripe.Checkout.Session);
    }
    if (event.type.startsWith('customer.subscription.')) {
      // Stripe can deliver these out of order; always save the subscription's current state.
      const sub = event.data.object as Stripe.Subscription;
      if (sub.metadata?.gh_kind === 'subscription') await syncSubscription(await stripe.subscriptions.retrieve(sub.id));
    }

    // BuyScreen product purchases. Viewer-tier payments and membership invoices are handled
    // above and must not create product orders or fee splits.
    const isViewerPayment = (pi: Stripe.PaymentIntent) => Boolean(pi.metadata?.gh_kind || pi.invoice);

    if (event.type === 'payment_intent.succeeded' && !isViewerPayment(event.data.object)) {
      const pi = event.data.object;
      const md = pi.metadata || {};

      // Create Order record (existing behavior)
      await base44.asServiceRole.entities.Order.create({
        user_email: md.user_email || '',
        customer_name: md.user_name || '',
        product_name: md.product_name || '',
        product_description: md.product_description || '',
        amount: pi.amount / 100,
        currency: pi.currency,
        stripe_payment_intent_id: pi.id,
        episode_id: md.episode_id || '',
        trigger_timestamp: parseFloat(md.trigger_timestamp) || 0,
        status: 'completed'
      });

      // Create Transaction record for split-payment distribution
      const tx = await base44.asServiceRole.entities.Transaction.create({
        stripe_payment_intent_id: pi.id,
        customer_email: md.user_email || '',
        customer_name: md.user_name || '',
        merchant_id: md.merchant_id || '',
        creator_id: md.creator_id || '',
        product_id: md.product_id || '',
        episode_id: md.episode_id || '',
        trigger_timestamp: parseFloat(md.trigger_timestamp) || 0,
        gross_amount: pi.amount,
        currency: pi.currency,
        status: 'succeeded',
        metadata: JSON.stringify({ transfer_group: md.transfer_group || '' }),
      });

      // Trigger fee distribution + Stripe Connect transfers
      try {
        await base44.asServiceRole.functions.invoke('distributeTransactionFees', {
          transaction_id: tx.id
        });
      } catch (distErr) {
        console.error('Fee distribution failed:', distErr.message);
      }

      console.log('Transaction + Order created for payment:', pi.id);
    }

    if (event.type === 'payment_intent.payment_failed' && !isViewerPayment(event.data.object)) {
      const pi = event.data.object;
      const md = pi.metadata || {};

      await base44.asServiceRole.entities.Order.create({
        user_email: md.user_email || '',
        customer_name: md.user_name || '',
        product_name: md.product_name || '',
        product_description: md.product_description || '',
        amount: pi.amount / 100,
        currency: pi.currency,
        stripe_payment_intent_id: pi.id,
        episode_id: md.episode_id || '',
        trigger_timestamp: parseFloat(md.trigger_timestamp) || 0,
        status: 'failed'
      });

      console.log('Failed payment recorded:', pi.id);
    }

    return Response.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// ---- Viewer tiers -------------------------------------------------------------------------
async function handleViewerCheckout(session: Stripe.Checkout.Session) {
  const md = session.metadata || {};
  if (!md.gh_kind || !md.user_id) return; // not a viewer-tier checkout
  if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') return;
  const sb = serviceClient();
  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;

  if (md.gh_kind === 'subscription') {
    const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
    if (subId) await syncSubscription(await stripe!.subscriptions.retrieve(subId));
    return;
  }

  const { data: profile } = await sb.from('profiles').select('email').eq('id', md.user_id).maybeSingle();
  const hours = parseInt(md.rental_hours || '0', 10) || 48;
  const { error } = await sb.from('entitlement').upsert({
    user_id: md.user_id,
    user_email: profile?.email || session.customer_details?.email || null,
    kind: md.gh_kind === 'rental' ? 'rental' : 'purchase',
    episode_id: md.episode_id,
    status: 'active',
    amount: (session.amount_total || 0) / 100,
    currency: session.currency,
    // Rental clock starts at payment.
    expires_at: md.gh_kind === 'rental' ? new Date(Date.now() + hours * 3600_000).toISOString() : null,
    stripe_customer_id: customerId,
    stripe_checkout_session_id: session.id,
    updated_date: new Date().toISOString(),
  }, { onConflict: 'stripe_checkout_session_id', ignoreDuplicates: true });
  if (error) throw new Error(`Saving ${md.gh_kind} failed: ${error.message}`);
  console.log(`Viewer ${md.gh_kind} recorded:`, session.id);
}

async function syncSubscription(sub: Stripe.Subscription) {
  if (sub.metadata?.gh_kind !== 'subscription') return; // some other Stripe subscription
  const sb = serviceClient();
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  let userId = sub.metadata.user_id;
  if (!userId) {
    const { data } = await sb.from('stripe_customer').select('user_id').eq('customer_id', customerId).maybeSingle();
    userId = data?.user_id;
  }
  if (!userId) { console.error('No user for subscription', sub.id); return; }

  const item = sub.items?.data?.[0];
  // deno-lint-ignore no-explicit-any
  const periodEnd = (sub as any).current_period_end ?? (item as any)?.current_period_end;
  const { data: profile } = await sb.from('profiles').select('email').eq('id', userId).maybeSingle();
  const { error } = await sb.from('entitlement').upsert({
    user_id: userId,
    user_email: profile?.email || null,
    kind: 'subscription',
    status: sub.status, // active, trialing, past_due, canceled, unpaid, incomplete...
    plan_interval: item?.price?.recurring?.interval || null,
    amount: (item?.price?.unit_amount || 0) / 100,
    currency: sub.currency,
    expires_at: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    stripe_customer_id: customerId,
    stripe_subscription_id: sub.id,
    updated_date: new Date().toISOString(),
  }, { onConflict: 'stripe_subscription_id' });
  if (error) throw new Error(`Saving subscription failed: ${error.message}`);
  console.log('Subscription synced:', sub.id, sub.status);
}
