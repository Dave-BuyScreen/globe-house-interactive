import React from "react";

/**
 * Beaux-Arts cornice crown molding — a compact layered crown (corona, gilded
 * dentil course, modillion bed-mold) that sits above the smooth walnut nav panel.
 */
export default function BeauxArtsCornice() {
  return (
    <div className="w-full select-none pointer-events-none">
      {/* Corona — top stepped crown */}
      <div
        className="h-3 w-full"
        style={{
          backgroundImage:
            "linear-gradient(180deg, #5A4129 0%, #4D3829 38%, #3B2A1E 72%, #2A1F17 100%)",
          boxShadow:
            "inset 0 2px 0 rgba(197,160,89,0.38), inset 0 -1px 0 rgba(0,0,0,0.5), 0 1px 0 rgba(0,0,0,0.4)",
        }}
      />
      {/* Upper gold fillet */}
      <div
        className="h-px w-full"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(212,175,55,0.7) 15%, rgba(212,175,55,0.95) 50%, rgba(212,175,55,0.7) 85%, transparent)",
          boxShadow: "0 0 6px rgba(212,175,55,0.45)",
        }}
      />
      {/* Dentil course — gilded blocks */}
      <div
        className="h-2.5 w-full"
        style={{
          backgroundColor: "#2A1F17",
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(197,160,89,0.82) 0px, rgba(197,160,89,0.82) 7px, rgba(0,0,0,0.5) 7px, rgba(0,0,0,0.5) 13px)",
          boxShadow:
            "inset 0 1px 0 rgba(212,175,55,0.3), inset 0 -1px 0 rgba(0,0,0,0.6)",
        }}
      />
      {/* Bed-mold with gilded modillion brackets */}
      <div
        className="h-3 w-full"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(197,160,89,0.16) 0px, rgba(197,160,89,0.16) 2px, transparent 2px, transparent 26px), linear-gradient(180deg, #3B2A1E 0%, #2A1F17 100%)",
          boxShadow:
            "inset 0 2px 3px rgba(0,0,0,0.6), inset 0 -1px 0 rgba(197,160,89,0.2)",
        }}
      />
      {/* Lower gold fillet separating crown from panel */}
      <div
        className="h-px w-full"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(197,160,89,0.6) 15%, rgba(197,160,89,0.85) 50%, rgba(197,160,89,0.6) 85%, transparent)",
        }}
      />
    </div>
  );
}