import React from "react";

/**
 * Edwardian Fluted Dentil centerpiece — a full-width compact band with a
 * glossed deep dark-oak vertically-fluted field, bead-and-reel courses top
 * and bottom, ornate gilded acanthus-leaf scrollwork brackets at the far-left
 * and far-right ends, and a central circular medallion holding a recessed
 * dark-oak disc, a gilded laurel wreath following the circle, and a carved
 * walnut serif "G". Sits in the nav crown above the walnut panel.
 */
export default function EdwardianFlutedDentilCenterpiece({ className = "" }) {
  return (
    <div className={`relative w-full select-none pointer-events-none ${className}`}>
      {/* Top bead-and-reel course */}
      <div
        className="h-[6px] w-full"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(255,240,200,0.5) 0%, transparent 40%, rgba(0,0,0,0.4) 100%), repeating-linear-gradient(90deg, #d4af37 0px, #d4af37 6px, #120a04 6px, #120a04 9px)",
          boxShadow: "inset 0 1px 0 rgba(212,175,55,0.3), inset 0 -1px 0 rgba(0,0,0,0.6)",
        }}
      />

      {/* Fluted dark-oak field */}
      <div
        className="relative h-[44px] w-full overflow-hidden"
        style={{
          backgroundColor: "#2a1b0f",
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(0,0,0,0.0) 0px, rgba(0,0,0,0.0) 6px, rgba(0,0,0,0.42) 6px, rgba(0,0,0,0.42) 8px, rgba(74,48,32,0.22) 8px, rgba(74,48,32,0.22) 12px, rgba(0,0,0,0.0) 12px, rgba(0,0,0,0.0) 14px), linear-gradient(180deg, #4a3020 0%, #2a1b0f 45%, #1d1208 100%)",
          boxShadow: "inset 0 2px 4px rgba(0,0,0,0.6), inset 0 -1px 2px rgba(0,0,0,0.5)",
        }}
      >
        {/* Gloss sheen across the flutes */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(140,95,50,0.18) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.25) 100%)",
          }}
        />

        {/* Left acanthus scrollwork bracket */}
        <AcanthusBracket side="left" />

        {/* Right acanthus scrollwork bracket */}
        <AcanthusBracket side="right" />

        {/* Central medallion */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <svg
            viewBox="0 0 120 120"
            className="w-[92px] h-[92px] sm:w-[104px] sm:h-[104px] block"
            preserveAspectRatio="xMidYMid meet"
            aria-label="GlobeHouse monogram"
          >
            <defs>
              <linearGradient id="efdGold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#f0d060" />
                <stop offset="0.45" stopColor="#d4af37" />
                <stop offset="0.7" stopColor="#c5a059" />
                <stop offset="1" stopColor="#8b6e4d" />
              </linearGradient>
              <radialGradient id="efdDisc" cx="0.5" cy="0.4" r="0.6">
                <stop offset="0" stopColor="#3d281c" />
                <stop offset="0.7" stopColor="#2a1b0f" />
                <stop offset="1" stopColor="#120a04" />
              </radialGradient>
              <radialGradient id="efdWalnut" cx="0.5" cy="0.38" r="0.6">
                <stop offset="0" stopColor="#6a4a2c" />
                <stop offset="0.6" stopColor="#5a3f24" />
                <stop offset="1" stopColor="#2a1b13" />
              </radialGradient>
              <filter id="efdShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0.6" stdDeviation="0.5" floodColor="#000" floodOpacity="0.55" />
              </filter>

              {/* Single laurel leaf */}
              <path id="efdLeaf" d="M0 0 C 3 -3.6 3 -9.2 0 -12.8 C -3 -9.2 -3 -3.6 0 0 Z" />
            </defs>

            {/* Recessed dark-oak disc */}
            <circle cx="60" cy="60" r="34" fill="url(#efdDisc)" stroke="#8b6e4d" strokeWidth="0.6" />
            <circle cx="60" cy="60" r="30" fill="none" stroke="rgba(212,175,55,0.35)" strokeWidth="0.5" />

            {/* Gilded laurel wreath following the circle (mirrored halves) */}
            <g filter="url(#efdShadow)">
              {/* Right half leaves around the circle */}
              {[...Array(7)].map((_, i) => {
                const angle = -88 + i * 26;
                const rad = (angle * Math.PI) / 180;
                const r = 30;
                const x = 60 + r * Math.cos(rad);
                const y = 60 - r * Math.sin(rad);
                return (
                  <use
                    key={`r${i}`}
                    href="#efdLeaf"
                    fill="url(#efdGold)"
                    stroke="#7a5e33"
                    strokeWidth="0.3"
                    transform={`translate(${x} ${y}) rotate(${angle + 90})`}
                  />
                );
              })}
              {/* Left half leaves (mirrored) */}
              {[...Array(7)].map((_, i) => {
                const angle = -88 + i * 26;
                const rad = (angle * Math.PI) / 180;
                const r = 30;
                const x = 60 - r * Math.cos(rad);
                const y = 60 - r * Math.sin(rad);
                return (
                  <use
                    key={`l${i}`}
                    href="#efdLeaf"
                    fill="url(#efdGold)"
                    stroke="#7a5e33"
                    strokeWidth="0.3"
                    transform={`translate(${x} ${y}) rotate(${-angle - 90})`}
                  />
                );
              })}
              {/* Tie ribbons top + bottom */}
              <circle cx="60" cy="30" r="2.4" fill="#c5a059" stroke="#7a5e33" strokeWidth="0.3" />
              <circle cx="60" cy="90" r="2.4" fill="#c5a059" stroke="#7a5e33" strokeWidth="0.3" />
            </g>

            {/* Central carved walnut serif "G" */}
            <text
              x="60"
              y="78"
              textAnchor="middle"
              fontFamily="'Cormorant Garamond', Georgia, serif"
              fontWeight="700"
              fontSize="50"
              fill="url(#efdWalnut)"
              stroke="#5a3f24"
              strokeWidth="0.3"
            >
              G
            </text>
          </svg>
        </div>
      </div>

      {/* Bottom bead-and-reel course */}
      <div
        className="h-[6px] w-full"
        style={{
          backgroundImage:
            "linear-gradient(0deg, rgba(255,240,200,0.5) 0%, transparent 40%, rgba(0,0,0,0.4) 100%), repeating-linear-gradient(90deg, #d4af37 0px, #d4af37 6px, #120a04 6px, #120a04 9px)",
          boxShadow: "inset 0 -1px 0 rgba(212,175,55,0.3), inset 0 1px 0 rgba(0,0,0,0.6)",
        }}
      />
    </div>
  );
}

