import React from "react";

/**
 * Gilded ornate corner bracket — replaces the Greek-key motif at the four
 * corners of the nav panel border. `flip` mirrors it via CSS transform.
 */
export default function GreekKeyCorner({ className = "", flip }) {
  return (
    <svg
      viewBox="0 0 22 22"
      className={className}
      style={flip ? { transform: flip } : undefined}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Outer gilded L-bracket */}
      <path
        d="M2 20 L2 8 Q2 2 8 2 L20 2 L20 4 L8 4 Q4 4 4 8 L4 20 Z"
        fill="#d4af37"
      />
      {/* Inner bevel highlight */}
      <path
        d="M6 18 Q6 6 18 6"
        stroke="rgba(255,235,180,0.6)"
        strokeWidth="0.7"
        fill="none"
      />
      {/* Volute dots */}
      <circle cx="9" cy="13" r="1.5" fill="#8b6e4d" />
      <circle cx="13" cy="9" r="1.1" fill="#8b6e4d" />
    </svg>
  );
}