import React, { useState, useRef } from "react";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Button } from "@/components/ui/button";
import { Loader2, Monitor, Smartphone, Tablet } from "lucide-react";
import { base44 } from "@/api/base44Client";

function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  );
}

const DEVICES = [
  { key: "desktop", label: "Desktop", icon: Monitor, aspect: 16 / 9, hint: "16:9", field: "image_url" },
  { key: "mobile", label: "Mobile", icon: Smartphone, aspect: 9 / 16, hint: "9:16", field: "image_url_mobile" },
  { key: "tablet", label: "Tablet", icon: Tablet, aspect: 4 / 3, hint: "4:3", field: "image_url_tablet" },
];

export default function ImageCropper({ imageSrc, onCropComplete, onCancel }) {
  const imgRef = useRef(null);
  const [activeDevice, setActiveDevice] = useState("desktop");
  const [cropStates, setCropStates] = useState({});
  const [uploading, setUploading] = useState(false);

  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget;
    const initial = {};
    DEVICES.forEach((d) => {
      const c = centerAspectCrop(width, height, d.aspect);
      initial[d.key] = { crop: c, completedCrop: c };
    });
    setCropStates(initial);
  };

  const updateActive = (patch) =>
    setCropStates((s) => ({
      ...s,
      [activeDevice]: { ...s[activeDevice], ...patch },
    }));

  const activeState = cropStates[activeDevice];
  const activeDeviceConfig = DEVICES.find((d) => d.key === activeDevice);

  const generateCroppedUrl = (completedCrop, deviceKey) =>
    new Promise((resolve, reject) => {
      const image = imgRef.current;
      if (!image || !completedCrop) return reject(new Error("no crop"));
      const canvas = document.createElement("canvas");
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      canvas.width = completedCrop.width * scaleX;
      canvas.height = completedCrop.height * scaleY;
      const ctx = canvas.getContext("2d");

      const offscreen = new Image();
      offscreen.crossOrigin = "anonymous";
      offscreen.onload = async () => {
        ctx.drawImage(
          offscreen,
          completedCrop.x * scaleX,
          completedCrop.y * scaleY,
          completedCrop.width * scaleX,
          completedCrop.height * scaleY,
          0,
          0,
          canvas.width,
          canvas.height
        );
        const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], `cropped-${deviceKey}.jpg`, { type: "image/jpeg" });
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        resolve(file_url);
      };
      offscreen.onerror = () => reject(new Error("image load failed"));
      offscreen.src = imageSrc;
    });

  const handleApply = async () => {
    setUploading(true);
    const result = {};
    for (const device of DEVICES) {
      const state = cropStates[device.key];
      if (state?.completedCrop) {
        try {
          const url = await generateCroppedUrl(state.completedCrop, device.key);
          result[device.field] = url;
        } catch (err) {
          // skip failed device crop
        }
      }
    }
    setUploading(false);
    onCropComplete(result);
  };

  const hasAnyCrop = Object.values(cropStates).some((s) => s?.completedCrop);

  return (
    <div className="space-y-4">
      {/* Device tabs */}
      <div className="flex items-center gap-2">
        {DEVICES.map((d) => {
          const Icon = d.icon;
          const isActive = activeDevice === d.key;
          const hasCrop = !!cropStates[d.key]?.completedCrop;
          return (
            <button
              key={d.key}
              onClick={() => setActiveDevice(d.key)}
              className={`flex items-center gap-2 px-3 h-9 rounded-lg text-xs font-medium border transition-colors ${
                isActive
                  ? "bg-violet-500/20 border-violet-400/40 text-violet-300"
                  : "bg-white/[0.04] border-white/[0.08] text-white/40 hover:text-white/70"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {d.label}
              <span className="text-white/30">{d.hint}</span>
              {hasCrop && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
            </button>
          );
        })}
      </div>

      <div className="rounded-xl overflow-hidden bg-black flex items-center justify-center max-h-80">
        <ReactCrop
          crop={activeState?.crop}
          onChange={(_, pct) => updateActive({ crop: pct })}
          onComplete={(c) => updateActive({ completedCrop: c })}
          aspect={activeDeviceConfig?.aspect}
          keepSelection
        >
          <img
            ref={imgRef}
            src={imageSrc}
            onLoad={onImageLoad}
            alt="Crop preview"
            className="max-h-80 w-auto"
            style={{ maxWidth: "100%" }}
          />
        </ReactCrop>
      </div>

      <div className="flex justify-between gap-3">
        <Button variant="ghost" onClick={onCancel} className="text-white/40 hover:text-white">
          Cancel
        </Button>
        <Button
          onClick={handleApply}
          disabled={!hasAnyCrop || uploading}
          className="bg-violet-600 hover:bg-violet-700 text-white"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Apply Crops
        </Button>
      </div>
    </div>
  );
}