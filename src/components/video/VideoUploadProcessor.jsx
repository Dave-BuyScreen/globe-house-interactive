import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, Loader2, CheckCircle2, Film, AlertCircle, Play } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function VideoUploadProcessor({ episodeId, onProcessingComplete }) {
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingJob, setProcessingJob] = useState(null);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return file_url;
    },
  });

  const processMutation = useMutation({
    mutationFn: async (video_url) => {
      const response = await base44.functions.invoke('processVideoUpload', {
        video_url,
        episode_id: episodeId
      });
      return response.data;
    },
    onSuccess: (data) => {
      setProcessingJob(data);
      queryClient.invalidateQueries({ queryKey: ["videoJobs", episodeId] });
      if (onProcessingComplete && data.outputs) {
        onProcessingComplete(data.outputs);
      }
    },
  });

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    if (!validTypes.includes(selectedFile.type)) {
      alert('Please select a valid video file (MP4, MOV, AVI, WEBM)');
      return;
    }

    setFile(selectedFile);
    setProcessingJob(null);
    setUploadProgress(0);

    // Upload the file
    setUploadProgress(30);
    const videoUrl = await uploadMutation.mutateAsync(selectedFile);
    setUploadProgress(50);

    // Start processing
    await processMutation.mutateAsync(videoUrl);
    setUploadProgress(100);
  };

  const isProcessing = uploadMutation.isPending || processMutation.isPending;
  const isComplete = processingJob?.status === 'completed';
  const hasFailed = processingJob?.status === 'failed';

  return (
    <Card className="bg-[#13131a] border-white/10">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-white/90 flex items-center gap-2">
          <Film className="w-4 h-4 text-violet-400" />
          Video Upload & Transcoding
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-xs text-white/40 mb-2">Upload Raw Video File</Label>
          <label className="flex items-center justify-center gap-3 h-32 border-2 border-dashed border-white/10 rounded-lg cursor-pointer hover:border-white/20 hover:bg-white/[0.02] transition-colors">
            <Upload className="w-8 h-8 text-white/30" />
            <div className="text-center">
              <p className="text-sm text-white/60">
                {file ? file.name : 'Click to upload video'}
              </p>
              <p className="text-xs text-white/30 mt-1">
                MP4, MOV, AVI, WEBM up to 2GB
              </p>
            </div>
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleFileSelect}
              disabled={isProcessing}
            />
          </label>
        </div>

        {isProcessing && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">
                {uploadMutation.isPending ? 'Uploading...' : 'Processing video...'}
              </span>
              <span className="text-xs text-white/40">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
            <div className="flex items-center gap-2 text-xs text-white/40">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Transcoding to multiple resolutions (1080p, 720p, 480p, 360p)...</span>
            </div>
          </div>
        )}

        {isComplete && processingJob && (
          <div className="space-y-3">
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span className="text-sm font-medium text-green-300">Processing Complete</span>
              </div>
              <p className="text-xs text-green-400/60">
                Video transcoded to {Object.keys(processingJob.outputs || {}).length} formats
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-white/60">Available Formats:</p>
              <div className="grid grid-cols-2 gap-2">
                {processingJob.outputs?.mp4_1080p && (
                  <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 justify-center">
                    <Play className="w-3 h-3 mr-1" />
                    1080p HD
                  </Badge>
                )}
                {processingJob.outputs?.mp4_720p && (
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 justify-center">
                    <Play className="w-3 h-3 mr-1" />
                    720p HD
                  </Badge>
                )}
                {processingJob.outputs?.mp4_480p && (
                  <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 justify-center">
                    <Play className="w-3 h-3 mr-1" />
                    480p SD
                  </Badge>
                )}
                {processingJob.outputs?.mp4_360p && (
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30 justify-center">
                    <Play className="w-3 h-3 mr-1" />
                    360p
                  </Badge>
                )}
                {processingJob.outputs?.hls_playlist && (
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 justify-center">
                    HLS Stream
                  </Badge>
                )}
                {processingJob.outputs?.dash_manifest && (
                  <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 justify-center">
                    DASH
                  </Badge>
                )}
              </div>
            </div>

            {processingJob.metadata && (
              <div className="p-2 bg-white/[0.03] border border-white/[0.06] rounded text-xs text-white/50">
                <div className="grid grid-cols-2 gap-2">
                  {processingJob.metadata.duration && (
                    <div>Duration: {Math.floor(processingJob.metadata.duration)}s</div>
                  )}
                  {processingJob.metadata.resolution && (
                    <div>Resolution: {processingJob.metadata.resolution}</div>
                  )}
                  {processingJob.metadata.file_size && (
                    <div>Size: {(processingJob.metadata.file_size / 1024 / 1024).toFixed(2)} MB</div>
                  )}
                  {processingJob.metadata.codec && (
                    <div>Codec: {processingJob.metadata.codec}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {hasFailed && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <div>
                <p className="text-sm font-medium text-red-300">Processing Failed</p>
                {processingJob?.error_message && (
                  <p className="text-xs text-red-400/60 mt-1">{processingJob.error_message}</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-white/30 space-y-1">
          <p>• Automatically transcodes to multiple resolutions</p>
          <p>• Generates adaptive streaming formats (HLS, DASH)</p>
          <p>• Optimizes for all connection speeds</p>
        </div>
      </CardContent>
    </Card>
  );
}