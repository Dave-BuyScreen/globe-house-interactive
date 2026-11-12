import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Film, Upload, X, Loader2, Check } from "lucide-react";

const FIELDS = [
  { key: "intro_desktop_video_url", label: "Desktop / Tablet (16:9)", hint: "Landscape master" },
  { key: "intro_mobile_video_url", label: "Mobile (9:16)", hint: "Portrait master" },
];

function VideoSlot({ field, siteSettings, settingsId, saveMutation }) {
  const [uploading, setUploading] = useState(false);
  const currentUrl = siteSettings?.[field.key];

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      saveMutation.mutate({ [field.key]: file_url });
    } catch (err) {
      console.error("Intro video upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => saveMutation.mutate({ [field.key]: "" });

  return (
    <div className="rounded-xl border border-[#B89045]/20 bg-[#1a1410]/60 p-3">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="flex items-center gap-1.5">
            <Film className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="text-sm font-medium text-[#EDE3D0]">{field.label}</span>
          </div>
          <span className="text-[11px] text-[#EDE3D0]/40">{field.hint}</span>
        </div>
        {saveMutation.isPending && (
          <Loader2 className="w-3.5 h-3.5 text-[#D4AF37] animate-spin" />
        )}
      </div>

      {currentUrl ? (
        <div className="relative group">
          <video
            src={currentUrl}
            muted
            playsInline
            className="w-full h-28 object-cover rounded-lg bg-black"
          />
          <button
            onClick={handleRemove}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-3 h-3 text-white" />
          </button>
          <div className="mt-1.5 flex items-center gap-1">
            <Check className="w-3 h-3 text-green-400" />
            <span className="text-[10px] text-[#EDE3D0]/30 font-mono truncate">
              {currentUrl.split("/").pop()}
            </span>
          </div>
        </div>
      ) : (
        <label className="cursor-pointer block">
          <div className="h-28 rounded-lg border border-dashed border-[#B89045]/30 hover:border-[#D4AF37]/60 bg-[#0e0a06]/40 hover:bg-[#1a1410] flex flex-col items-center justify-center gap-2 transition-colors">
            {uploading ? (
              <Loader2 className="w-5 h-5 text-[#D4AF37] animate-spin" />
            ) : (
              <Upload className="w-5 h-5 text-[#D4AF37]/60" />
            )}
            <span className="text-xs text-[#EDE3D0]/40">
              {uploading ? "Uploading…" : "Upload video"}
            </span>
          </div>
          <input
            type="file"
            accept="video/mp4,video/quicktime,video/webm"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      )}
    </div>
  );
}

export default function IntroVideoUploader({ siteSettings }) {
  const queryClient = useQueryClient();
  const settingsId = siteSettings?.id;

  const saveMutation = useMutation({
    mutationFn: async (patch) => {
      if (settingsId) {
        return base44.entities.SiteSettings.update(settingsId, patch);
      }
      return base44.entities.SiteSettings.create(patch);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["siteSettings"] });
    },
  });

  return (
    <div className="space-y-3">
      {FIELDS.map((field) => (
        <VideoSlot
          key={field.key}
          field={field}
          siteSettings={siteSettings}
          settingsId={settingsId}
          saveMutation={saveMutation}
        />
      ))}
      <p className="text-[11px] text-[#EDE3D0]/30">
        Mobile serves the 9:16 master at full resolution; desktop/tablet serve the 16:9 master. If a
        version is missing, the other is used as fallback.
      </p>
    </div>
  );
}