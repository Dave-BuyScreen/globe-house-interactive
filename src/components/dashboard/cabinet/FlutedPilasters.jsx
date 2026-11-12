import React from "react";

/**
 * Subtle vertical fluted column pilasters framing the left/right edges of a
 * floor content area, topped with a small carved capital accent. Thin on mobile.
 */
export default function FlutedPilasters() {
  return (
    <>
      <Pilaster side="left" />
      <Pilaster side="right" />
    </>
  );
}

function Pilaster({ side }) {
  const isLeft = side === "left";
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute top-0 bottom-0 ${isLeft ? "left-0" : "right-0"} w-1 sm:w-1.5 z-0`}
      style={{
        backgroundImage:
          "repeating-linear-gradient(180deg, rgba(230,200,150,0.10) 0px, rgba(230,200,150,0.10) 1px, transparent 1px, transparent 3px), linear-gradient(180deg, #3B2A1E 0%, #2A1C12 50%, #1A120D 100%)",
        boxShadow: isLeft
          ? "inset -1px 0 0 rgba(0,0,0,0.4), inset 1px 0 0 rgba(245,230,200,0.10)"
          : "inset 1px 0 0 rgba(0,0,0,0.4), inset -1px 0 0 rgba(245,230,200,0.10)",
      }}
    >
      {/* Capital accent at top */}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-0 h-5 w-3 sm:w-4"
        style={{
          backgroundImage:
            "linear-gradient(180deg, #4A3525 0%, #3B2A1E 100%)",
          boxShadow:
            "inset 0 1px 0 rgba(245,230,200,0.25), inset 0 -1px 0 rgba(0,0,0,0.5), 0 0 0 0.5px rgba(184,144,69,0.40)",
          borderRadius: "2px 2px 0 0",
        }}
      >
        {/* Gold inlay dot on the capital */}
        <div
          className="absolute left-1/2 top-1.5 -translate-x-1/2 w-1 h-1 rounded-full"
          style={{ background: "#D4AF37", opacity: 0.6 }}
        />
      </div>
    </div>
  );
}