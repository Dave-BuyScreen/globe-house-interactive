import { createClientFromRequest, serve } from '../_shared/base44.ts';

serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { prompt } = await req.json();
    if (!prompt) return Response.json({ error: "prompt is required" }, { status: 400 });

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a UBPL (Universal BuyScreen Prompt Language) parser for the GlobeHouse AR commerce platform.

Parse the following UBPL prompt and convert it into a Scene DNA JSON object.

UBPL Prompt:
"""
${prompt}
"""

Rules:
- Extract all [BuyScreen:Scene] block fields: Title, VimeoID, Environment, Style, Lighting
- Extract all [BuyScreen:Object] blocks. Each becomes an entry in the "objects" array.
- For each object, generate a unique object_id like "furniture_001", "apparel_002" based on category + index.
- If Timestamp is provided, convert to visibility_frames.start = "00:MM:SS" and end = start + 15 seconds.
- spatial_coordinates: if Placement contains "Worn", use { "attached_to": "subject_head" }; otherwise use { "x": 0.5, "y": 0.65, "z": 0.2 }.
- bounding_box default: { "width": 0.35, "height": 0.25 }
- commerce.trigger = "BuyScreen_overlay", affiliate_enabled = true always.
- ARCompatible "True" → ar_supported: true, else false.
- interaction_type always = "tap_to_buy"
- video_format always = { "resolution": "4K", "fps": 30, "codec": "H264", "container": "MP4" }
- Generate a scene_id: "scene_" + slugified title + "_" + short random suffix.
- Include generated_at as current ISO timestamp.

Validation:
- errors: array of strings for any missing required fields (Name, Brand, Category per object; Title for scene)
- warnings: array of strings for recommended but missing fields (VimeoID, Color, Timestamp)

Return ONLY valid JSON in this exact structure.`,
      response_json_schema: {
        type: "object",
        properties: {
          scene_dna: {
            type: "object",
            properties: {
              scene_id: { type: "string" },
              scene_title: { type: "string" },
              vimeo_id: { type: "string" },
              generated_at: { type: "string" },
              video_format: { type: "object" },
              environment: { type: "object" },
              objects: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    object_id: { type: "string" },
                    name: { type: "string" },
                    brand: { type: "string" },
                    category: { type: "string" },
                    color: { type: "string" },
                    spatial_coordinates: { type: "object" },
                    bounding_box: { type: "object" },
                    visibility_frames: { type: "object" },
                    interaction_type: { type: "string" },
                    track_priority: { type: "string" },
                    commerce: { type: "object" }
                  }
                }
              }
            }
          },
          errors: { type: "array", items: { type: "string" } },
          warnings: { type: "array", items: { type: "string" } }
        }
      }
    });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});