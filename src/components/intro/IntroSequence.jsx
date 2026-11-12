import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";

const LOGO_INTRO_VIDEO =
  "/brand/a99140999_export.mp4";

// Play the logo intro for this many seconds, then fade to the text + Enter button.
const INTRO_DURATION_SECONDS = 3;

export default function IntroSequence() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState("video"); // video → fade → enter
  const [skipped, setSkipped] = useState(false);
  const videoRef = useRef(null);

  // Pull admin-configured video URL from SiteSettings (optional override).
  const { data: settings = [] } = useQuery({
    queryKey: ["siteSettings"],
    queryFn: () => base44.entities.SiteSettings.list(),
  });
  const siteSettings = settings[0];

  const videoSrc = siteSettings?.intro_desktop_video_url || LOGO_INTRO_VIDEO;

  // Start playing immediately once the source resolves.
  useEffect(() => {
    videoRef.current?.play().catch(() => {});
  }, [videoSrc]);

  // Safety net: if the video hasn't triggered the fade within a buffer window,
  // proceed anyway so the user is never stuck.
  useEffect(() => {
    if (phase !== "video") return;
    const t = setTimeout(() => setPhase("fade"), (INTRO_DURATION_SECONDS + 2) * 1000);
    return () => clearTimeout(t);
  }, [phase]);

  // After the fade phase reveals the text, transition to the Enter button.
  useEffect(() => {
    if (phase !== "fade") return;
    const t = setTimeout(() => setPhase("enter"), skipped ? 200 : 2600);
    return () => clearTimeout(t);
  }, [phase, skipped]);

  // Cut to INTRO_DURATION_SECONDS: once playback reaches it, proceed to fade.
  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.currentTime >= INTRO_DURATION_SECONDS) {
      v.pause();
      setPhase("fade");
    }
  }, []);

  const skip = useCallback(() => {
    setSkipped(true);
    setPhase("fade");
  }, []);

  const fading = phase === "fade";
  const showEnter = phase === "enter";
  const showSkip = phase === "video";

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      {/* Logo intro video — plays for 3 seconds then fades to text. */}
      <div className="absolute inset-0 overflow-hidden">
        <video
          key={videoSrc}
          ref={videoRef}
          src={videoSrc}
          muted
          playsInline
          preload="auto"
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setPhase("fade")}
          onError={() => setPhase("fade")}
          className="absolute w-full h-full object-cover origin-center"
        />
      </div>

      {/* Fade to black + Discover Transformation (persists through Enter phase so the logo never reappears) */}
      <AnimatePresence>
        {(fading || showEnter) && (
          <motion.div
            className="absolute inset-0 z-30 bg-black flex items-center justify-center"
            initial={{ opacity: skipped ? 1 : 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: skipped ? 0 : 1.8, ease: "easeInOut" }}
          >
            <motion.p
              initial={{ opacity: 0, letterSpacing: "0.5em" }}
              animate={{ opacity: 1, letterSpacing: "0.4em" }}
              transition={{ delay: skipped ? 0.2 : 1, duration: 1.4, ease: "easeOut" }}
              className="text-white text-2xl sm:text-4xl font-light px-6 w-full text-center"
              style={{ fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" }}
            >
              DISCOVER TRANSFORMATION
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enter button */}
      <AnimatePresence>
        {showEnter && (
          <motion.button
            onClick={() => navigate("/Dashboard")}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: skipped ? 0.2 : 0.4, duration: 0.7, ease: "easeOut" }}
            className="absolute left-1/2 -translate-x-1/2 bottom-[14%] px-10 py-3.5 rounded-full border border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/10 hover:bg-[#D4AF37]/25 hover:scale-105 transition-all text-sm font-semibold tracking-[0.25em] uppercase backdrop-blur-sm z-40"
          >
            Enter
          </motion.button>
        )}
      </AnimatePresence>

      {/* Skip */}
      {showSkip && (
        <button
          onClick={skip}
          className="absolute top-5 right-6 z-50 text-xs text-white/40 hover:text-white/85 transition-colors tracking-wider"
        >
          Skip →
        </button>
      )}
    </div>
  );
}