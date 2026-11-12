// Browser-side Base44 Core.InvokeLLM goes through here so the API key stays on the server.
import { createClientFromRequest, invokeLLM, serve } from '../_shared/base44.ts';

serve(async (req) => {
  try {
    const user = await createClientFromRequest(req).auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const params = await req.json();
    if (!params?.prompt) return Response.json({ error: 'prompt is required' }, { status: 400 });
    return Response.json(await invokeLLM(params));
  } catch (error) {
    // deno-lint-ignore no-explicit-any
    const e = error as any;
    return Response.json({ error: e.message }, { status: e.status || 500 });
  }
});
