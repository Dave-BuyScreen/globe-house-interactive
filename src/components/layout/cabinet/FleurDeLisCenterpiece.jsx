import React from "react";

const CENTERPIECE_IMG =
  "/brand/064306c7c_GoldenCrescentCenterpiece.png";

/**
 * Centerpiece for the nav crown — a transparent golden fleur-de-lis
 * emblem image, scaled to fit its container proportionately.
 * No monogram / no text.
 */
export default function FleurDeLisCenterpiece({ className = "" }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`} aria-hidden="true">
      <img
        src={CENTERPIECE_IMG}
        alt=""
        className="w-full h-full object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]"
        draggable={false}
      />
    </div>
  );
}