import { createClientFromRequest, serve } from '../_shared/base44.ts';

serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { episode_id, frame_interval = 2 } = await req.json();

    if (!episode_id) {
      return Response.json({ error: 'episode_id is required' }, { status: 400 });
    }

    // Fetch episode
    const episode = await base44.entities.Episode.get(episode_id);
    if (!episode) {
      return Response.json({ error: 'Episode not found' }, { status: 404 });
    }

    // BuyScreen Master Prompt integrated into analysis
    const analysisPrompt = `
You are analyzing video frames from a high-quality video (4K, 30fps, H.264/MP4 with minimal compression).

For each frame, identify all purchasable products/items that are clearly visible and suitable for e-commerce.

For EACH detected product, return:
1. product_name: Clear, marketable product name
2. product_category: Type of product (clothing, furniture, electronics, accessories, etc.)
3. bounding_box: Location in frame as percentages {x, y, width, height} where (0,0) is top-left
4. confidence: Your confidence score 0-1 (only include items with confidence > 0.5)
5. timestamp: Approximate time in video (in seconds)
6. description: Brief product description for marketing

Return as JSON array of detected products.
`;

    // In a real implementation, you would:
    // 1. Extract frames from the video at intervals
    // 2. Send each frame to AI for analysis
    // 3. Aggregate results
    
    // For now, this is a simplified example that demonstrates the flow
    const detectedProducts = await base44.integrations.Core.InvokeLLM({
      prompt: `${analysisPrompt}\n\nAnalyze this video and identify purchasable products. Video URL: ${episode.vimeo_url}\n\nNote: This is a demonstration. In production, you would send actual video frames.`,
      response_json_schema: {
        type: "object",
        properties: {
          products: {
            type: "array",
            items: {
              type: "object",
              properties: {
                product_name: { type: "string" },
                product_category: { type: "string" },
                confidence: { type: "number" },
                timestamp: { type: "number" },
                description: { type: "string" },
                bounding_box: {
                  type: "object",
                  properties: {
                    x: { type: "number" },
                    y: { type: "number" },
                    width: { type: "number" },
                    height: { type: "number" }
                  }
                }
              }
            }
          }
        }
      },
      model: "gemini_3_pro"
    });

    // Convert detected products to trigger format
    const existingTriggers = episode.triggers || [];
    const newTriggers = detectedProducts.products.map(product => ({
      trigger_type: "buyscreen_only",
      timestamp: product.timestamp,
      product_name: product.product_name,
      product_description: product.description,
      product_price: "", // To be filled by admin or auto-matching
      product_brand: "", // To be filled by admin or auto-matching
      shop_url: "", // To be filled by admin or auto-matching
      detection_status: "auto_detected",
      confidence_score: product.confidence,
      bounding_box: product.bounding_box,
      duration: 5, // Default 5 second visibility
      prompt_text: `Check out this ${product.product_name}`,
      product_image_url: "",
      model_url: "",
      model_embed_code: ""
    }));

    // Update episode with detected triggers (append to existing)
    await base44.asServiceRole.entities.Episode.update(episode_id, {
      triggers: [...existingTriggers, ...newTriggers]
    });

    return Response.json({
      success: true,
      detected_count: newTriggers.length,
      triggers: newTriggers
    });

  } catch (error) {
    console.error('Error analyzing video:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});