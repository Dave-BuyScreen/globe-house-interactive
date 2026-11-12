// Server-side stand-in for the Base44 SDK (`createClientFromRequest`) on Supabase Edge Functions.
// Ported functions keep their original code; only the import line and Deno.serve -> serve change.
import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@2.45.4';
import Anthropic from 'npm:@anthropic-ai/sdk';
import entityTables from './entity-tables.json' with { type: 'json' };
import entityColumns from './entity-columns.json' with { type: 'json' };

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// Deno.serve wrapper that answers CORS preflight and adds CORS headers to every response.
export function serve(handler: (req: Request) => Response | Promise<Response>) {
  return Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
    const res = await handler(req);
    const headers = new Headers(res.headers);
    for (const [k, v] of Object.entries(corsHeaders)) headers.set(k, v);
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
  });
}

const httpError = (message: string, status: number) => Object.assign(new Error(message), { status });

// Keep only real columns: Base44 silently accepted unknown/read-only fields, Postgres rejects them.
const clean = (name: string, row: Record<string, unknown>) => {
  if (!row || typeof row !== 'object') return row;
  const allowed = new Set((entityColumns as Record<string, string[]>)[name] || []);
  return Object.fromEntries(Object.entries(row).filter(([k]) => allowed.has(k)));
};

// Base44 omits never-set fields; Postgres returns null. Match Base44.
// deno-lint-ignore no-explicit-any
const stripNulls = (row: any) =>
  row && typeof row === 'object' && !Array.isArray(row)
    ? Object.fromEntries(Object.entries(row).filter(([, v]) => v !== null))
    : row;

function makeEntities(sb: SupabaseClient) {
  const make = (name: string) => {
    const table = (entityTables as Record<string, string>)[name];
    if (!table) throw new Error(`Unknown entity: ${name}`);
    // deno-lint-ignore no-explicit-any
    const sort = (q: any, s?: string) => {
      if (!s) return q;
      const desc = s.startsWith('-');
      return q.order(desc ? s.slice(1) : s, { ascending: !desc, nullsFirst: false });
    };
    // deno-lint-ignore no-explicit-any
    const filt = (q: any, query: Record<string, unknown> = {}) => {
      for (const [k, v] of Object.entries(query || {})) {
        if (v === undefined) continue;
        q = v === null ? q.is(k, null) : Array.isArray(v) ? q.in(k, v) : q.eq(k, v);
      }
      return q;
    };
    // deno-lint-ignore no-explicit-any
    const unwrap = ({ data, error }: any) => {
      if (error) throw httpError(error.message, 400);
      return Array.isArray(data) ? data.map(stripNulls) : stripNulls(data);
    };
    return {
      list: async (s?: string, limit?: number) => {
        let q = sort(sb.from(table).select('*'), s);
        if (limit) q = q.limit(limit);
        return unwrap(await q);
      },
      filter: async (query: Record<string, unknown>, s?: string, limit?: number) => {
        let q = sort(filt(sb.from(table).select('*'), query), s);
        if (limit) q = q.limit(limit);
        return unwrap(await q);
      },
      get: async (id: string) => unwrap(await sb.from(table).select('*').eq('id', id).maybeSingle()),
      create: async (data: Record<string, unknown>) => unwrap(await sb.from(table).insert(clean(name, data)).select().single()),
      bulkCreate: async (rows: Record<string, unknown>[]) => unwrap(await sb.from(table).insert(rows.map((r) => clean(name, r))).select()),
      update: async (id: string, data: Record<string, unknown>) =>
        unwrap(await sb.from(table).update(clean(name, data)).eq('id', id).select().single()),
      delete: async (id: string) => { unwrap(await sb.from(table).delete().eq('id', id)); return { id }; },
    };
  };
  const cache: Record<string, ReturnType<typeof make>> = {};
  return new Proxy({} as Record<string, ReturnType<typeof make>>, {
    get: (_, name: string) => (cache[name] ||= make(name)),
  });
}

