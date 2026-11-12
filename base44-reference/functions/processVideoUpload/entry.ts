import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { video_url, episode_id } = await req.json();

    if (!video_url) {
      return Response.json({ error: 'video_url is required' }, { status: 400 });
    }

    // Create processing job
    const job = await base44.asServiceRole.entities.VideoProcessingJob.create({
      episode_id: episode_id || null,
      source_video_url: video_url,
      status: 'queued',
      progress: 0,
      started_at: new Date().toISOString()
    });

    // In production, this would trigger a cloud processing service (AWS MediaConvert, Cloudflare Stream, etc.)
    // For this implementation, we'll simulate the processing with Cloudinary video transformations
    
    const cloudinaryCloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME');
    const cloudinaryApiKey = Deno.env.get('CLOUDINARY_API_KEY');
    const cloudinaryApiSecret = Deno.env.get('CLOUDINARY_API_SECRET');

    if (!cloudinaryCloudName || !cloudinaryApiKey || !cloudinaryApiSecret) {
      // Fallback: Mark as completed with original URL only
      await base44.asServiceRole.entities.VideoProcessingJob.update(job.id, {
        status: 'completed',
        progress: 100,
        completed_at: new Date().toISOString(),
        output_formats: {
          mp4_1080p: video_url
        }
      });

      return Response.json({
        success: true,
        job_id: job.id,
        message: 'Video processing queued (Cloudinary credentials not configured, using original URL)',
        outputs: { mp4_1080p: video_url }
      });
    }

    // Update status to processing
    await base44.asServiceRole.entities.VideoProcessingJob.update(job.id, {
      status: 'processing',
      progress: 10
    });

    // Upload video to Cloudinary if it's not already there
    let publicId = '';
    
    if (!video_url.includes('cloudinary.com')) {
      // Upload external video to Cloudinary
      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/video/upload`;
      const uploadData = new FormData();
      uploadData.append('file', video_url);
      uploadData.append('upload_preset', 'ml_default');
      uploadData.append('api_key', cloudinaryApiKey);
      
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = await generateCloudinarySignature(
        { timestamp, upload_preset: 'ml_default' },
        cloudinaryApiSecret
      );
      
      uploadData.append('timestamp', timestamp.toString());
      uploadData.append('signature', signature);

      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        body: uploadData
      });

      const uploadResult = await uploadResponse.json();
      publicId = uploadResult.public_id;

      await base44.asServiceRole.entities.VideoProcessingJob.update(job.id, {
        progress: 30
      });
    } else {
      // Extract public_id from Cloudinary URL
      const match = video_url.match(/\/upload\/(?:v\d+\/)?(.+)\./);
      publicId = match ? match[1] : 'sample';
    }

    // Generate multiple resolution URLs using Cloudinary transformations
    const baseUrl = `https://res.cloudinary.com/${cloudinaryCloudName}/video/upload`;
    
    const outputs = {
      mp4_1080p: `${baseUrl}/q_auto,w_1920,h_1080,c_limit,f_mp4/${publicId}.mp4`,
      mp4_720p: `${baseUrl}/q_auto,w_1280,h_720,c_limit,f_mp4/${publicId}.mp4`,
      mp4_480p: `${baseUrl}/q_auto,w_854,h_480,c_limit,f_mp4/${publicId}.mp4`,
      mp4_360p: `${baseUrl}/q_auto,w_640,h_360,c_limit,f_mp4/${publicId}.mp4`,
      hls_playlist: `${baseUrl}/f_m3u8,q_auto/${publicId}.m3u8`,
      dash_manifest: `${baseUrl}/f_mpd,q_auto/${publicId}.mpd`
    };

    await base44.asServiceRole.entities.VideoProcessingJob.update(job.id, {
      progress: 70
    });

    // Get video metadata
    const metadataUrl = `https://res.cloudinary.com/${cloudinaryCloudName}/video/upload/${publicId}.json`;
    let metadata = {};
    
    try {
      const metadataResponse = await fetch(metadataUrl);
      if (metadataResponse.ok) {
        const metadataResult = await metadataResponse.json();
        metadata = {
          duration: metadataResult.duration || 0,
          resolution: `${metadataResult.width}x${metadataResult.height}`,
          file_size: metadataResult.bytes || 0,
          codec: metadataResult.video?.codec || 'unknown',
          bitrate: metadataResult.bit_rate || 0
        };
      }
    } catch (error) {
      console.error('Failed to fetch metadata:', error);
    }

    // Mark as completed
    await base44.asServiceRole.entities.VideoProcessingJob.update(job.id, {
      status: 'completed',
      progress: 100,
      completed_at: new Date().toISOString(),
      output_formats: outputs,
      metadata: metadata
    });

    return Response.json({
      success: true,
      job_id: job.id,
      status: 'completed',
      outputs: outputs,
      metadata: metadata
    });

  } catch (error) {
    console.error('Video processing error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Helper to generate Cloudinary signature
async function generateCloudinarySignature(params, apiSecret) {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  const stringToSign = sortedParams + apiSecret;
  
  const encoder = new TextEncoder();
  const data = encoder.encode(stringToSign);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}