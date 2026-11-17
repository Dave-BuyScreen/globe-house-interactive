import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Crown } from "lucide-react";
import { supabase } from "@/lib/supabase";

// Weighted random pick so admins can show some ads more often than others.
const pick = (ads) => {
  const total = ads.reduce((n, a) => n + Math.max(1, a.weight || 1), 0);
  let r = Math.random() * total;
  return ads.find((a) => (r -= Math.max(1, a.weight || 1)) < 0) || ads[0];
};

// Plain insert: viewers may log ad events but not read them back.
const track = (ad, episodeId, event) => {
  supabase?.from("ad_event").insert({ ad_id: ad.id, episode_id: episodeId, event }).then(() => {}, () => {});
};

// Pre-roll ad for the free tier. Video ads play to the end (skippable after N seconds);
// image ads show for their duration. Calls onDone when finished or skipped.
export default function AdBreak({ ads, episodeId, skipAfter = 5, onDone }) {
  const [ad] = useState(() => pick(ads));
  const [elapsed, setElapsed] = useState(0);
  const [needsTap, setNeedsTap] = useState(false);
  const videoRef = useRef(null);
  const finished = useRef(false);
  const duration = ad.video_url ? null : Math.max(3, ad.duration_seconds || 10);

  const finish = (event) => {
    if (finished.current) return;
    finished.current = true;
    track(ad, episodeId, event);
    onDone();
  };

  useEffect(() => {
    track(ad, episodeId, "impression");
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [ad, episodeId]);

  useEffect(() => {
    if (duration && elapsed >= duration) finish("complete");
  });

  useEffect(() => {
    // Browsers block autoplay with sound; fall back to muted, then to a tap.
    const v = videoRef.current;
    if (!v) return;
    v.play().catch(() => {
      v.muted = true;
      v.play().catch(() => setNeedsTap(true));
    });
  }, []);

  const canSkip = elapsed >= skipAfter;
  const remaining = duration ? Math.max(0, duration - elapsed) : null;

  return (
    <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-[#D4AF37]/20">
      {ad.video_url ? (
        <video
          ref={videoRef}
          src={ad.video_url}
          playsInline
          className="w-full h-full object-contain"
          onEnded={() => finish("complete")}
          onError={() => finish("skip")}
        />
      ) : (
        <img src={ad.image_url} alt={ad.title || "Advertisement"} className="w-full h-full object-contain" onError={() => finish("skip")} />
      )}

      {needsTap && (
        <button
          onClick={() => { videoRef.current?.play(); setNeedsTap(false); }}
          className="absolute inset-0 flex items-center justify-center bg-black/50 text-[#EDE3D0] text-sm"
        >
          Tap to play
        </button>
      )}

      <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/70 text-[10px] uppercase tracking-widest text-[#EDE3D0]/80">
        Ad{ad.advertiser ? ` · ${ad.advertiser}` : ""}{remaining != null ? ` · ${remaining}s` : ""}
      </div>

      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
        <div className="flex gap-2">
          {ad.click_url && (
            <a
              href={ad.click_url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              onClick={() => track(ad, episodeId, "click")}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#D4AF37] text-[#1a1208] text-xs font-semibold"
            >
              Learn more <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <Link
            to="/Subscribe"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-black/70 border border-[#D4AF37]/40 text-[#EDE3D0] text-xs"
          >
            <Crown className="w-3 h-3 text-[#D4AF37]" /> Go ad-free
          </Link>
        </div>
        <button
          onClick={() => canSkip && finish("skip")}
          disabled={!canSkip}
          className="px-4 py-2 rounded-lg bg-black/80 border border-white/20 text-sm text-white disabled:text-white/50"
        >
          {canSkip ? "Skip ad ›" : `Skip in ${skipAfter - elapsed}`}
        </button>
      </div>
    </div>
  );
}
