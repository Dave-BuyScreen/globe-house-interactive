import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { base44 } from "@/api/base44Client";

function extractVimeoEmbedUrl(url) {
  if (!url) return null;
  // Already an embed URL
  if (url.includes("player.vimeo.com")) return url;
  // Extract ID from share/regular URL
  const match = url.match(/vimeo\.com\/(\d+)/);
  if (match) return `https://player.vimeo.com/video/${match[1]}?autoplay=1&badge=0&autopause=0`;
  return null;
}

function extractIframeSrc(embedCode) {
  if (!embedCode) return null;
  const match = embedCode.match(/src=["']([^"']+)["']/);
  return match ? match[1] : null;
}

export default function ConfessionalPanel({ isOpen, trigger, themeColor = "#8B5CF6", onClose, episodeId }) {

  useEffect(() => {
    if (isOpen) {
      base44.analytics.track({
        eventName: "confessional_view",
        properties: { episode_id: episodeId || "", timestamp: trigger?.timestamp || 0 }
      });
    }
  }, [isOpen]);

  const handleClose = () => {
    base44.analytics.track({
      eventName: "confessional_complete",
      properties: { episode_id: episodeId || "", timestamp: trigger?.timestamp || 0 }
    });
    onClose();
  };

  // Determine embed src: prefer embed code, then URL
  const embedSrc = trigger?.confessional_embed_code
    ? extractIframeSrc(trigger.confessional_embed_code)
    : extractVimeoEmbedUrl(trigger?.confessional_video_url);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={handleClose}
        >
          <div className="absolute inset-0 bg-black/85 backdrop-blur-lg" />

          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)" }}
          />

          <motion.div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />

          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 20 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-2xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="relative rounded-2xl overflow-hidden bg-black"
              style={{ aspectRatio: "9/16", maxHeight: "80vh", boxShadow: `0 0 100px ${themeColor}20, 0 20px 60px rgba(0,0,0,0.5)` }}
            >
              {embedSrc ? (
                <iframe
                  src={embedSrc}
                  frameBorder="0"
                  allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                  allowFullScreen
                  className="absolute top-0 left-0 w-full h-full"
                  title="Confessional Video"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-900 to-black">
                  <p className="text-white/30 text-sm">Confessional clip not available</p>
                </div>
              )}

              <div className="absolute inset-0 pointer-events-none"
                style={{ background: `linear-gradient(180deg, transparent 60%, ${themeColor}10 100%)` }}
              />

              <button
                onClick={handleClose}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm
                           flex items-center justify-center text-white/60 hover:text-white hover:bg-black/60
                           transition-all duration-200 z-20"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute bottom-0 left-0 right-0 h-[2px]"
                style={{ background: `linear-gradient(90deg, transparent, ${themeColor}, transparent)` }}
              />
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-center text-white/20 text-xs mt-4"
            >
              Tap anywhere to close
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}