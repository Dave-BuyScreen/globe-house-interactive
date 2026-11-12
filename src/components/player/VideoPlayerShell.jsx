import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import InteractiveObjectLayer from "./InteractiveObjectLayer";

/**
 * Shared visual shell for video players: renders the video element (children),
 * interactive object hotspots, trigger prompt overlay, and paused tint.
 */
export default function VideoPlayerShell({
  children,
  activeTrigger,
  onPromptClick,
  isPaused,
  themeColor = "#8B5CF6",
  mappings = [],
  currentTime = 0,
}) {
  return (
    <div
      className="relative bg-black rounded-2xl overflow-hidden group mx-auto"
      style={{ aspectRatio: "9/16", maxHeight: "90vh", width: "auto" }}
    >
      {children}

      {/* Interactive Object Hotspots */}
      <InteractiveObjectLayer
        mappings={mappings}
        currentTime={currentTime}
        selectedObjectId={null}
        themeColor={themeColor}
      />

      {/* Trigger Prompt */}
      <AnimatePresence>
        {activeTrigger && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
          >
            <button
              onClick={onPromptClick}
              className="relative px-8 py-3 rounded-full text-sm font-medium tracking-wide cursor-pointer
                         bg-black/60 backdrop-blur-xl border border-white/10 text-white/90
                         hover:bg-black/80 hover:border-white/20 transition-all duration-300"
              style={{ boxShadow: `0 0 40px ${themeColor}30, 0 0 80px ${themeColor}15` }}
            >
              <motion.span
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {activeTrigger.prompt_text || "Find the deeper meaning."}
              </motion.span>
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ border: `1px solid ${themeColor}40` }}
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Paused overlay tint */}
      <AnimatePresence>
        {isPaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm pointer-events-none z-10"
          />
        )}
      </AnimatePresence>
    </div>
  );
}