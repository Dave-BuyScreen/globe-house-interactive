import React from "react";

/**
 * Gilded laurel-wreath monogram centerpiece — two mirrored laurel branches
 * curving to meet at top and bottom, tied with a small gold ribbon at the
 * base, framing a carved walnut serif "G". Replaces the central logo
 * medallion in the nav crown.
 */
export default function LaurelWreathCenterpiece({ className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 120 120"
        className="w-full h-full block"
        preserveAspectRatio="xMidYMid meet"
        aria-label="GlobeHouse monogram"
      >
        <defs>
          <linearGradient id="lwGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f0d060" />
            <stop offset="0.45" stopColor="#d4af37" />
            <stop offset="0.7" stopColor="#c5a059" />
            <stop offset="1" stopColor="#8b6e4d" />
          </linearGradient>
          <linearGradient id="lwStem" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e6c860" />
            <stop offset="0.5" stopColor="#c5a059" />
            <stop offset="1" stopColor="#8b6e4d" />
          </linearGradient>
          <radialGradient id="lwWalnut" cx="0.5" cy="0.38" r="0.62">
            <stop offset="0" stopColor="#6a4a2c" />
            <stop offset="0.55" stopColor="#4a2f1c" />
            <stop offset="1" stopColor="#2a1b13" />
          </radialGradient>
          <radialGradient id="lwRecess" cx="0.5" cy="0.45" r="0.55">
            <stop offset="0" stopColor="#120a04" stopOpacity="0.6" />
            <stop offset="1" stopColor="#120a04" stopOpacity="0" />
          </radialGradient>
          <filter id="lwShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0.6" stdDeviation="0.5" floodColor="#000" floodOpacity="0.55" />
          </filter>

          {/* Single laurel leaf (almond), base at origin, tip pointing up */}
          <path id="lwLeaf" d="M0 0 C 3.2 -4 3.2 -10.5 0 -14.5 C -3.2 -10.5 -3.2 -4 0 0 Z" />

          {/* One laurel branch: stem + outward + inner leaves */}
          <g id="lwBranch">
            <path
              d="M60 105 C 50 91 44 71 46 51 C 48 35 55 21 60 14"
              stroke="url(#lwStem)"
              strokeWidth="2.1"
              fill="none"
              strokeLinecap="round"
            />
            {/* outward leaves (pointing away from center) */}
            <use href="#lwLeaf" fill="url(#lwGold)" stroke="#7a5e33" strokeWidth="0.3" transform="translate(57 99) rotate(218)" />
            <use href="#lwLeaf" fill="url(#lwGold)" stroke="#7a5e33" strokeWidth="0.3" transform="translate(51 85) rotate(233)" />
            <use href="#lwLeaf" fill="url(#lwGold)" stroke="#7a5e33" strokeWidth="0.3" transform="translate(47 69) rotate(248)" />
            <use href="#lwLeaf" fill="url(#lwGold)" stroke="#7a5e33" strokeWidth="0.3" transform="translate(46 53) rotate(263)" />
            <use href="#lwLeaf" fill="url(#lwGold)" stroke="#7a5e33" strokeWidth="0.3" transform="translate(48 37) rotate(278)" />
            <use href="#lwLeaf" fill="url(#lwGold)" stroke="#7a5e33" strokeWidth="0.3" transform="translate(53 23) rotate(293)" />
            <use href="#lwLeaf" fill="url(#lwGold)" stroke="#7a5e33" strokeWidth="0.3" transform="translate(58 13) rotate(308)" />
            {/* inner leaves (pointing toward center), smaller */}
            <use href="#lwLeaf" fill="url(#lwGold)" stroke="#7a5e33" strokeWidth="0.25" transform="translate(63 97) rotate(38) scale(0.78)" />
            <use href="#lwLeaf" fill="url(#lwGold)" stroke="#7a5e33" strokeWidth="0.25" transform="translate(59 82) rotate(53) scale(0.78)" />
            <use href="#lwLeaf" fill="url(#lwGold)" stroke="#7a5e33" strokeWidth="0.25" transform="translate(56 67) rotate(68) scale(0.78)" />
            <use href="#lwLeaf" fill="url(#lwGold)" stroke="#7a5e33" strokeWidth="0.25" transform="translate(56 51) rotate(83) scale(0.78)" />
            <use href="#lwLeaf" fill="url(#lwGold)" stroke="#7a5e33" strokeWidth="0.25" transform="translate(58 35) rotate(98) scale(0.78)" />
            <use href="#lwLeaf" fill="url(#lwGold)" stroke="#7a5e33" strokeWidth="0.25" transform="translate(62 21) rotate(113) scale(0.78)" />
          </g>
        </defs>

        {/* Carved walnut recess behind monogram */}
        <circle cx="60" cy="60" r="32" fill="url(#lwRecess)" />

        {/* Laurel branches (left + mirrored right) */}
        <g filter="url(#lwShadow)">
          <use href="#lwBranch" />
          <use href="#lwBranch" transform="translate(120 0) scale(-1 1)" />
        </g>

        {/* Gold tie-ribbon at the base */}
        <g filter="url(#lwShadow)" transform="translate(60 106)">
          <path d="M0 1 C -9 -3 -11 6 -2 6 Z" fill="url(#lwGold)" stroke="#7a5e33" strokeWidth="0.3" />
          <path d="M0 1 C 9 -3 11 6 2 6 Z" fill="url(#lwGold)" stroke="#7a5e33" strokeWidth="0.3" />
          <path d="M-2 5 L-6 12" stroke="url(#lwStem)" strokeWidth="1.4" strokeLinecap="round" fill="none" />
          <path d="M2 5 L6 12" stroke="url(#lwStem)" strokeWidth="1.4" strokeLinecap="round" fill="none" />
          <circle cx="0" cy="3" r="2.6" fill="#c5a059" stroke="#7a5e33" strokeWidth="0.4" />
        </g>

        {/* Central serif "G" in brighter gold */}
        <defs>
          <linearGradient id="lwBrightGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f0d060" />
            <stop offset="0.5" stopColor="#e6c860" />
            <stop offset="1" stopColor="#c5a059" />
          </linearGradient>
        </defs>
        <text
          x="60"
          y="77"
          textAnchor="middle"
          fontFamily="'Cormorant Garamond', Georgia, serif"
          fontWeight="700"
          fontSize="58"
          fill="url(#lwBrightGold)"
          stroke="#c5a059"
          strokeWidth="0.35"
        >
          G
        </text>
      </svg>
    </div>
  );
}