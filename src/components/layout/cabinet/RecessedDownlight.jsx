import React from "react";

/**
 * Recessed downlights set into the top crown border.
 * - Two very faint side beams flank the emblem (narrow at top, widen and
 *   fade toward the bottom ledge).
 * - One stronger centered beam sits over the central logo.
 */
function Beam({ leftPct, width = "230px", intensity = 1, blur = 4 }) {
  const top = 0.3 * intensity;
  const mid = 0.14 * intensity;
  const low = 0.04 * intensity;
  return (
    <div
      aria-hidden
      className="absolute top-0 bottom-0 pointer-events-none z-30"
      style={{ left: leftPct, width, transform: "translateX(-50%)" }}
    >
      <div
        className="absolute top-0 left-0 w-full h-full"
        style={{
          clipPath: "polygon(44% 0%, 56% 0%, 100% 100%, 0% 100%)",
          background: `linear-gradient(180deg, rgba(255,226,176,${top}) 0%, rgba(255,214,156,${mid}) 40%, rgba(255,214,156,${low}) 70%, transparent 100%)`,
          filter: `blur(${blur}px)`,
        }}
      />
      <div
        className="absolute top-[2px] left-1/2 -translate-x-1/2 w-10 h-1.5 rounded-full"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,238,196,0.5) 0%, rgba(184,144,69,0.2) 100%)",
          boxShadow:
            `0 0 ${10 * intensity}px rgba(255,222,160,${0.5 * intensity}), inset 0 -1px 1px rgba(0,0,0,0.4)`,
        }}
      />
    </div>
  );
}

export default function RecessedDownlight() {
  return (
    <>
      {/* Faint side beams flanking the emblem */}
      <Beam leftPct="20%" intensity={0.32} blur={5} />
      <Beam leftPct="80%" intensity={0.32} blur={5} />
      {/* Centered beam + halo over the emblem */}
      <div
        aria-hidden
        className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 pointer-events-none z-30"
        style={{ width: "240px" }}
      >
        <div
          className="absolute top-0 left-0 w-full h-full"
          style={{
            clipPath: "polygon(44% 0%, 56% 0%, 100% 100%, 0% 100%)",
            background:
              "linear-gradient(180deg, rgba(255,226,176,0.30) 0%, rgba(255,214,156,0.14) 40%, rgba(255,214,156,0.04) 70%, transparent 100%)",
            filter: "blur(5px)",
          }}
        />
        <div
          className="absolute top-6 left-1/2 -translate-x-1/2 w-44 h-44 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(255,228,180,0.14) 0%, transparent 65%)",
          }}
        />
        <div
          className="absolute top-[2px] left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,238,196,0.6) 0%, rgba(184,144,69,0.25) 100%)",
            boxShadow:
              "0 0 12px rgba(255,222,160,0.6), inset 0 -1px 1px rgba(0,0,0,0.4)",
          }}
        />
      </div>
    </>
  );
}