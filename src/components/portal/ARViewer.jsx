import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Box, X, RotateCcw, Maximize2, Smartphone, Camera, Volume2, VolumeX, Sparkles, Share2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function ARViewer({ modelUrl, modelEmbedCode, productName, productPrice, shopUrl, characterQuote, themeColor = "#8B5CF6", isOpen, onClose, onAddToCart }) {
  const [arFailed, setArFailed] = useState(false);
  const [isRotating, setIsRotating] = useState(true);
  const [showParticles, setShowParticles] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showCharacter, setShowCharacter] = useState(false);
  const canvasRef = useRef(null);
  const audioRef = useRef(null);

  // Ambient sound effect
  useEffect(() => {
    if (!showParticles || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 1,
      speedY: Math.random() * 0.5 + 0.2,
      opacity: Math.random() * 0.5 + 0.2,
    }));

    let animationId;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(p => {
        ctx.fillStyle = `rgba(139, 92, 246, ${p.opacity})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        
        p.y -= p.speedY;
        if (p.y < 0) {
          p.y = canvas.height;
          p.x = Math.random() * canvas.width;
        }
      });
      
      animationId = requestAnimationFrame(animate);
    };
    
    animate();
    return () => cancelAnimationFrame(animationId);
  }, [showParticles, isOpen]);

  const handleScreenshot = async () => {
    try {
      const mv = document.querySelector('model-viewer');
      if (mv) {
        const blob = await mv.toBlob({ idealAspect: true });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${productName || 'product'}-ar.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Screenshot failed:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: productName,
          text: characterQuote || `Check out ${productName} in AR!`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    }
  };

  // Check if model-viewer is supported
  const hasModelViewer = typeof customElements !== 'undefined';

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-xl"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-lg mx-4 bg-[#13131a] rounded-3xl overflow-hidden border border-white/[0.08]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-violet-400" />
                <span className="text-sm font-medium text-white/80">{productName || "3D Viewer"}</span>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center text-white/40 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 3D Viewer Area */}
            <div className="aspect-square bg-gradient-to-b from-[#1c1c28] to-[#0f0f17] relative overflow-hidden">
              {/* Particle canvas */}
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ opacity: showParticles ? 1 : 0, transition: 'opacity 0.3s' }}
              />

              {/* Volumetric light beam */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-gradient-radial from-violet-500/10 via-violet-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

              {modelUrl || modelEmbedCode ? (
                <div className="w-full h-full relative">
                  {/* Ambient glow ring */}
                  <motion.div
                    animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    <div 
                      className="w-3/4 h-3/4 rounded-full blur-2xl"
                      style={{ background: `radial-gradient(circle, ${themeColor}20 0%, transparent 70%)` }}
                    />
                  </motion.div>

                  {/* Embedded code or model-viewer */}
                  {modelEmbedCode ? (
                    <div
                      className="w-full h-full relative z-10"
                      dangerouslySetInnerHTML={{ __html: modelEmbedCode }}
                    />
                  ) : (
                    <div
                      className="w-full h-full relative z-10"
                      dangerouslySetInnerHTML={{
                        __html: `
                          <model-viewer
                            src="${modelUrl}"
                            ar
                            ar-modes="scene-viewer quick-look webxr"
                            camera-controls
                            ${isRotating ? 'auto-rotate' : ''}
                            shadow-intensity="1.5"
                            exposure="1.2"
                            environment-image="neutral"
                            style="width:100%;height:100%;background:transparent;"
                            ar-status="not-presenting"
                          >
                            <button slot="ar-button" style="
                              background: ${themeColor};
                              color: white;
                              border: none;
                              border-radius: 12px;
                              padding: 10px 20px;
                              position: absolute;
                              bottom: 20px;
                              left: 50%;
                              transform: translateX(-50%);
                              font-size: 14px;
                              font-weight: 600;
                              cursor: pointer;
                              box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
                              transition: all 0.2s;
                            ">
                              📱 View in Your Space
                            </button>
                          </model-viewer>
                        `
                      }}
                    />
                  )}

                  {/* Character hologram overlay */}
                  <AnimatePresence>
                    {showCharacter && characterQuote && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="absolute bottom-20 left-4 max-w-[200px] bg-black/80 backdrop-blur-lg rounded-2xl p-4 border border-white/[0.12]"
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-xs">
                            ✨
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] text-white/40 uppercase tracking-wider font-medium mb-1">Character Message</p>
                            <p className="text-xs text-white/90 italic leading-relaxed">"{characterQuote}"</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Floating controls overlay */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setIsRotating(!isRotating)}
                      className="w-10 h-10 rounded-xl bg-black/40 backdrop-blur-sm border border-white/[0.12] flex items-center justify-center text-white/70 hover:text-white transition-colors"
                    >
                      <RotateCcw className={`w-4 h-4 ${isRotating ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowParticles(!showParticles)}
                      className="w-10 h-10 rounded-xl bg-black/40 backdrop-blur-sm border border-white/[0.12] flex items-center justify-center text-white/70 hover:text-white transition-colors"
                    >
                      <Sparkles className={`w-4 h-4 ${showParticles ? 'text-violet-400' : ''}`} />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className="w-10 h-10 rounded-xl bg-black/40 backdrop-blur-sm border border-white/[0.12] flex items-center justify-center text-white/70 hover:text-white transition-colors"
                    >
                      {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleScreenshot}
                      className="w-10 h-10 rounded-xl bg-black/40 backdrop-blur-sm border border-white/[0.12] flex items-center justify-center text-white/70 hover:text-white transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.04] flex items-center justify-center">
                      <Box className="w-8 h-8 text-white/20" />
                    </div>
                    <p className="text-white/30 text-sm">No 3D model available</p>
                    <p className="text-white/15 text-xs mt-1">Upload a .glb file to enable AR</p>
                  </div>
                </div>
              )}
            </div>

            {/* Product info & actions */}
            <div className="p-4 space-y-3 border-t border-white/[0.06]">
              {/* Product details */}
              {(productPrice || characterQuote) && (
                <div className="space-y-2">
                  {productPrice && (
                    <div className="flex items-center justify-between">
                      <span className="text-white/60 text-sm">{productName}</span>
                      <span className="text-white font-semibold">{productPrice}</span>
                    </div>
                  )}
                  
                  {characterQuote && (
                    <button
                      onClick={() => setShowCharacter(!showCharacter)}
                      className="w-full text-left px-3 py-2 rounded-lg bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/15 transition-colors"
                    >
                      <p className="text-xs text-violet-300 italic line-clamp-2">"{characterQuote}"</p>
                    </button>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                {modelUrl && !modelEmbedCode && (
                  <Button
                    className="flex-1 h-10 rounded-lg gap-2"
                    style={{ background: themeColor }}
                    onClick={() => {
                      const mv = document.querySelector('model-viewer');
                      if (mv && mv.activateAR) {
                        mv.activateAR();
                        base44.analytics.track({
                          eventName: "ar_viewer_launched",
                          properties: { product: productName }
                        });
                      }
                    }}
                  >
                    <Smartphone className="w-4 h-4" />
                    View in AR
                  </Button>
                )}

                {shopUrl && (
                  <Button
                    variant="outline"
                    className="flex-1 h-10 rounded-lg gap-2 border-white/[0.12] hover:bg-white/[0.06]"
                    onClick={() => {
                      if (onAddToCart) {
                        onAddToCart();
                      } else {
                        window.open(shopUrl, '_blank');
                      }
                      base44.analytics.track({
                        eventName: "ar_viewer_shop_click",
                        properties: { product: productName }
                      });
                    }}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {onAddToCart ? 'Add to Cart' : 'Shop Now'}
                  </Button>
                )}

                {navigator.share && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-10 h-10 rounded-lg"
                    onClick={handleShare}
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Tips */}
              <div className="flex items-center gap-4 text-[10px] text-white/30">
                <div className="flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" />
                  <span>Drag to rotate</span>
                </div>
                <div className="flex items-center gap-1">
                  <Maximize2 className="w-3 h-3" />
                  <span>Pinch to zoom</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}