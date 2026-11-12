import { createClientFromRequest, serve } from '../_shared/base44.ts';
import Stripe from 'npm:stripe@17.5.0';

const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
if (!stripeKey) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set');
}

const stripe = new Stripe(stripeKey, {
  apiVersion: '2024-12-18.acacia',
});

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

serve(async (req) => {
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

    if (event.type === 'payment_intent.succeeded') {
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

    if (event.type === 'payment_intent.payment_failed') {
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