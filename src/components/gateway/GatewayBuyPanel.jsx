import React, { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Plus, Play, Pause, Volume2, Settings, Maximize, ShoppingBag, MousePointerClick, ShieldCheck, BarChart3, ArrowRight } from "lucide-react";

const PRODUCT_PINS = [
  { id: "sunglasses", x: 30, y: 28, name: "Aviator Sunglasses", price: "$129.00" },
  { id: "watch", x: 52, y: 52, name: "Premium Watch", price: "$349.00" },
  { id: "bag", x: 75, y: 60, name: "Leather Travel Bag", price: "$199.00" },
];

const FEATURES = [
  { icon: ShoppingBag, label: "TAG PRODUCTS IN VIDEO" },
  { icon: MousePointerClick, label: "CLICK TO SHOP INSTANTLY" },
  { icon: ShieldCheck, label: "SECURE CHECKOUT" },
  { icon: BarChart3, label: "REAL-TIME ANALYTICS" },
];

export default function GatewayBuyPanel({ logoUrl, imageUrl, onClick, onHover, onLeave }) {
  const [activePin, setActivePin] = useState(null);

  return (
    <motion.div
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="relative h-full w-full flex flex-col items-center justify-center px-6 py-8 overflow-hidden cursor-pointer"
    >
      {/* Background */}
      <img
        src={imageUrl || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&h=1600&fit=crop"}
        alt="BuyScreen Marketplace"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: "brightness(0.25)" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/80 via-[#0A0A0A]/40 to-[#0A0A0A]/90" />
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 30%, rgba(197,160,89,0.12), transparent 60%)" }} />
      <div className="absolute left-0 top-0 bottom-0 w-px bg-white/10" />

      {/* Header */}
      <div className="relative z-10 flex flex-col items-center text-center mb-6">
        {logoUrl ? (
          <img src={logoUrl} alt="BuyScreen" className="h-16 w-auto object-contain mb-3" />
        ) : (
          <div className="w-14 h-14 rounded-full border-2 border-[#C5A059] flex items-center justify-center mb-3" style={{ background: "rgba(197,160,89,0.1)" }}>
            <ShoppingCart className="w-7 h-7 text-[#D4AF37]" />
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-[0.15em] text-white">BUYSCREEN</h1>
        <p className="text-sm sm:text-base tracking-[0.2em] text-white/70 font-medium">MARKETPLACE</p>
        <p className="mt-1 text-xs sm:text-sm tracking-[0.15em] text-[#C5A059] font-light">CLICKABLE VIDEO TECHNOLOGY</p>
      </div>

      {/* Video player mockup with interactive pins */}
      <div className="relative z-10 w-full max-w-2xl">
        <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-black">
          <img
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=450&fit=crop"
            alt="Shoppable video"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: "brightness(0.85)" }}
          />

          {/* Interactive plus pins */}
          {PRODUCT_PINS.map((pin) => (
            <div
              key={pin.id}
              className="absolute"
              style={{ left: `${pin.x}%`, top: `${pin.y}%`, transform: "translate(-50%, -50%)" }}
              onClick={(e) => { e.stopPropagation(); setActivePin(activePin === pin.id ? null : pin.id); }}
            >
              <motion.button
                whileHover={{ scale: 1.2 }}
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black" />
              </motion.button>

              {/* Product popup */}
              {activePin === pin.id && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-40 bg-black/90 backdrop-blur-md border border-[#C5A059]/40 rounded-lg p-3 z-30"
                >
                  <p className="text-xs font-bold text-white">{pin.name}</p>
                  <p className="text-sm font-extrabold text-[#D4AF37] mt-0.5">{pin.price}</p>
                  <button className="mt-2 w-full py-1.5 rounded-md bg-[#D4AF37] text-black text-xs font-bold flex items-center justify-center gap-1">
                    <ShoppingBag className="w-3 h-3" /> BUY NOW
                  </button>
                </motion.div>
              )}
            </div>
          ))}

          {/* Video controls bar */}
          <div className="absolute bottom-0 left-0 right-0 h-9 bg-black/70 backdrop-blur-sm flex items-center gap-2 px-3">
            <Play className="w-3.5 h-3.5 text-white" />
            <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full w-1/3 bg-[#D4AF37] rounded-full" />
            </div>
            <Volume2 className="w-3.5 h-3.5 text-white/70" />
            <Settings className="w-3.5 h-3.5 text-white/70" />
            <Maximize className="w-3.5 h-3.5 text-white/70" />
          </div>
        </div>
      </div>

      {/* Features row */}
      <div className="relative z-10 mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 w-full max-w-2xl">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.label} className="flex flex-col items-center text-center">
              <div className="w-9 h-9 rounded-full border border-[#C5A059]/40 flex items-center justify-center mb-1.5" style={{ background: "rgba(197,160,89,0.08)" }}>
                <Icon className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider text-white/70">{f.label}</span>
            </div>
          );
        })}
      </div>

      {/* Enter button */}
      <button className="relative z-10 mt-6 flex items-center gap-2 px-6 py-2.5 rounded-full border border-[#C5A059]/50 text-[#D4AF37] text-sm font-semibold hover:bg-[#C5A059]/15 transition-all">
        Enter Marketplace <ArrowRight className="w-4 h-4" />
      </button>

      {/* Footer */}
      <p className="relative z-10 mt-6 text-xs sm:text-sm tracking-[0.2em] text-white/40 font-light text-center">WATCH. CLICK. SHOP. ALL IN ONE EXPERIENCE.</p>
    </motion.div>
  );
}