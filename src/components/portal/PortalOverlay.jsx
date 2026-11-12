import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function PortalOverlay({ isOpen, themeColor = "#8B5CF6", onChooseConfessional, onChooseBuyScreen, trigger, showConfession = true, showBuyScreen = true }) {
  const canvasRef = useRef(null);

  // Simple portal particle effect
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array.from({ length: 60 }, () => ({
      x: canvas.width / 2 + (Math.random() - 0.5) * 200,
      y: canvas.height / 2 + (Math.random() - 0.5) * 200,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      size: Math.random() * 3 + 1,
      alpha: Math.random() * 0.5 + 0.2,
      life: Math.random(),
    }));

    let animId;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.003;
        if (p.life <= 0) {
          p.x = canvas.width / 2 + (Math.random() - 0.5) * 200;
          p.y = canvas.height / 2 + (Math.random() - 0.5) * 200;
          p.life = 1;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${themeColor}${Math.floor(p.alpha * p.life * 255).toString(16).padStart(2, "0")}`;
        ctx.fill();
      });

      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => cancelAnimationFrame(animId);
  }, [isOpen, themeColor]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

          {/* Particle canvas */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none opacity-60"
          />

          {/* Portal ring animation */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="absolute w-[340px] h-[340px] md:w-[500px] md:h-[500px] rounded-full pointer-events-none"
            style={{
              border: `2px solid ${themeColor}40`,
              boxShadow: `0 0 80px ${themeColor}20, inset 0 0 80px ${themeColor}10`,
            }}
          />

          {/* Choice panels */}
          <div className={`relative z-10 flex flex-col md:flex-row gap-4 md:gap-6 px-6 max-w-3xl w-full ${(!showConfession || !showBuyScreen) ? "max-w-md" : ""}`}>
            {/* Confessional choice */}
            {showConfession && (
            <motion.button
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              onClick={onChooseConfessional}
              className="flex-1 group relative rounded-2xl overflow-hidden cursor-pointer"
            >
              <div className="relative p-8 md:p-10 bg-white/[0.04] border border-white/[0.08] rounded-2xl
                            hover:bg-white/[0.07] hover:border-white/[0.15] transition-all duration-300"
                   style={{ boxShadow: `0 0 60px ${themeColor}10` }}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center mb-5">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-violet-400">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">View Confessional</h3>
                <p className="text-sm text-white/40">Hear what they really meant.</p>
                <motion.div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ boxShadow: `inset 0 0 40px ${themeColor}15` }}
                />
              </div>
            </motion.button>
            )}

            {/* BuyScreen choice — marketplace poster product card */}
            {showBuyScreen && (
            <motion.button
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              onClick={onChooseBuyScreen}
              className="flex-1 group relative rounded-2xl overflow-hidden cursor-pointer text-left"
            >
              <div className="relative rounded-2xl overflow-hidden border border-[#C5A059]/40 bg-black/90 backdrop-blur-md
                            hover:border-[#C5A059]/70 transition-all duration-300"
                   style={{ boxShadow: `0 0 60px ${themeColor}10` }}
              >
                {/* Product image */}
                <div className="relative w-full aspect-[4/3] overflow-hidden bg-black">
                  <img
                    src={trigger?.product_image_url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=450&fit=crop"}
                    alt={trigger?.product_name || "Product"}
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ filter: "brightness(0.7)" }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 border border-[#C5A059]/40 text-[10px] font-semibold tracking-[0.15em] text-[#D4AF37]">
                    BUYSCREEN
                  </span>
                </div>

                {/* Product details */}
                <div className="relative p-5 md:p-6">
                  {trigger?.product_brand && (
                    <p className="text-xs tracking-[0.15em] font-semibold text-[#C5A059] mb-1 uppercase">{trigger.product_brand}</p>
                  )}
                  <h3 className="text-lg font-bold text-white leading-tight mb-1">
                    {trigger?.product_name || "View Item"}
                  </h3>
                  {trigger?.product_quote && (
                    <p className="text-xs text-white/50 italic mb-3 line-clamp-2">"{trigger.product_quote}"</p>
                  )}
                  <div className="flex items-center justify-between gap-3 mt-2">
                    <span className="text-2xl font-extrabold text-[#D4AF37]">
                      {trigger?.product_price || ""}
                    </span>
                    <span
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#D4AF37] text-black text-xs font-bold tracking-wide group-hover:bg-[#C5A059] transition-colors"
                      onClick={(e) => { e.stopPropagation(); onChooseBuyScreen(); }}
                    >
                      BUY NOW
                    </span>
                  </div>
                </div>
              </div>
            </motion.button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}