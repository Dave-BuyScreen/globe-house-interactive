import React, { useRef } from "react";
import { ImageUp, Loader2 } from "lucide-react";

export default function GatewayBranding({ logoUrl, isAdmin, uploading, onUpload }) {
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    e.target.value = "";
  };

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
      {logoUrl && (
        <img src={logoUrl} alt="Logo" className="h-7 max-w-[140px] object-contain" />
      )}
      {!logoUrl && (
        <p className="text-white/30 text-xs font-medium tracking-[0.3em] uppercase pointer-events-none">Portal Studio</p>
      )}
      {isAdmin && (
        <>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 text-white/40 hover:text-white hover:bg-black/60 transition-all text-xs font-medium"
            title="Upload Logo"
          >
            {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImageUp className="w-3 h-3" />}
          </button>
        </>
      )}
    </div>
  );
}