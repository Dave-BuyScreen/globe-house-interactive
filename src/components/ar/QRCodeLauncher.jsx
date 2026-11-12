import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QrCode, X, Smartphone, Copy, Check } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function QRCodeLauncher({ trigger, themeColor = "#8B5CF6" }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!trigger?.model_url) return null;

  const params = new URLSearchParams({
    model: trigger.model_url,
    name: trigger.product_name || "",
    price: trigger.product_price || "",
    brand: trigger.product_brand || "",
    shop: trigger.shop_url || "",
    color: themeColor,
  });
  const arUrl = `${window.location.origin}/ARPreview?${params.toString()}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(arUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="h-10 px-3 rounded-full border border-white/10 text-white/70 hover:text-white hover:bg-white/[0.06] transition-all flex items-center text-xs font-medium"
        title="Scan QR to view in AR"
      >
        <QrCode className="w-3.5 h-3.5 mr-1.5" />
        <span>QR</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-xl"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 20 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-80 bg-[#13131a] border border-white/[0.08] rounded-3xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <QrCode className="w-4 h-4" style={{ color: themeColor }} />
                  <span className="text-sm font-medium text-white/80">AR Preview</span>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center text-white/40 hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center px-8 py-6 gap-5">
                <div
                  className="p-4 rounded-2xl"
                  style={{ background: "#fff" }}
                >
                  <QRCodeSVG
                    value={arUrl}
                    size={180}
                    bgColor="#ffffff"
                    fgColor="#0a0a0f"
                    level="M"
                  />
                </div>

                <div className="text-center space-y-1.5">
                  <div className="flex items-center justify-center gap-2">
                    <Smartphone className="w-4 h-4" style={{ color: themeColor }} />
                    <p className="text-sm font-medium text-white/80">Scan with your phone</p>
                  </div>
                  <p className="text-xs text-white/35 leading-relaxed">
                    Opens <span className="text-white/60 font-medium">{trigger.product_name || "this product"}</span> in AR — place it directly in your physical environment.
                  </p>
                </div>

                {/* Copy link */}
                <button
                  onClick={handleCopy}
                  className="w-full flex items-center justify-center gap-2 h-10 rounded-xl border border-white/10 text-white/50 hover:text-white hover:bg-white/[0.05] transition-all text-xs font-medium"
                >
                  {copied ? (
                    <><Check className="w-3.5 h-3.5 text-emerald-400" /><span className="text-emerald-400">Link copied!</span></>
                  ) : (
                    <><Copy className="w-3.5 h-3.5" />Copy AR link</>
                  )}
                </button>

                {/* Open directly (for mobile users already on phone) */}
                <a
                  href={arUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center h-11 rounded-xl font-semibold text-sm text-white transition-all"
                  style={{ background: themeColor }}
                >
                  Open on This Device
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}