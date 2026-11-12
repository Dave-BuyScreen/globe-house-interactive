import React from "react";

/**
 * Beveled walnut "shelf" divider with a thin centered gold inlay line and
 * faint carved-wood corner flourishes. Replaces the old hairline border-t.
 */
export default function ShelfDivider() {
  return (
    <div aria-hidden className="relative w-full select-none">
      {/* Beveled plank */}
      <div
        className="relative h-3 w-full"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(230,200,150,0.03) 0px, rgba(230,200,150,0.03) 1px, transparent 1px, transparent 4px), linear-gradient(180deg, #4A3525 0%, #3B2A1E 45%, #2A1C12 100%)",
          boxShadow:
            "inset 0 1px 0 rgba(245,230,200,0.22), inset 0 -1px 0 rgba(0,0,0,0.55)",
        }}
      >
        {/* Centered gold inlay line */}
        <div
          className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(184,144,69,0.55) 18%, rgba(212,175,55,0.85) 50%, rgba(184,144,69,0.55) 82%, transparent 100%)",
            boxShadow: "0 0 6px rgba(212,175,55,0.35)",
          }}
        />
      </div>

      {/* Corner flourishes */}
      <CornerFlourish side="left" />
      <CornerFlourish side="right" />
    </div>
  );
}

function CornerFlourish({ side }) {
  const isLeft = side === "left";
  return (
    <svg
      aria-hidden
      width="34"
      height="14"
      viewBox="0 0 34 14"
      className={`hidden sm:block absolute -bottom-0.5 ${isLeft ? "left-2" : "right-2"}`}
      style={{ opacity: 0.4 }}
      fill="none"
    >
      <path
        d={isLeft
          ? "M2 7 C 8 1, 14 1, 18 7 C 22 13, 28 13, 32 7"
          : "M32 7 C 26 1, 20 1, 16 7 C 12 13, 6 13, 2 7"}
        stroke="#B89045"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <circle cx={isLeft ? "2" : "32"} cy="7" r="1.1" fill="#D4AF37" />
    </svg>
  );
}