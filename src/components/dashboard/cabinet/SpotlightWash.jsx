import React from "react";

/**
 * Warm recessed-spotlight wash that fades down from the top of a floor band.
 * Pure CSS radial-gradient overlay — pointer-events-none so it never blocks cards.
 */
export default function SpotlightWash() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 h-40 z-0"
      style={{
        background:
          "radial-gradient(120% 100% at 50% 0%, rgba(217,168,108,0.16) 0%, rgba(217,168,108,0.06) 35%, transparent 72%)",
      }}
    />
  );
}