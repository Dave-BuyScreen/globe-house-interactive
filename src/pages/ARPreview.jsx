import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Box, Smartphone, RotateCcw, Maximize2, ExternalLink, Sparkles, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ARPreview() {
  const params = new URLSearchParams(window.location.search);
  const modelUrl = params.get("model");
  const productName = decodeURIComponent(params.get("name") || "Product");
  const productPrice = decodeURIComponent(params.get("price") || "");
  const productBrand = decodeURIComponent(params.get("brand") || "");
  const shopUrl = decodeURIComponent(params.get("shop") || "");
  const themeColor = decodeURIComponent(params.get("color") || "#8B5CF6");

  const [arSupported, setArSupported] = useState(null);
  const [arLaunched, setArLaunched] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);

  // Inject model-viewer script
  useEffect(() => {
    if (!document.querySelector('script[src*="model-viewer"]')) {
      const script = document.createElement("script");
      script.type = "module";
      script.src = "https://ajax.googleapis.com/ajax/libs/model-viewer/3.3.0/model-viewer.min.js";
      document.head.appendChild(script);
    }
    // Check WebXR / AR support
    if (navigator.xr) {
      navigator.xr.isSessionSupported("immersive-ar").then((supported) => {
        setArSupported(supported);
      }).catch(() => setArSupported(false));
    } else {
      setArSupported(false);
    }
  }, []);

  const handleActivateAR = () => {
    const mv = document.querySelector("model-viewer");
    if (mv && mv.activateAR) {
      mv.activateAR();
      setArLaunched(true);
    }
  };

  if (!modelUrl) {
    return (
      <div className="min-h-screen bg-[#060609] flex items-center justify-center text-white px-6">
        <div className="text-center">
          <Box className="w-12 h-12 text-violet-500/30 mx-auto mb-4" />
          <p className="text-white/40 text-sm">No 3D model specified.</p>
          <p className="text-white/20 text-xs mt-1">Scan a valid QR code from the GlobeHouse BuyScreen.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060609] flex flex-col text-white">
      {/* Top bar */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: `${themeColor}33` }}
          >
            <Box className="w-4 h-4" style={{ color: themeColor }} />
          </div>
          <div>
            <p className="text-xs font-semibold text-white/80 leading-none">{productName}</p>
            {productBrand && <p className="text-[10px] mt-0.5" style={{ color: themeColor }}>{productBrand}</p>}
          </div>
        </div>
        {productPrice && (
          <span className="text-base font-bold text-white">{productPrice}</span>
        )}
      </div>

      {/* 3D Viewer */}
      <div className="flex-1 relative bg-gradient-to-b from-[#0f0f1a] to-[#060609] overflow-hidden">
        {/* Ambient glow */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div
            className="w-72 h-72 rounded-full blur-3xl"
            style={{ background: `radial-gradient(circle, ${themeColor}50 0%, transparent 70%)` }}
          />
        </motion.div>

        {/* model-viewer */}
        <div
          className="absolute inset-0 z-10"
          dangerouslySetInnerHTML={{
            __html: `
              <model-viewer
                id="ar-model-viewer"
                src="${modelUrl}"
                ar
                ar-modes="scene-viewer quick-look webxr"
                camera-controls
                auto-rotate
                auto-rotate-delay="0"
                rotation-per-second="25deg"
                shadow-intensity="1.5"
                exposure="1.2"
                environment-image="neutral"
                style="width:100%;height:100%;background:transparent;"
                ar-status="not-presenting"
              >
                <button
                  slot="ar-button"
                  style="
                    background: ${themeColor};
                    color: white;
                    border: none;
                    border-radius: 14px;
                    padding: 12px 28px;
                    position: absolute;
                    bottom: 24px;
                    left: 50%;
                    transform: translateX(-50%);
                    font-size: 15px;
                    font-weight: 700;
                    cursor: pointer;
                    box-shadow: 0 4px 20px rgba(139,92,246,0.45);
                    letter-spacing: 0.02em;
                    white-space: nowrap;
                  "
                >
                  📱 View in Your Space
                </button>
              </model-viewer>
            `,
          }}
        />

        {/* Controls hint */}
        <div className="absolute bottom-4 left-4 flex items-center gap-3 text-[10px] text-white/30 z-20 pointer-events-none">
          <span className="flex items-center gap-1"><RotateCcw className="w-3 h-3" /> Drag to rotate</span>
          <span className="flex items-center gap-1"><Maximize2 className="w-3 h-3" /> Pinch to zoom</span>
        </div>
      </div>

      {/* Bottom action panel */}
      <div className="px-5 py-5 space-y-3 border-t border-white/[0.06] bg-[#08080f]">

        {/* AR support status */}
        <AnimatePresence mode="wait">
          {arSupported === true && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25"
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <p className="text-xs text-emerald-300">WebXR AR is supported on this device</p>
            </motion.div>
          )}
          {arSupported === false && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/25"
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <p className="text-xs text-amber-300">Use the "View in Your Space" button in the 3D viewer above</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Primary AR button */}
        <Button
          onClick={handleActivateAR}
          className="w-full h-13 rounded-xl font-semibold text-sm gap-2"
          style={{ background: themeColor, height: "52px" }}
        >
          {arLaunched ? (
            <><Sparkles className="w-4 h-4" /> AR Active — Look around!</>
          ) : (
            <><Smartphone className="w-4 h-4" /> Launch AR — Place in Your Room</>
          )}
        </Button>

        {shopUrl && shopUrl !== "undefined" && (
          <a
            href={shopUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full h-11 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/[0.06] transition-all text-sm font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            Shop Now
          </a>
        )}

        <p className="text-center text-[10px] text-white/20">
          GlobeHouse AR · Powered by WebXR &amp; Scene DNA
        </p>
      </div>
    </div>
  );
}