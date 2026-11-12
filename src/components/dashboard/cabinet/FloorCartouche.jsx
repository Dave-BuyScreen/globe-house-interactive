import React from "react";

/**
 * Brass cartouche medallion with geometric gold inlay framing the floor letter.
 * Replaces the plain square floor badge.
 */
export default function FloorCartouche({ tag }) {
  return (
    <div className="relative flex-shrink-0">
      {/* Carved-wood motif behind the plate */}
      <CarvedMotif />

      <div
        className="relative w-14 h-14 rounded-full flex flex-col items-center justify-center"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(255,235,190,0.05) 0px, rgba(255,235,190,0.05) 1px, transparent 1px, transparent 3px), radial-gradient(120% 120% at 50% 25%, #6B5230 0%, #4A3525 55%, #2A1C12 100%)",
          boxShadow:
            "inset 0 1px 0 rgba(245,230,200,0.30), inset 0 -2px 4px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.4)",
        }}
      >
        {/* Geometric gold inlay ring */}
        <div
          className="absolute inset-1.5 rounded-full"
          style={{
            border: "1px solid rgba(212,175,55,0.55)",
            boxShadow: "inset 0 0 0 1px rgba(184,144,69,0.25)",
          }}
        />
        <div
          className="absolute inset-2.5 rounded-full"
          style={{ border: "0.5px solid rgba(184,144,69,0.40)" }}
        />

        <span className="relative text-[8px] tracking-[0.25em] text-[#B89045]/70 uppercase leading-none">
          Flr
        </span>
        <span className="relative font-display text-xl text-[#E9C97A] leading-none mt-0.5">
          {tag}
        </span>
      </div>
    </div>
  );
}

function CarvedMotif() {
  return (
    <svg
      aria-hidden
      width="56"
      height="56"
      viewBox="0 0 56 56"
      className="absolute -inset-1 pointer-events-none"
      style={{ opacity: 0.18 }}
      fill="none"
    >
      {/* Four acanthus-style flourishes radiating from the medallion */}
      {[0, 90, 180, 270].map((rot) => (
        <g key={rot} transform={`rotate(${rot} 28 28)`}>
          <path
            d="M28 4 C 31 10, 31 14, 28 18 C 25 14, 25 10, 28 4 Z"
            fill="#8B6C45"
          />
        </g>
      ))}
    </svg>
  );
}