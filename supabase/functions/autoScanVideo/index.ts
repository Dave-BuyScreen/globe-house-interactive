import { createClientFromRequest, serve } from '../_shared/base44.ts';

serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { episode_id, vimeo_url, product_types = [] } = await req.json();

    if (!episode_id || !vimeo_url) {
      return Response.json({ error: 'episode_id and vimeo_url are required' }, { status: 400 });
    }

    // Extract multiple frames at intervals for comprehensive scanning
    const scanIntervals = [10, 30, 60, 90, 120, 150, 180]; // seconds
    const detectedTriggers = [];

    for (const timestamp of scanIntervals) {
      try {
        // Extract frame at this timestamp
        const frameResponse = await base44.functions.invoke('extractVideoFrame', {
          video_url: vimeo_url,
          timestamp: timestamp
        });

        const frameUrl = frameResponse.data.frame_url;

        // Use AI vision to detect products in the frame
        const detectionPrompt = `Analyze this video frame and detect any visible products, items, or objects that could be purchased.

For each product detected, provide:
1. Product name/type (e.g., "Leather Jacket", "Sunglasses", "Watch")
2. Brand if visible (or "Unknown")
3. Approximate position in the frame (x, y as percentages 0-100 from top-left)
4. Approximate size (width, height as percentages of frame)
5. Confidence score (0-1)
6. Brief description

${product_types.length > 0 ? `Focus specifically on these product types: ${product_types.join(', ')}` : ''}

Only include products that are clearly visible and identifiable.`;

        const aiResponse = await base44.integrations.Core.InvokeLLM({
          prompt: detectionPrompt,
          file_urls: [frameUrl],
          response_json_schema: {
            type: "object",
            properties: {
              products: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    product_name: { type: "string" },
                    product_brand: { type: "string" },
                    bounding_box: {
                      type: "object",
                      properties: {
                        x: { type: "number" },
                        y: { type: "number" },
                        width: { type: "number" },
                        height: { type: "number" }
                      }
                    },
                    confidence_score: { type: "number" },
                    description: { type: "string" }
                  }
                }
              }
            }
          }
        });

        // Process detected products
        if (aiResponse.products && aiResponse.products.length > 0) {
          for (const product of aiResponse.products) {
            // Only include high-confidence detections
            if (product.confidence_score >= 0.6) {
              detectedTriggers.push({
                trigger_type: "buyscreen_only",
                timestamp: timestamp,
                prompt_text: `Check out this ${product.product_name}`,
                product_name: product.product_name,
                product_brand: product.product_brand || "Unknown",
                product_description: product.description,
                product_price: "",
                product_quote: "",
                shop_url: "",
                bounding_box: {
                  x: Math.max(0, Math.min(100, product.bounding_box?.x || 0)),
                  y: Math.max(0, Math.min(100, product.bounding_box?.y || 0)),
                  width: Math.max(0, Math.min(100, product.bounding_box?.width || 10)),
                  height: Math.max(0, Math.min(100, product.bounding_box?.height || 10))
                },
                detection_status: "auto_detected",
                confidence_score: product.confidence_score,
                duration: 5
              });
            }
          }
        }
      } catch (error) {
        console.error(`Error scanning timestamp ${timestamp}:`, error);
        // Continue with next timestamp
      }
    }

    // Update episode with detected triggers
    if (detectedTriggers.length > 0) {
      const episode = await base44.asServiceRole.entities.Episode.filter({ id: episode_id });
      
      if (episode.length > 0) {
        const existingTriggers = episode[0].triggers || [];
        const mergedTriggers = [...existingTriggers, ...detectedTriggers];
        
        await base44.asServiceRole.entities.Episode.update(episode_id, {
          triggers: mergedTriggers
        });
      }
    }

    return Response.json({
      success: true,
      detected_count: detectedTriggers.length,
      triggers: detectedTriggers,
      scanned_timestamps: scanIntervals
    });

  } catch (error) {
    console.error('Auto scan error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});