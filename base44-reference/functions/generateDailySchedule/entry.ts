import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { target_date, days = 1 } = await req.json();

    const library = await base44.asServiceRole.entities.ChannelContentLibrary.list();

    if (library.length === 0) {
      return Response.json({ error: 'Content library is empty. Add videos first.' }, { status: 400 });
    }

    const scheduleDate = target_date || new Date().toISOString().split('T')[0];

    const prompt = `
You are an AI TV channel scheduler for GlobeHouse, a premium arts and entertainment streaming platform.

Scheduling date: ${scheduleDate}
Days to schedule: ${days}

Content Library:
${JSON.stringify(library.map(v => ({
  id: v.id,
  title: v.title,
  duration_seconds: v.duration_seconds || 1800,
  category: v.category || 'other',
  priority_score: v.priority_score || 5,
  is_featured: v.is_featured || false,
  allowed_time_blocks: v.allowed_time_blocks || ['morning','afternoon','primetime','latenight','overnight']
})), null, 2)}

Time blocks per day:
- Morning: 06:00–12:00
- Afternoon: 12:00–18:00
- Prime Time: 18:00–22:00
- Late Night: 22:00–02:00
- Overnight: 02:00–06:00

Rules:
1. Fill the full 24-hour schedule with zero gaps.
2. Featured content (is_featured=true) goes in Prime Time blocks.
3. Higher priority_score = schedule more frequently.
4. Do not repeat the same video within 12 hours.
5. Respect allowed_time_blocks (if empty, allow any time).
6. Use duration_seconds to calculate exact start_time and end_time in ISO 8601 format.
7. Day starts at ${scheduleDate}T06:00:00 and runs 24h.

Return a JSON object with a "schedule" array. Each entry: { content_id, title, start_time (ISO 8601), end_time (ISO 8601), category }
`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          schedule: {
            type: "array",
            items: {
              type: "object",
              properties: {
                content_id: { type: "string" },
                title: { type: "string" },
                start_time: { type: "string" },
                end_time: { type: "string" },
                category: { type: "string" }
              }
            }
          }
        }
      }
    });

    const scheduleEntries = result.schedule || [];
    const contentMap = {};
    library.forEach(v => { contentMap[v.id] = v; });

    const created = [];
    for (const entry of scheduleEntries) {
      const content = contentMap[entry.content_id];
      const item = {
        title: entry.title || content?.title || 'Untitled',
        description: content?.description || '',
        vimeo_embed_url: content?.vimeo_embed_url || '',
        start_time: entry.start_time,
        end_time: entry.end_time,
        duration_minutes: content?.duration_seconds ? Math.round(content.duration_seconds / 60) : 30,
        thumbnail: content?.thumbnail || '',
        category: entry.category || content?.category || 'other',
        ar_trigger_enabled: false
      };
      const rec = await base44.asServiceRole.entities.LiveChannelSchedule.create(item);
      created.push(rec);
    }

    return Response.json({
      success: true,
      message: `Generated ${created.length} schedule entries for ${days} day(s).`,
      entries_count: created.length
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});