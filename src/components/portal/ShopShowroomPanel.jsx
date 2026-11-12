import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import ARViewer from "./ARViewer";

export default function ShopShowroomPanel({ trigger, themeColor = "#8B5CF6", isOpen, onClose, onShopClick }) {
  const [showAR, setShowAR] = useState(false);
  const [playingConfessional, setPlayingConfessional] = useState(false);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="fixed top-6 right-6 z-50 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Split View Container - two 9:16 panels side by side */}
          <div className="h-full flex flex-col lg:flex-row items-center justify-center gap-4 p-4 overflow-y-auto lg:overflow-hidden">
            {/* Left: Confessional Video - 9:16 */}
            <motion.div
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex-shrink-0 flex flex-col items-center"
              style={{ width: "calc(80vh * 9/16)", maxWidth: "45vw" }}
            >
              <div className="w-full">
                <div className="mb-3">
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Behind the Moment</p>
                  <h2 className="text-lg font-bold text-white truncate">{trigger?.prompt_text || "Confessional"}</h2>
                </div>

                {(trigger?.confessional_embed_code || trigger?.confessional_video_url) ? (
                  <div className="rounded-2xl overflow-hidden bg-black relative" style={{ aspectRatio: "9/16", maxHeight: "80vh" }}>
                    <iframe
                      src={
                        trigger.confessional_embed_code
                          ? trigger.confessional_embed_code.match(/src=["']([^"']+)["']/)?.[1]
                          : (() => {
                              const m = (trigger.confessional_video_url || "").match(/vimeo\.com\/(\d+)/);
                              return m ? `https://player.vimeo.com/video/${m[1]}?autoplay=1&badge=0&autopause=0` : trigger.confessional_video_url;
                            })()
                      }
                      frameBorder="0"
                      allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
                      allowFullScreen
                      className="absolute top-0 left-0 w-full h-full"
                      title="Confessional Video"
                    />
                  </div>
                ) : (
                  <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center" style={{ aspectRatio: "9/16" }}>
                    <p className="text-white/20 text-sm">No confessional available</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Right: 3D Product Showcase - 9:16 */}
            <motion.div
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex-shrink-0 flex flex-col items-center"
              style={{ width: "calc(80vh * 9/16)", maxWidth: "45vw" }}
            >
              <div className="w-full">
                <div className="mb-3">
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Shop This Look</p>
                  <h2 className="text-lg font-bold text-white truncate">{trigger?.product_name || "Product"}</h2>
                  {trigger?.product_price && (
                    <p className="text-base text-amber-400 mt-0.5">{trigger?.product_price}</p>
                  )}
                </div>

                {/* 3D Model Display with Auto-Rotation */}
                {(trigger?.model_url || trigger?.model_embed_code) ? (
                  <div className="relative">
                    <div className="rounded-2xl overflow-hidden bg-gradient-to-b from-[#1c1c28] to-[#0f0f17] relative" style={{ aspectRatio: "9/16" }}>
                      {/* Ambient glow */}
                      <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
                      >
                        <div 
                          className="w-3/4 h-3/4 rounded-full blur-3xl"
                          style={{ background: `radial-gradient(circle, ${themeColor}30 0%, transparent 70%)` }}
                        />
                      </motion.div>

                      {/* 3D Model */}
                      {trigger?.model_embed_code ? (
                        <div
                          className="w-full h-full relative z-10"
                          dangerouslySetInnerHTML={{ __html: trigger.model_embed_code }}
                        />
                      ) : trigger?.model_url ? (
                        <div
                          className="w-full h-full relative z-10"
                          dangerouslySetInnerHTML={{
                            __html: `
                              <model-viewer
                                src="${trigger.model_url}"
                                auto-rotate
                                auto-rotate-delay="0"
                                rotation-per-second="20deg"
                                camera-controls
                                shadow-intensity="1.5"
                                exposure="1.2"
                                environment-image="neutral"
                                style="width:100%;height:100%;background:transparent;"
                              >
                              </model-viewer>
                            `
                          }}
                        />
                      ) : null}

                      {/* "Slow Motion 3D" badge */}
                      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/[0.12] z-20">
                        <p className="text-xs text-white/80 font-medium">🔄 3D View</p>
                      </div>
                    </div>

                    {/* Character Quote */}
                    {trigger?.product_quote && (
                      <div className="mt-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                        <p className="text-xs text-white/70 italic">"{trigger.product_quote}"</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-4">
                      {trigger?.shop_url && (
                        <Button
                          onClick={onShopClick}
                          className="flex-1 h-11 rounded-xl gap-2 bg-amber-500 hover:bg-amber-600"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          Shop Now
                        </Button>
                      )}
                    </div>
                  </div>
                ) : trigger?.product_image_url ? (
                  <div className="rounded-2xl overflow-hidden" style={{ aspectRatio: "9/16" }}>
                    <img 
                      src={trigger.product_image_url} 
                      alt={trigger.product_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center" style={{ aspectRatio: "9/16" }}>
                    <ShoppingBag className="w-12 h-12 text-white/10" />
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* AR Viewer Modal */}
          <ARViewer
            modelUrl={trigger?.model_url}
            modelEmbedCode={trigger?.model_embed_code}
            productName={trigger?.product_name}
            productPrice={trigger?.product_price}
            shopUrl={trigger?.shop_url}
            characterQuote={trigger?.product_quote}
            themeColor={themeColor}
            isOpen={showAR}
            onClose={() => setShowAR(false)}
            onAddToCart={onShopClick}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}