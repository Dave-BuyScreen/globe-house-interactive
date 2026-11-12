import { createClientFromRequest, serve } from '../_shared/base44.ts';

serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { dry_run = true, legacy_merchant_id } = body;

    // Fetch all episodes
    const episodes = await base44.asServiceRole.entities.Episode.list();

    // Collect all unique products from triggers
    const productMap = new Map(); // key: name+price => product data
    const placements = []; // track which episode/trigger each product came from

    for (const episode of episodes) {
      const triggers = episode.triggers || [];
      for (let i = 0; i < triggers.length; i++) {
        const t = triggers[i];
        if (!t.product_name) continue;

        const key = `${t.product_name?.toLowerCase().trim()}|${t.product_price}`;

        if (!productMap.has(key)) {
          productMap.set(key, {
            name: t.product_name,
            brand: t.product_brand || '',
            display_price: t.product_price || '',
            price: parseFloat((t.product_price || '0').replace(/[^0-9.]/g, '')) * 100 || 0,
            description: t.product_description || '',
            short_description: t.product_quote || t.product_description || '',
            image_url: t.product_image_url || '',
            product_url: t.shop_url || '',
            model_url: t.model_url || '',
            character_quote: t.product_quote || '',
            merchant_id: legacy_merchant_id || 'legacy',
            is_active: true,
            migrated_from_episode: episode.id,
            tags: [],
            total_revenue: 0,
            total_sales: 0
          });
        }

        placements.push({
          episode_id: episode.id,
          episode_title: episode.title,
          trigger_index: i,
          product_key: key,
          product_name: t.product_name
        });
      }
    }

    const uniqueProducts = Array.from(productMap.values());

    // DRY RUN: return what would be created without writing anything
    if (dry_run) {
      return Response.json({
        dry_run: true,
        summary: {
          episodes_scanned: episodes.length,
          unique_products_found: uniqueProducts.length,
          total_trigger_placements: placements.length,
        },
        products_preview: uniqueProducts.map(p => ({
          name: p.name,
          brand: p.brand,
          display_price: p.display_price,
          migrated_from_episode: p.migrated_from_episode
        })),
        placements_preview: placements
      });
    }

    // LIVE RUN: Create ProductRegistry records
    if (!legacy_merchant_id) {
      return Response.json({ error: 'legacy_merchant_id is required for a live migration run' }, { status: 400 });
    }

    const created = [];
    const productKeyToId = new Map();

    for (const product of uniqueProducts) {
      const record = await base44.asServiceRole.entities.ProductRegistry.create(product);
      productKeyToId.set(`${product.name?.toLowerCase().trim()}|${product.display_price}`, record.id);
      created.push({ id: record.id, name: record.name });
    }

    // Update Episode triggers to reference new product IDs
    const episodesToUpdate = new Map();
    for (const placement of placements) {
      if (!episodesToUpdate.has(placement.episode_id)) {
        const ep = episodes.find(e => e.id === placement.episode_id);
        episodesToUpdate.set(placement.episode_id, JSON.parse(JSON.stringify(ep)));
      }
      const ep = episodesToUpdate.get(placement.episode_id);
      const trigger = ep.triggers[placement.trigger_index];
      if (trigger) {
        trigger.product_id = productKeyToId.get(placement.product_key) || null;
      }
    }

    const updatedEpisodes = [];
    for (const [episodeId, episodeData] of episodesToUpdate) {
      await base44.asServiceRole.entities.Episode.update(episodeId, { triggers: episodeData.triggers });
      updatedEpisodes.push(episodeId);
    }

    return Response.json({
      dry_run: false,
      success: true,
      summary: {
        products_created: created.length,
        episodes_updated: updatedEpisodes.length,
      },
      created_products: created
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});