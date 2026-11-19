// Starts a Stripe Checkout for a viewer: a membership (subscription) or buying / renting one
// title (TVOD or The Vault). Access is granted later by stripeWebhook, never here.
import { serve } from '../_shared/base44.ts';
import {
  getOrCreateCustomer, requestUser, returnBase, safePath, serviceClient, stripe, stripeMissing, toCents,
} from '../_shared/viewer.ts';

serve(async (req) => {
  if (!stripe) return stripeMissing();
  try {
    const user = await requestUser(req);
    if (!user) return Response.json({ error: 'Please sign in first' }, { status: 401 });

    const { kind, interval = 'month', episode_id, return_path } = await req.json();
    if (!['subscription', 'purchase', 'rental'].includes(kind)) {
      return Response.json({ error: 'kind must be subscription, purchase or rental' }, { status: 400 });
    }

    const sb = serviceClient();
    const { data: settings } = await sb.from('monetization_settings').select('*').eq('id', 'default').single();
    const currency = (settings?.currency || 'usd').toLowerCase();
    const path = safePath(return_path);
    const base = returnBase(req);
    const sep = path.includes('?') ? '&' : '?';
    const success_url = `${base}${path}${sep}checkout=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancel_url = `${base}${path}${sep}checkout=cancel`;

    if (kind === 'subscription') {
      if (!['month', 'year'].includes(interval)) {
        return Response.json({ error: 'interval must be month or year' }, { status: 400 });
      }
      const { data: active } = await sb.rpc('gh_has_subscription', { uid: user.id });
      if (active) return Response.json({ error: 'You already have an active membership' }, { status: 409 });

      const price = interval === 'year' ? settings?.subscription_yearly_price : settings?.subscription_monthly_price;
      if (!(Number(price) > 0)) return Response.json({ error: 'Membership price is not set' }, { status: 400 });

      const customer = await getOrCreateCustomer(sb, user);
      const metadata = { gh_kind: 'subscription', user_id: user.id };
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        ui_mode: 'hosted', // stripe SDK 17.5 (< 21) uses 'hosted'; 'hosted_page' on SDK 21+
        billing_address_collection: 'auto',
        phone_number_collection: { enabled: false },
        automatic_tax: { enabled: false },
        allow_promotion_codes: false,
        submit_type: 'auto',
        integration_identifier: 'hosted_mobile_app_0001',
        origin_context: 'web',
        payment_method_collection: 'always',
        customer,
        client_reference_id: user.id,
        line_items: [{
          quantity: 1,
          price_data: {
            currency,
            unit_amount: toCents(price),
            recurring: { interval },
            product_data: { name: settings?.subscription_name || 'GlobeHouse Membership' },
          },
        }],
        metadata,
        subscription_data: { metadata },
        success_url,
        cancel_url,
      });
      return Response.json({ url: session.url });
    }

    // purchase / rental of one title
    if (!episode_id) return Response.json({ error: 'episode_id is required' }, { status: 400 });
    const { data: ep } = await sb.from('episode')
      .select('id, title, status, access_tier, purchase_price, rental_price, rental_hours')
      .eq('id', episode_id).maybeSingle();
    if (!ep || ep.status !== 'published') return Response.json({ error: 'Title not found' }, { status: 404 });
    if (!['tvod', 'vault'].includes(ep.access_tier)) {
      return Response.json({ error: 'This title is not sold individually' }, { status: 400 });
    }
    const price = kind === 'rental' ? ep.rental_price : ep.purchase_price;
    if (!(Number(price) > 0)) {
      return Response.json({ error: `This title can't be ${kind === 'rental' ? 'rented' : 'bought'}` }, { status: 400 });
    }

    const { data: owned } = await sb.from('entitlement').select('id').eq('user_id', user.id)
      .eq('episode_id', ep.id).eq('kind', 'purchase').eq('status', 'active').limit(1);
    if (owned?.length) return Response.json({ error: 'You already own this title' }, { status: 409 });

    const hours = ep.rental_hours || settings?.default_rental_hours || 48;
    const label = kind === 'rental' ? `${ep.title} (${hours}-hour rental)` : ep.title;
    const metadata = {
      gh_kind: kind,
      user_id: user.id,
      episode_id: ep.id,
      rental_hours: kind === 'rental' ? String(hours) : '',
    };
    const customer = await getOrCreateCustomer(sb, user);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      ui_mode: 'hosted', // stripe SDK 17.5 (< 21) uses 'hosted'; 'hosted_page' on SDK 21+
      billing_address_collection: 'auto',
      phone_number_collection: { enabled: false },
      automatic_tax: { enabled: false },
      allow_promotion_codes: false,
      submit_type: 'auto',
      integration_identifier: 'hosted_mobile_app_0001',
      origin_context: 'web',
      customer,
      client_reference_id: user.id,
      line_items: [{ quantity: 1, price_data: { currency, unit_amount: toCents(price), product_data: { name: label } } }],
      metadata,
      payment_intent_data: { metadata, description: label },
      success_url,
      cancel_url,
    });
    return Response.json({ url: session.url });
  } catch (error) {
    console.error('createCheckoutSession error:', error);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
});
