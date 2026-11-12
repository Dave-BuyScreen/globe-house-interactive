import React from "react";
import { motion } from "framer-motion";
import { Globe, Play, ArrowRight } from "lucide-react";

const THUMB_LEFT = [
  { title: "LOVE REWRITTEN", img: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&h=600&fit=crop" },
  { title: "FINDING FREEDOM", img: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&h=600&fit=crop" },
];

const THUMB_RIGHT = [
  { title: "EARTH'S LEGACY", img: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&h=600&fit=crop" },
];

const CAROUSELS = [
  { title: "Trending Now", items: ["BEYOND BORDERS", "CITY LIGHTS", "THE HORIZON"] },
  { title: "Documentaries", items: ["WILD EARTH", "DEEP BLUE", "ANCIENT VOICES"] },
];

export default function GatewayTVPanel({ logoUrl, imageUrl, onClick, isActive, onHover, onLeave }) {
  return (
    <motion.div
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="relative h-full w-full flex flex-col items-center justify-center px-6 py-8 overflow-hidden cursor-pointer"
    >
      {/* Background image with dim */}
      <img
        src={imageUrl || "https://images.unsplash.com/photo-1518930259200-3e5b8b1b4f1e?w=1200&h=1600&fit=crop"}
        alt="GlobeHouse TV"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: "brightness(0.25)" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/80 via-[#0A0A0A]/40 to-[#0A0A0A]/90" />
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 30%, rgba(197,160,89,0.12), transparent 60%)" }} />

      {/* Header */}
      <div className="relative z-10 flex flex-col items-center text-center mb-6">
        {logoUrl ? (
          <img src={logoUrl} alt="GlobeHouse TV" className="h-16 w-auto object-contain mb-3" />
        ) : (
          <div className="w-14 h-14 rounded-full border-2 border-[#C5A059] flex items-center justify-center mb-3" style={{ background: "rgba(197,160,89,0.1)" }}>
            <Globe className="w-7 h-7 text-[#D4AF37]" />
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-[0.2em] text-white">GLOBEHOUSE TV</h1>
        <p className="mt-1 text-xs sm:text-sm tracking-[0.15em] text-[#C5A059] font-light">VERTICAL DRAMAS &amp; DOCUMENTARIES</p>
      </div>

      {/* Content: phone mockup flanked by thumbnails */}
      <div className="relative z-10 flex items-center justify-center gap-3 sm:gap-5 w-full max-w-3xl">
        {/* Left thumbnails */}
        <div className="hidden sm:flex flex-col gap-3">
          {THUMB_LEFT.map((t) => (
            <div key={t.title} className="relative w-20 h-36 rounded-lg overflow-hidden border border-white/10 shadow-xl">
              <img src={t.img} alt={t.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <span className="absolute bottom-1 left-1 right-1 text-[8px] font-bold text-white tracking-wider text-center">{t.title}</span>
            </div>
          ))}
        </div>

        {/* Phone mockup */}
        <motion.div
          whileHover={{ scale: 1.03 }}
          className="relative w-40 sm:w-48 h-80 sm:h-96 rounded-[2rem] border-4 border-[#1c1c28] bg-black shadow-2xl overflow-hidden"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-4 bg-[#1c1c28] rounded-b-2xl z-20" />
          <div className="h-full w-full bg-gradient-to-b from-[#13131a] to-black p-2 pt-6">
            {/* Featured */}
            <div className="relative h-32 sm:h-40 rounded-xl overflow-hidden mb-2">
              <img src="https://images.unsplash.com/photo-1502691876148-a9c0e6c0f537?w=400&h=300&fit=crop" alt="Beyond Borders" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <span className="absolute top-2 left-2 text-[7px] font-bold text-[#D4AF37] tracking-widest">FEATURED</span>
              <span className="absolute bottom-6 left-2 text-sm font-extrabold text-white tracking-wide">BEYOND BORDERS</span>
              <button className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#D4AF37] text-black text-[7px] font-bold">
                <Play className="w-2 h-2 fill-black" /> WATCH NOW
              </button>
            </div>
            {/* Carousels */}
            {CAROUSELS.map((c) => (
              <div key={c.title} className="mb-2">
                <p className="text-[7px] font-bold text-white/80 mb-1 tracking-wide">{c.title}</p>
                <div className="flex gap-1">
                  {c.items.map((item) => (
                    <div key={item} className="flex-1 h-12 rounded bg-white/5 border border-white/5 flex items-end p-0.5">
                      <span className="text-[5px] text-white/50 leading-none">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right thumbnails */}
        <div className="hidden sm:flex flex-col gap-3">
          {THUMB_RIGHT.map((t) => (
            <div key={t.title} className="relative w-20 h-36 rounded-lg overflow-hidden border border-white/10 shadow-xl">
              <img src={t.img} alt={t.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <span className="absolute bottom-1 left-1 right-1 text-[8px] font-bold text-white tracking-wider text-center">{t.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Enter button */}
      <button className="relative z-10 mt-6 flex items-center gap-2 px-6 py-2.5 rounded-full border border-[#C5A059]/50 text-[#D4AF37] text-sm font-semibold hover:bg-[#C5A059]/15 transition-all">
        Enter GlobeHouse TV <ArrowRight className="w-4 h-4" />
      </button>

      {/* Footer */}
      <p className="relative z-10 mt-6 text-xs sm:text-sm tracking-[0.2em] text-white/40 font-light text-center">POWERFUL STORIES. GLOBAL IMPACT.</p>
    </motion.div>
  );
}