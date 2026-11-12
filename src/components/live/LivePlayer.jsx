import React from "react";
import { Radio } from "lucide-react";

export default function LivePlayer({ vimeoUrl, offsetSeconds = 0, title, isLive = false }) {
  if (!vimeoUrl) {
    return (
      <div className="w-full aspect-video bg-[#13131a] rounded-2xl flex flex-col items-center justify-center gap-3 border border-white/[0.06]">
        <Radio className="w-10 h-10 text-white/10" />
        <p className="text-white/20 text-sm">No stream configured</p>
      </div>
    );
  }

  // Append time offset using Vimeo's #t=Xs fragment
  const base = vimeoUrl.split('#')[0];
  const src = offsetSeconds > 0
    ? `${base}?autoplay=1#t=${offsetSeconds}s`
    : `${base}?autoplay=1`;

  return (
    <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl shadow-black/60">
      {isLive && (
        <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3 py-1.5 bg-red-600 rounded-full shadow-lg pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="text-white text-xs font-bold tracking-widest uppercase">Live</span>
        </div>
      )}
      <iframe
        key={src}
        src={src}
        className="w-full h-full"
        frameBorder="0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        title={title || "GlobeHouse Live"}
      />
    </div>
  );
}