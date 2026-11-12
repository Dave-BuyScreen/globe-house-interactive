import { createClientFromRequest, serve } from '../_shared/base44.ts';

serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { file_url, import_type } = await req.json();

    if (!file_url || !import_type) {
      return Response.json({ error: 'file_url and import_type are required' }, { status: 400 });
    }

    // Fetch the CSV file
    const csvResponse = await fetch(file_url);
    const csvText = await csvResponse.text();

    // Parse CSV
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    const errors = [];
    const imported_items = [];
    let success_count = 0;

    if (import_type === 'episodes') {
      // Import episodes
      for (let i = 1; i < lines.length; i++) {
        try {
          const values = parseCSVLine(lines[i]);
          const row = {};
          headers.forEach((header, idx) => {
            row[header] = values[idx] || '';
          });

          // Validate required fields
          if (!row.title || !row.vimeo_url) {
            errors.push({ row: i + 1, message: 'Missing required fields: title, vimeo_url' });
            continue;
          }

          // Parse keywords if present
          const keywords = row.keywords ? row.keywords.split(',').map(k => k.trim()).filter(k => k) : [];

          // Create episode
          const episodeData = {
            title: row.title,
            vimeo_url: row.vimeo_url,
            thumbnail_url: row.thumbnail_url || '',
            summary: row.summary || '',
            keywords: keywords,
            theme_color: row.theme_color || '#8B5CF6',
            status: row.status || 'draft',
            category: row.category || 'other',
            triggers: []
          };

          await base44.asServiceRole.entities.Episode.create(episodeData);
          imported_items.push({ title: row.title });
          success_count++;
        } catch (error) {
          errors.push({ row: i + 1, message: error.message });
        }
      }
    } else if (import_type === 'triggers') {
      // Import triggers
      for (let i = 1; i < lines.length; i++) {
        try {
          const values = parseCSVLine(lines[i]);
          const row = {};
          headers.forEach((header, idx) => {
            row[header] = values[idx] || '';
          });

          // Validate required fields
          if (!row.episode_id || !row.timestamp || !row.trigger_type) {
            errors.push({ row: i + 1, message: 'Missing required fields: episode_id, timestamp, trigger_type' });
            continue;
          }

          // Find the episode
          const episodes = await base44.asServiceRole.entities.Episode.filter({ id: row.episode_id });
          if (episodes.length === 0) {
            errors.push({ row: i + 1, message: `Episode not found: ${row.episode_id}` });
            continue;
          }

          const episode = episodes[0];
          const existingTriggers = episode.triggers || [];

          // Create trigger object
          const trigger = {
            trigger_type: row.trigger_type,
            timestamp: parseFloat(row.timestamp) || 0,
            prompt_text: row.prompt_text || '',
            product_name: row.product_name || '',
            product_brand: row.product_brand || '',
            product_price: row.product_price || '',
            product_description: row.product_description || '',
            shop_url: row.shop_url || '',
            confessional_video_url: row.confessional_video_url || '',
            confessional_duration: parseFloat(row.confessional_duration) || 10,
            product_image_url: row.product_image_url || '',
            model_url: row.model_url || '',
            detection_status: 'manual',
            duration: parseFloat(row.duration) || 5
          };

          // Add bounding box if coordinates provided
          if (row.bounding_box_x || row.bounding_box_y || row.bounding_box_width || row.bounding_box_height) {
            trigger.bounding_box = {
              x: parseFloat(row.bounding_box_x) || 0,
              y: parseFloat(row.bounding_box_y) || 0,
              width: parseFloat(row.bounding_box_width) || 10,
              height: parseFloat(row.bounding_box_height) || 10
            };
          }

          // Update episode with new trigger
          await base44.asServiceRole.entities.Episode.update(row.episode_id, {
            triggers: [...existingTriggers, trigger]
          });

          imported_items.push({
            episode_id: row.episode_id,
            product_name: row.product_name,
            timestamp: trigger.timestamp
          });
          success_count++;
        } catch (error) {
          errors.push({ row: i + 1, message: error.message });
        }
      }
    } else {
      return Response.json({ error: 'Invalid import_type. Use "episodes" or "triggers"' }, { status: 400 });
    }

    return Response.json({
      success: true,
      total_count: lines.length - 1,
      success_count: success_count,
      error_count: errors.length,
      errors: errors,
      imported_items: imported_items
    });

  } catch (error) {
    console.error('Bulk import error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Helper function to parse CSV line (handles quoted fields with commas)
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim().replace(/^"|"$/g, ''));
  return result;
}