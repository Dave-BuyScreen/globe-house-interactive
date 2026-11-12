import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const CLOUDINARY_CLOUD_NAME = Deno.env.get("CLOUDINARY_CLOUD_NAME");
const CLOUDINARY_API_KEY = Deno.env.get("CLOUDINARY_API_KEY");
const CLOUDINARY_API_SECRET = Deno.env.get("CLOUDINARY_API_SECRET");

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const { video_url, timestamp } = await req.json();

        if (!video_url || timestamp === undefined) {
            return Response.json({ error: 'video_url and timestamp are required' }, { status: 400 });
        }

        // Upload video to Cloudinary first (as a URL)
        const uploadResponse = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${btoa(`${CLOUDINARY_API_KEY}:${CLOUDINARY_API_SECRET}`)}`
                },
                body: JSON.stringify({
                    file: video_url,
                    resource_type: 'video'
                })
            }
        );

        if (!uploadResponse.ok) {
            const error = await uploadResponse.text();
            return Response.json({ error: `Cloudinary upload failed: ${error}` }, { status: 500 });
        }

        const uploadData = await uploadResponse.json();
        const publicId = uploadData.public_id;

        // Generate frame URL at specific timestamp
        // Format: https://res.cloudinary.com/{cloud_name}/video/upload/so_{timestamp}/{public_id}.jpg
        const frameUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/video/upload/so_${timestamp},w_1920,q_auto/${publicId}.jpg`;

        // Download the frame
        const frameResponse = await fetch(frameUrl);
        if (!frameResponse.ok) {
            return Response.json({ error: 'Failed to extract frame from Cloudinary' }, { status: 500 });
        }

        const frameBlob = await frameResponse.blob();
        
        // Upload frame to Base44
        const formData = new FormData();
        formData.append('file', frameBlob, `frame_${timestamp}.jpg`);

        const { file_url } = await base44.integrations.Core.UploadFile({ file: frameBlob });

        return Response.json({ 
            frame_url: file_url,
            timestamp,
            cloudinary_url: frameUrl
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});