// Drop-in replacement for the Base44 SDK client, backed by Supabase.
// Pages keep calling base44.entities.X.list(), base44.auth.me(), etc. exactly as they
// did on Base44; this file translates those calls to Supabase tables, auth, storage
// and edge functions.
import { supabase } from '@/lib/supabase';
import entityTables from './entity-tables.json';

const requireClient = () => {
  if (!supabase) throw new Error('Supabase is not configured');
  return supabase;
};

const httpError = (message, status, data) => Object.assign(new Error(message), { status, data });

// Base44 sort strings: "-created_date" = descending, "title" = ascending
const applySort = (q, sort) => {
  if (!sort || typeof sort !== 'string') return q;
  const desc = sort.startsWith('-');
  return q.order(desc ? sort.slice(1) : sort, { ascending: !desc, nullsFirst: false });
};

const applyFilter = (q, query = {}) => {
  for (const [key, value] of Object.entries(query || {})) {
    if (value === undefined) continue;
    if (value === null) q = q.is(key, null);
    else if (Array.isArray(value)) q = q.in(key, value);
    else if (typeof value === 'object' && value.$in) q = q.in(key, value.$in);
    else if (typeof value === 'object' && value.$ne !== undefined) q = q.neq(key, value.$ne);
    else q = q.eq(key, value);
  }
  return q;
};

const unwrap = ({ data, error, status }) => {
  if (error) throw httpError(error.message, status || 400, error);
  return data;
};

// Drop keys Supabase would reject (Base44 lets clients send read-only fields)
const clean = (row) => {
  if (!row || typeof row !== 'object') return row;
  const { id, created_date, updated_date, created_by, created_by_id, ...rest } = row;
  return rest;
};

const makeEntity = (name) => {
  const table = entityTables[name];
  if (!table) throw new Error(`Unknown entity: ${name}`);
  const from = () => requireClient().from(table);
  return {
    async list(sort, limit, skip) {
      let q = applySort(from().select('*'), sort);
      if (limit) q = q.range(skip || 0, (skip || 0) + limit - 1);
      return unwrap(await q);
    },
    async filter(query, sort, limit, skip) {
      let q = applySort(applyFilter(from().select('*'), query), sort);
      if (limit) q = q.range(skip || 0, (skip || 0) + limit - 1);
      return unwrap(await q);
    },
    async get(id) {
      const row = unwrap(await from().select('*').eq('id', id).maybeSingle());
      if (!row) throw httpError(`${name} not found`, 404);
      return row;
    },
    async create(data) {
      return unwrap(await from().insert(clean(data)).select().single());
    },
    async bulkCreate(rows) {
      return unwrap(await from().insert((rows || []).map(clean)).select());
    },
    async update(id, data) {
      return unwrap(await from().update(clean(data)).eq('id', id).select().single());
    },
    async delete(id) {
      unwrap(await from().delete().eq('id', id));
      return { id };
    },
    async deleteMany(query) {
      unwrap(await applyFilter(from().delete(), query));
      return {};
    },
    subscribe(callback) {
      const channel = requireClient()
        .channel(`${table}-changes-${Math.random().toString(36).slice(2)}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) =>
          callback({ type: payload.eventType.toLowerCase(), data: payload.new, old: payload.old }))
        .subscribe();
      return () => requireClient().removeChannel(channel);
    },
  };
};

const entityCache = {};
const entities = new Proxy({}, {
  get(_, name) {
    if (typeof name !== 'string') return undefined;
    return (entityCache[name] ||= makeEntity(name));
  },
});

const loginUrl = (from) => `/login?from_url=${encodeURIComponent(from || window.location.href)}`;

const auth = {
  // Returns the signed-in user merged with their profile (role, full_name).
  // Throws a 401 error when signed out, like the Base44 SDK.
  async me() {
    const sb = requireClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) throw httpError('Not authenticated', 401);
    const { data: profile } = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle();
    return {
      id: user.id,
      email: user.email,
      full_name: profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0],
      role: profile?.role || 'user',
      created_date: profile?.created_date || user.created_at,
      ...(user.user_metadata || {}),
      ...(profile || {}),
    };
  },
  async isAuthenticated() {
    const { data: { session } } = await requireClient().auth.getSession();
    return Boolean(session);
  },
  async updateMe(data) {
    const sb = requireClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) throw httpError('Not authenticated', 401);
    const { role, id, email, ...meta } = data || {};
    if (meta.full_name) {
      await sb.from('profiles').update({ full_name: meta.full_name }).eq('id', user.id);
    }
    await sb.auth.updateUser({ data: meta });
    return auth.me();
  },
  redirectToLogin(fromUrl) {
    window.location.href = loginUrl(fromUrl);
  },
  async logout(redirectUrl) {
    await requireClient().auth.signOut();
    if (redirectUrl) window.location.href = redirectUrl;
  },
};

const UploadFile = async ({ file }) => {
  const sb = requireClient();
  const ext = (file?.name || '').split('.').pop();
  const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}${ext ? `.${ext}` : ''}`;
  const { error } = await sb.storage.from('uploads').upload(path, file, {
    contentType: file?.type || undefined,
    upsert: false,
  });
  if (error) throw httpError(error.message, 400, error);
  const { data } = sb.storage.from('uploads').getPublicUrl(path);
  return { file_url: data.publicUrl };
};

const invokeFunction = async (name, payload) => {
  const { data, error } = await requireClient().functions.invoke(name, { body: payload ?? {} });
  if (error) {
    let detail;
    try { detail = await error.context?.json?.(); } catch { /* ignore */ }
    throw httpError(detail?.error || error.message, error.context?.status || 500, detail);
  }
  // Base44 functions.invoke resolves to an axios-style response: { data }
  return { data };
};

const integrations = {
  Core: {
    UploadFile,
    InvokeLLM: async (params) => (await invokeFunction('invokeLLM', params)).data,
  },
};

export const base44 = {
  entities,
  auth,
  integrations,
  functions: { invoke: invokeFunction },
  appLogs: { logUserInApp: async () => {} },
};

export default base44;