/**
 * Ornate gilded acanthus-leaf scrollwork bracket anchored at one end of the
 * fluted field.
 */
function AcanthusBracket({ side }) {
  const isLeft = side === "left";
  return (
    <div
      className={`absolute top-1/2 -translate-y-1/2 ${isLeft ? "left-0" : "right-0"} h-full pointer-events-none`}
      style={{ width: "72px" }}
    >
      <svg
        viewBox="0 0 80 56"
        className="w-full h-full block"
        preserveAspectRatio="xMidYMid meet"
        style={{ transform: isLeft ? undefined : "scaleX(-1)" }}
      >
        <defs>
          <linearGradient id={`acGold-${side}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f0d060" />
            <stop offset="0.5" stopColor="#d4af37" />
            <stop offset="0.8" stopColor="#c5a059" />
            <stop offset="1" stopColor="#8b6e4d" />
          </linearGradient>
          <linearGradient id={`acShade-${side}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#c5a059" />
            <stop offset="1" stopColor="#5a3f24" />
          </linearGradient>
          <filter id={`acShadow-${side}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0.4" dy="0.6" stdDeviation="0.5" floodColor="#000" floodOpacity="0.5" />
          </filter>
        </defs>

        <g filter={`url(#acShadow-${side})`} fill={`url(#acGold-${side})`} stroke="#7a5e33" strokeWidth="0.4">
          {/* Main C-scroll */}
          <path d="M2 28 C 10 6 30 4 36 18 C 40 27 32 33 26 30 C 20 27 22 20 28 20" fill="none" stroke={`url(#acShade-${side})`} strokeWidth="2.4" strokeLinecap="round" />
          {/* Acanthus leaves unfurling from the scroll */}
          <path d="M8 24 C 4 14 10 4 22 4 C 16 12 14 20 18 26 C 14 27 10 26 8 24 Z" />
          <path d="M18 30 C 14 22 18 14 28 12 C 24 20 24 26 28 30 C 25 32 21 32 18 30 Z" />
          <path d="M30 34 C 26 28 30 22 38 22 C 35 28 35 32 38 34 C 35 36 32 36 30 34 Z" />
          {/* Inner volute dot */}
          <circle cx="30" cy="22" r="2.2" fill={`url(#acShade-${side})`} stroke="#7a5e33" strokeWidth="0.3" />
        </g>
      </svg>
    </div>
  );
}