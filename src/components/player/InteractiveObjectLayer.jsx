import React from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Renders active VideoObjectMapping hotspots on the video frame.
 * Objects appear/disappear based on currentTime vs start_time/end_time.
 */
export default function InteractiveObjectLayer({ mappings = [], currentTime, selectedObjectId, themeColor = "#8B5CF6" }) {
  const activeObjects = mappings.filter(
    (o) => o.status === "confirmed" && currentTime >= o.start_time && currentTime <= o.end_time
  );

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      <AnimatePresence>
        {activeObjects.map((obj) => {
          const bb = obj.bounding_box;
          if (!bb) return null;

          const isSelected = obj.id === selectedObjectId;

          return (
            <motion.div
              key={obj.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              style={{
                position: "absolute",
                left: `${bb.x * 100}%`,
                top: `${bb.y * 100}%`,
                width: `${bb.width * 100}%`,
                height: `${bb.height * 100}%`,
              }}
            >
              {/* Bounding box border */}
              <motion.div
                className="absolute inset-0 rounded-lg"
                style={{
                  border: `1.5px solid ${isSelected ? themeColor : themeColor + "80"}`,
                  boxShadow: isSelected
                    ? `0 0 16px ${themeColor}90, inset 0 0 12px ${themeColor}20`
                    : `0 0 8px ${themeColor}40`,
                }}
                animate={isSelected ? {
                  boxShadow: [
                    `0 0 16px ${themeColor}90`,
                    `0 0 32px ${themeColor}cc`,
                    `0 0 16px ${themeColor}90`,
                  ]
                } : {}}
                transition={{ duration: 1, repeat: Infinity }}
              />

              {/* Anchor dot */}
              <motion.div
                className="absolute w-2 h-2 rounded-full"
                style={{
                  background: themeColor,
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  boxShadow: `0 0 6px ${themeColor}`,
                }}
                animate={{ scale: [1, 1.4, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 2, repeat: Infinity }}
              />

              {/* Label tag */}
              {obj.label && (
                <motion.div
                  className="absolute -bottom-6 left-0 text-xs px-2 py-0.5 rounded-full whitespace-nowrap"
                  style={{
                    background: themeColor + "cc",
                    color: "#fff",
                    fontSize: "10px",
                    backdropFilter: "blur(4px)",
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {obj.label}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}