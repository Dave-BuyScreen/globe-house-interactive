// Shared helpers for viewer tiers (subscription / TVOD / Vault checkout and billing).
import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@2.45.4';
import Stripe from 'npm:stripe@17.5.0';

const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
export const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: '2024-12-18.acacia' }) : null;
export const stripeMissing = () =>
  Response.json({ error: 'Payments are not configured yet (STRIPE_SECRET_KEY is not set)' }, { status: 503 });

export const serviceClient = () =>
  createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });

// The signed-in Supabase user behind the request, or null.
export async function requestUser(req: Request) {
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data } = await serviceClient().auth.getUser(token);
  return data?.user ?? null;
}

// Where Stripe sends the viewer back. Only a path is accepted from the client; the site comes
// from the browser's Origin header (or SITE_URL), so this can't be used as an open redirect.
export function returnBase(req: Request) {
  const origin = req.headers.get('origin');
  if (origin && /^https?:\/\/[^/]+$/.test(origin)) return origin;
  return Deno.env.get('SITE_URL') || 'https://www.ghitv.com';
}
export const safePath = (p: unknown) =>
  typeof p === 'string' && p.startsWith('/') && !p.startsWith('//') ? p : '/Subscribe';

export async function getOrCreateCustomer(sb: SupabaseClient, user: { id: string; email?: string }) {
  const { data: row } = await sb.from('stripe_customer').select('customer_id').eq('user_id', user.id).maybeSingle();
  if (row?.customer_id) return row.customer_id as string;
  const customer = await stripe!.customers.create({ email: user.email, metadata: { user_id: user.id } });
  const { error } = await sb.from('stripe_customer').insert({ user_id: user.id, customer_id: customer.id });
  if (error) {
    // Lost a race with a parallel request: use the row that won.
    const { data: again } = await sb.from('stripe_customer').select('customer_id').eq('user_id', user.id).single();
    return again.customer_id as string;
  }
  return customer.id;
}

export const toCents = (amount: unknown) => Math.round(Number(amount) * 100);
