import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, Loader2, X, Tv, ShoppingBag } from "lucide-react";

export default function GatewayImageUploader({ siteSettings }) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(null);
  const tvInputRef = useRef(null);
  const buyInputRef = useRef(null);

  const FIELDS = [
    { key: "gateway_tv_image", label: "GlobeHouse TV", icon: Tv, ref: tvInputRef, accent: "text-violet-400" },
    { key: "gateway_buy_image", label: "BuyScreen Marketplace", icon: ShoppingBag, ref: buyInputRef, accent: "text-emerald-400" },
  ];

  const handleUpload = async (field, file) => {
    setUploading(field.key);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (siteSettings?.id) {
        await base44.entities.SiteSettings.update(siteSettings.id, { [field.key]: file_url });
      } else {
        await base44.entities.SiteSettings.create({ [field.key]: file_url });
      }
      queryClient.invalidateQueries({ queryKey: ["siteSettings"] });
    } catch (err) {
      console.error("Gateway image upload failed:", err);
    } finally {
      setUploading(null);
    }
  };

  const handleRemove = async (field) => {
    setUploading(field.key);
    try {
      if (siteSettings?.id) {
        await base44.entities.SiteSettings.update(siteSettings.id, { [field.key]: "" });
        queryClient.invalidateQueries({ queryKey: ["siteSettings"] });
      }
    } catch (err) {
      console.error("Failed to remove image:", err);
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Tv className="w-3.5 h-3.5 text-violet-400" />
        <span className="text-xs font-medium text-white/50">Gateway Landing Images</span>
      </div>
      {FIELDS.map((field) => {
        const Icon = field.icon;
        const url = siteSettings?.[field.key];
        const isUploading = uploading === field.key;
        return (
          <div key={field.key} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
            <div className="relative w-20 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-white/[0.04]">
              {url ? (
                <>
                  <img src={url} alt={field.label} className="w-full h-full object-cover" />
                  <button
                    onClick={() => handleRemove(field)}
                    className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500/90 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                  >
                    <X className="w-2.5 h-2.5 text-white" />
                  </button>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Icon className={`w-4 h-4 ${field.accent} opacity-40`} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${field.accent}`}>{field.label}</p>
              <p className="text-[10px] text-white/30 truncate">{url ? "Custom image set" : "Using default image"}</p>
            </div>
            <input
              ref={field.ref}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(field, file);
                e.target.value = "";
              }}
            />
            <button
              onClick={() => field.ref.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-white/60 hover:text-white text-xs font-medium transition-all disabled:opacity-50"
            >
              {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {url ? "Swap" : "Upload"}
            </button>
          </div>
        );
      })}
    </div>
  );
}