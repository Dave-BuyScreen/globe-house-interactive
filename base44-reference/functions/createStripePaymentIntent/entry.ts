import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@17.5.0';

const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
if (!stripeKey) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set');
}

const stripe = new Stripe(stripeKey, {
  apiVersion: '2024-12-18.acacia',
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Public app — auth is optional; fall back to body-provided customer info
    let user = null;
    try { user = await base44.auth.me(); } catch (_) { /* not logged in */ }

    const {
      amount,
      currency,
      product_name,
      product_description,
      episode_id,
      trigger_timestamp,
      merchant_id,
      creator_id,
      product_id,
      customer_email,
      customer_name
    } = await req.json();

    if (!amount || !currency || !product_name) {
      return Response.json({ error: 'amount, currency, and product_name are required' }, { status: 400 });
    }

    const amountInCents = Math.round(amount * 100);
    const transferGroup = `buyscreen_${Date.now()}_${product_name.slice(0, 20).replace(/\s+/g, '_')}`;

    // Create a payment intent with a transfer group so we can split the payment
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      description: `Purchase: ${product_name}`,
      transfer_group: transferGroup,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID') || '',
        product_name,
        product_description: product_description || '',
        user_email: customer_email || user?.email || '',
        user_name: customer_name || user?.full_name || '',
        episode_id: episode_id || '',
        trigger_timestamp: trigger_timestamp?.toString() || '',
        merchant_id: merchant_id || '',
        creator_id: creator_id || '',
        product_id: product_id || '',
        transfer_group: transferGroup,
      },
    });

    return Response.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      transferGroup,
    });

  } catch (error) {
    console.error('Stripe payment intent error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});