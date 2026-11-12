import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LogoUploader({ currentLogo, settingsId }) {
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (logo_url) => {
      if (settingsId) {
        return base44.entities.SiteSettings.update(settingsId, { logo_url });
      }
      return base44.entities.SiteSettings.create({ logo_url });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["siteSettings"] });
    }
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await updateMutation.mutateAsync(file_url);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    updateMutation.mutate("");
  };

  return (
    <div className="flex items-center gap-3">
      {currentLogo ? (
        <div className="relative group">
          <img 
            src={currentLogo} 
            alt="Logo" 
            className="h-12 max-w-[200px] object-contain"
          />
          <button
            onClick={handleRemove}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-3 h-3 text-white" />
          </button>
        </div>
      ) : (
        <label className="cursor-pointer">
          <div className="h-12 px-4 rounded-xl border border-dashed border-white/20 hover:border-white/40 bg-white/[0.02] hover:bg-white/[0.04] flex items-center gap-2 transition-colors">
            {uploading ? (
              <Loader2 className="w-4 h-4 text-white/40 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 text-white/40" />
            )}
            <span className="text-sm text-white/60">Upload Logo</span>
          </div>
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleFileUpload}
            disabled={uploading}
          />
        </label>
      )}
    </div>
  );
}