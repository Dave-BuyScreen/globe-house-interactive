import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const schedule = await base44.asServiceRole.entities.LiveChannelSchedule.list();

    const now = new Date();
    const current = schedule.find(s => {
      const start = new Date(s.start_time);
      const end = new Date(s.end_time);
      return start <= now && now <= end;
    });

    if (!current) {
      return Response.json({ trigger: null, message: "No program currently airing" });
    }

    if (!current.ar_trigger_enabled) {
      return Response.json({ trigger: null, program: { id: current.id, title: current.title } });
    }

    const offsetSeconds = Math.max(0, Math.floor((now - new Date(current.start_time)) / 1000));

    return Response.json({
      trigger: {
        program_id: current.id,
        program_title: current.title,
        trigger_timestamp: current.trigger_timestamp,
        product_id: current.product_id,
        product_link: current.product_link,
        ar_trigger_enabled: current.ar_trigger_enabled,
        offset_seconds: offsetSeconds
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});