// Base44 schemas omit additionalProperties; structured outputs require it on every object.
// deno-lint-ignore no-explicit-any
function strictSchema(schema: any): any {
  if (!schema || typeof schema !== 'object') return schema;
  if (Array.isArray(schema)) return schema.map(strictSchema);
  // deno-lint-ignore no-explicit-any
  const out: any = {};
  for (const [k, v] of Object.entries(schema)) {
    if (k === 'description' || k === 'default') { out[k] = v; continue; }
    out[k] = strictSchema(v);
  }
  if (out.type === 'object' && out.properties) {
    out.additionalProperties = false;
    out.required = Object.keys(out.properties);
  }
  return out;
}

let anthropic: Anthropic | null = null;

// Base44 Core.InvokeLLM -> Claude. Returns parsed JSON when response_json_schema is given, else text.
export async function invokeLLM(params: {
  prompt: string;
  file_urls?: string[];
  response_json_schema?: Record<string, unknown>;
  add_context_from_internet?: boolean;
}) {
  if (!Deno.env.get('ANTHROPIC_API_KEY')) throw httpError('ANTHROPIC_API_KEY secret is not set', 500);
  anthropic ||= new Anthropic();
  const images = (params.file_urls || []).map((url) => ({ type: 'image' as const, source: { type: 'url' as const, url } }));
  // deno-lint-ignore no-explicit-any
  const request: any = {
    model: 'claude-opus-5-5',
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    messages: [{ role: 'user', content: [...images, { type: 'text', text: params.prompt }] }],
  };
  if (params.response_json_schema) {
    request.output_config = { format: { type: 'json_schema', schema: strictSchema(params.response_json_schema) } };
  }
  if (params.add_context_from_internet) {
    request.tools = [{ type: 'web_search_20260209', name: 'web_search', max_uses: 5 }];
  }
  const response = await anthropic.beta.messages.create(request);
  if (response.stop_reason === 'refusal') throw httpError('The AI model declined this request', 422);
  const text = response.content
    // deno-lint-ignore no-explicit-any
    .filter((b: any) => b.type === 'text')
    // deno-lint-ignore no-explicit-any
    .map((b: any) => b.text)
    .join('');
  return params.response_json_schema ? JSON.parse(text) : text;
}

async function uploadFile(sb: SupabaseClient, { file }: { file: Blob & { name?: string } }) {
  const ext = (file?.name || '').split('.').pop();
  const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}${ext ? `.${ext}` : ''}`;
  const { error } = await sb.storage.from('uploads').upload(path, file, { contentType: file?.type || undefined });
  if (error) throw httpError(error.message, 400);
  return { file_url: sb.storage.from('uploads').getPublicUrl(path).data.publicUrl };
}

export function createClientFromRequest(req: Request) {
  const authHeader = req.headers.get('Authorization') ?? '';
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const serviceClient = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  const invoke = async (name: string, body: unknown) => {
    const { data, error } = await serviceClient.functions.invoke(name, { body: body ?? {} });
    if (error) throw error;
    return { data };
  };
  const integrations = {
    Core: {
      InvokeLLM: invokeLLM,
      UploadFile: (args: { file: Blob }) => uploadFile(serviceClient, args),
    },
  };

  return {
    auth: {
      async me() {
        const { data: { user } } = await userClient.auth.getUser();
        if (!user) return null; // Base44 functions check `if (!user)` / `user?.role`
        const { data: profile } = await serviceClient.from('profiles').select('*').eq('id', user.id).maybeSingle();
        return { id: user.id, email: user.email, role: profile?.role || 'user', full_name: profile?.full_name, ...(profile || {}) };
      },
    },
    entities: makeEntities(userClient),
    integrations,
    functions: { invoke },
    asServiceRole: {
      entities: makeEntities(serviceClient),
      integrations,
      functions: { invoke },
    },
  };
}
