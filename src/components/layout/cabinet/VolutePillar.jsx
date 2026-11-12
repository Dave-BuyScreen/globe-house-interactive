import React from "react";

/**
 * Dark-walnut Greek/Roman column bookending the cabinet crown.
 * Ionic volute capital, fluted shaft with cylindrical shading,
 * and a plinth + torus base — elaborate craftsman antique.
 */
export default function VolutePillar({ side = "left" }) {
  return (
    <div className="relative flex-shrink-0 h-full flex flex-col items-center">
      <Capital side={side} />

      {/* Fluted shaft */}
      <div
        className="flex-1 w-6 sm:w-8 my-0.5 rounded-[1px]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(0,0,0,0.55) 0px, rgba(0,0,0,0.55) 1px, rgba(193,162,138,0.12) 1px, rgba(193,162,138,0.12) 2px, transparent 2px, transparent 5px), linear-gradient(90deg, #150F0A 0%, #2A1C12 18%, #4A3525 42%, #5D4032 50%, #4A3525 58%, #2A1C12 82%, #150F0A 100%)",
          boxShadow:
            "inset 0 1px 0 rgba(193,162,138,0.22), inset 0 -1px 0 rgba(0,0,0,0.55)",
        }}
      />

      <Base />
    </div>
  );
}

function Capital({ side }) {
  const isLeft = side === "left";
  return (
    <div className="flex flex-col items-center">
      {/* Abacus (top square block) */}
      <div
        className="w-7 sm:w-9 h-1.5 rounded-t-[2px]"
        style={{
          backgroundImage: "linear-gradient(180deg, #7A5B45 0%, #5D4032 55%, #3E2A1D 100%)",
          boxShadow: "inset 0 2px 0 rgba(193,162,138,0.40), inset 0 -1px 0 rgba(0,0,0,0.55)",
        }}
      />
      {/* Volute + echinus carving */}
      <svg
        aria-hidden
        width="34"
        height="20"
        viewBox="0 0 34 20"
        className="sm:w-10 sm:h-6"
        style={{ opacity: 0.92 }}
        fill="none"
      >
        {/* Echinus cushion under the abacus */}
        <path d="M2 2 C 10 8, 24 8, 32 2" stroke="#A68366" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        {/* Left volute */}
        <g>
          <path
            d="M6 10 C 6 5, 11 4, 13 8 C 14 11, 11 12, 10 10"
            stroke="#A68366"
            strokeWidth="1.3"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="10" cy="10" r="1.3" fill="#C1A28A" />
        </g>
        {/* Right volute (mirrored) */}
        <g>
          <path
            d="M28 10 C 28 5, 23 4, 21 8 C 20 11, 23 12, 24 10"
            stroke="#A68366"
            strokeWidth="1.3"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="24" cy="10" r="1.3" fill="#C1A28A" />
        </g>
        {/* Central palmette */}
        <path d="M17 8 C 18 12, 16 12, 17 8 Z" fill="#7A5B45" />
      </svg>
      {/* Necking (thin band above shaft) */}
      <div
        className="w-5 sm:w-7 h-1"
        style={{
          backgroundImage: "linear-gradient(180deg, #4A3525 0%, #2A1C12 100%)",
          boxShadow: "inset 0 1px 0 rgba(193,162,138,0.20), inset 0 -1px 0 rgba(0,0,0,0.5)",
        }}
      />
    </div>
  );
}

function Base() {
  return (
    <div className="flex flex-col items-center w-full">
      {/* Torus molding */}
      <div
        className="w-7 sm:w-9 h-1.5 rounded-full"
        style={{
          backgroundImage: "linear-gradient(180deg, #5D4032 0%, #3E2A1D 100%)",
          boxShadow: "inset 0 1px 0 rgba(193,162,138,0.28)",
        }}
      />
      {/* Plinth block */}
      <div
        className="w-7 sm:w-9 h-2 rounded-b-[2px]"
        style={{
          backgroundImage: "linear-gradient(180deg, #4A3525 0%, #1A120D 100%)",
          boxShadow: "inset 0 1px 0 rgba(193,162,138,0.18), inset 0 -1px 0 rgba(0,0,0,0.6), 0 2px 3px rgba(0,0,0,0.5)",
        }}
      />
    </div>
  );
}