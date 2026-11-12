import React from "react";
import { motion } from "framer-motion";

const DOOR_IMAGE =
  "/brand/10d465a6a_generated_image.png";

// Two full-height iron-cast door panels meet at the screen's center.
// When `open` is true they slide apart symmetrically (left pulls left,
// right pulls right), progressively revealing the landscape scenery behind.
export default function IronGates({ open, opacity = 1 }) {
  const slide = {
    duration: 3,
    ease: [0.45, 0, 0.2, 1],
  };

  return (
    <motion.div
      className="absolute inset-0 z-20"
      initial={false}
      animate={{ opacity }}
      transition={{ duration: 1, ease: "easeInOut" }}
    >
      {/* Left door — slides left */}
      <motion.div
        className="absolute top-0 bottom-0 left-0 overflow-hidden"
        style={{ width: "50%" }}
        initial={false}
        animate={{ x: open ? "-101%" : "0%" }}
        transition={slide}
      >
        <img
          src={DOOR_IMAGE}
          alt=""
          draggable={false}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            pointerEvents: "none",
            userSelect: "none",
          }}
        />
      </motion.div>

      {/* Right door — mirrored, slides right */}
      <motion.div
        className="absolute top-0 bottom-0 right-0 overflow-hidden"
        style={{ width: "50%" }}
        initial={false}
        animate={{ x: open ? "101%" : "0%" }}
        transition={slide}
      >
        <img
          src={DOOR_IMAGE}
          alt=""
          draggable={false}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            transform: "scaleX(-1)",
            pointerEvents: "none",
            userSelect: "none",
          }}
        />
      </motion.div>

      {/* Vignette to deepen the moody framing */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ boxShadow: "inset 0 0 140px rgba(0,0,0,0.85)" }}
      />
    </motion.div>
  );
}