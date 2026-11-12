import React, { useState } from "react";
import { Upload, X, Crop, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import SlotCropDialog from "./SlotCropDialog";

export const DEVICE_SLOTS = [
  { key: "desktop", field: "image_url", label: "Desktop", ratio: "16:9" },
  { key: "mobile", field: "image_url_mobile", label: "Mobile", ratio: "9:16" },
  { key: "tablet", field: "image_url_tablet", label: "Tablet", ratio: "4:3" },
];

export default function DeviceImageSlot({ label, ratio, value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [cropping, setCropping] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onChange(file_url);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs text-white/40 uppercase tracking-wider">{label}</label>
        <span className="text-[10px] font-medium text-violet-400/70 bg-violet-500/10 px-1.5 py-0.5 rounded">
          {ratio}
        </span>
      </div>
      {value ? (
        <div className="relative rounded-xl overflow-hidden bg-black h-28">
          <img src={value} alt={label} className="w-full h-full object-cover" />
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              onClick={() => setCropping(true)}
              className="w-7 h-7 rounded-full bg-black/60 flex items-center justify-center hover:bg-violet-500/80 transition-colors"
              title={`Crop ${label} image`}
            >
              <Crop className="w-3.5 h-3.5 text-white" />
            </button>
            <label
              className="w-7 h-7 rounded-full bg-black/60 flex items-center justify-center hover:bg-violet-500/80 transition-colors cursor-pointer"
              title={`Replace ${label} image`}
            >
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
              {uploading ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <Upload className="w-3.5 h-3.5 text-white" />}
            </label>
            <button
              onClick={() => onChange("")}
              className="w-7 h-7 rounded-full bg-black/60 flex items-center justify-center hover:bg-red-500/80 transition-colors"
              title={`Remove ${label} image`}
            >
              <X className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <label className="flex flex-col items-center justify-center h-28 rounded-xl border-2 border-dashed border-white/[0.12] hover:border-violet-400/50 cursor-pointer transition-colors bg-white/[0.02]">
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            {uploading ? (
              <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
            ) : (
              <>
                <Upload className="w-6 h-6 text-white/30 mb-1" />
                <span className="text-white/40 text-xs">Upload</span>
              </>
            )}
          </label>
          <Input
            placeholder="or paste URL"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 h-8 text-xs"
          />
        </div>
      )}

      <Dialog open={cropping} onOpenChange={setCropping}>
        <DialogContent className="bg-[#13131a] border-white/[0.08] text-white max-w-lg">
          <SlotCropDialog
            imageSrc={value}
            ratio={ratio}
            label={label}
            onApply={(url) => { onChange(url); setCropping(false); }}
            onCancel={() => setCropping(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}