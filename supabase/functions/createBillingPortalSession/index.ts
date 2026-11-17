// Opens Stripe's billing portal so a member can update their card or cancel.
// Needs the portal saved once in Stripe: Settings → Billing → Customer portal.
import { serve } from '../_shared/base44.ts';
import { requestUser, returnBase, safePath, serviceClient, stripe, stripeMissing } from '../_shared/viewer.ts';

serve(async (req) => {
  if (!stripe) return stripeMissing();
  try {
    const user = await requestUser(req);
    if (!user) return Response.json({ error: 'Please sign in first' }, { status: 401 });
    const { return_path } = await req.json().catch(() => ({}));

    const { data: row } = await serviceClient().from('stripe_customer')
      .select('customer_id').eq('user_id', user.id).maybeSingle();
    if (!row) return Response.json({ error: 'No billing account yet' }, { status: 404 });

    const session = await stripe.billingPortal.sessions.create({
      customer: row.customer_id,
      return_url: `${returnBase(req)}${safePath(return_path)}`,
    });
    return Response.json({ url: session.url });
  } catch (error) {
    console.error('createBillingPortalSession error:', error);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
});
