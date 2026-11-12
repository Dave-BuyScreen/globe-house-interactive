import React, { useState, useRef } from "react";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

function ratioToAspect(ratio) {
  const [w, h] = String(ratio).split(":").map(Number);
  return w / h;
}

function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  );
}

export default function SlotCropDialog({ imageSrc, ratio, label, onApply, onCancel }) {
  const imgRef = useRef(null);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const [uploading, setUploading] = useState(false);
  const aspect = ratioToAspect(ratio);

  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget;
    const initial = centerAspectCrop(width, height, aspect);
    setCrop(initial);
    setCompletedCrop(initial);
  };

  const handleApply = async () => {
    if (!completedCrop || !imgRef.current) return;
    setUploading(true);
    try {
      const image = imgRef.current;
      const canvas = document.createElement("canvas");
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      canvas.width = completedCrop.width * scaleX;
      canvas.height = completedCrop.height * scaleY;
      const ctx = canvas.getContext("2d");

      await new Promise((resolve, reject) => {
        const offscreen = new Image();
        offscreen.crossOrigin = "anonymous";
        offscreen.onload = () => {
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
          resolve();
        };
        offscreen.onerror = () => reject(new Error("image load failed"));
        offscreen.src = imageSrc;
      });

      const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `cropped-${label}.jpg`, { type: "image/jpeg" });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onApply(file_url);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Crop {label}</h3>
        <span className="text-[10px] font-medium text-violet-400/70 bg-violet-500/10 px-1.5 py-0.5 rounded">
          {ratio}
        </span>
      </div>

      <div className="rounded-xl overflow-hidden bg-black flex items-center justify-center max-h-80">
        <ReactCrop
          crop={crop}
          onChange={(_, pct) => setCrop(pct)}
          onComplete={(c) => setCompletedCrop(c)}
          aspect={aspect}
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
          disabled={!completedCrop || uploading}
          className="bg-violet-600 hover:bg-violet-700 text-white"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Apply Crop
        </Button>
      </div>
    </div>
  );
}