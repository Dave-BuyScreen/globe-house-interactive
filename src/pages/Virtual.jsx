import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Glasses, Monitor, ChevronLeft, ChevronRight } from "lucide-react";

function getVimeoEmbedUrl(url) {
  if (!url) return null;
  // Already an embed URL
  if (url.includes("player.vimeo.com")) return url;
  // Extract ID from standard vimeo URL
  const match = url.match(/vimeo\.com\/(\d+)/);
  if (match) return `https://player.vimeo.com/video/${match[1]}?autoplay=1&loop=1&muted=1&background=1`;
  return url;
}

export default function Virtual() {
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { data: episodes = [] } = useQuery({
    queryKey: ["episodes-virtual"],
    queryFn: () => base44.entities.Episode.filter({ status: "published" })
  });

  useEffect(() => {
    if (episodes.length > 0 && !selectedEpisode) {
      setSelectedEpisode(episodes[0]);
      setSelectedIndex(0);
    }
  }, [episodes]);

  const goTo = (idx) => {
    const clamped = Math.max(0, Math.min(episodes.length - 1, idx));
    setSelectedIndex(clamped);
    setSelectedEpisode(episodes[clamped]);
  };

  const embedUrl = getVimeoEmbedUrl(selectedEpisode?.vimeo_url);

  return (
    <div className="min-h-screen bg-[#050508] text-white flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
          <Glasses className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-white">Virtual Theater</h1>
          <p className="text-xs text-white/30">Immersive Cinema Experience</p>
        </div>
      </div>

      {/* Theater Room */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8"
        style={{
          background: "radial-gradient(ellipse at center bottom, #1a0d35 0%, #080810 60%, #050508 100%)"
        }}
      >
        {/* Ceiling lights */}
        <div className="flex gap-16 mb-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-1.5 h-6 rounded-full bg-violet-400/20 shadow-lg"
              style={{ boxShadow: "0 0 12px 4px rgba(139,92,246,0.25)" }} />
          ))}
        </div>

        {/* Screen area */}
        <div className="w-full max-w-4xl relative">
          {/* Screen glow */}
          <div className="absolute inset-0 rounded-2xl blur-3xl opacity-30"
            style={{ background: "radial-gradient(ellipse, #7c3aed, transparent 70%)", transform: "scale(1.1)" }} />

          {/* Screen frame */}
          <div className="relative rounded-2xl overflow-hidden border-4 border-[#1a1028] shadow-2xl"
            style={{ boxShadow: "0 0 60px rgba(139,92,246,0.3), inset 0 0 20px rgba(0,0,0,0.8)" }}>

            {/* Aspect ratio wrapper */}
            <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
              {embedUrl ? (
                <iframe
                  key={selectedEpisode?.id}
                  src={embedUrl}
                  className="absolute inset-0 w-full h-full"
                  frameBorder="0"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  title={selectedEpisode?.title}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0c0818]">
                  <Monitor className="w-12 h-12 text-violet-500/30 mb-3" />
                  <p className="text-white/30 text-sm">No published episodes</p>
                  <p className="text-white/15 text-xs mt-1">Publish an episode to begin</p>
                </div>
              )}
            </div>
          </div>

          {/* Screen label */}
          {selectedEpisode && (
            <div className="text-center mt-3">
              <span className="text-white/40 text-xs font-medium tracking-widest uppercase">
                {selectedEpisode.title}
              </span>
            </div>
          )}
        </div>

        {/* Seating rows (decorative) */}
        <div className="w-full max-w-5xl mt-8 space-y-2">
          {[7, 9, 11].map((seats, rowIdx) => (
            <div key={rowIdx} className="flex justify-center gap-1.5"
              style={{ transform: `perspective(400px) rotateX(${8 + rowIdx * 4}deg)`, opacity: 0.6 - rowIdx * 0.1 }}>
              {[...Array(seats)].map((_, i) => (
                i === Math.floor(seats / 2) ? (
                  <div key={i} className="w-6" /> // center aisle
                ) : (
                  <div key={i} className="w-7 h-5 rounded-t-md border border-violet-900/60"
                    style={{ background: "linear-gradient(to bottom, #2d1050, #1a0d35)" }} />
                )
              ))}
            </div>
          ))}
        </div>

        {/* Episode navigation */}
        {episodes.length > 1 && (
          <div className="flex items-center gap-4 mt-8">
            <button
              onClick={() => goTo(selectedIndex - 1)}
              disabled={selectedIndex === 0}
              className="p-2 rounded-lg border border-white/10 text-white/40 hover:text-white hover:border-violet-500/40 disabled:opacity-20 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex gap-1.5">
              {episodes.map((ep, i) => (
                <button
                  key={ep.id}
                  onClick={() => goTo(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === selectedIndex ? "bg-violet-500 scale-125" : "bg-white/20 hover:bg-white/40"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => goTo(selectedIndex + 1)}
              disabled={selectedIndex === episodes.length - 1}
              className="p-2 rounded-lg border border-white/10 text-white/40 hover:text-white hover:border-violet-500/40 disabled:opacity-20 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}