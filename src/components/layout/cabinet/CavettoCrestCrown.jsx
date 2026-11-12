import React from "react";

/**
 * Cavetto Hotel Crest crown — a thin concave scooped cavetto molding in
 * glossed deep dark oak with a gilded bead-and-reel course along its lip.
 */
export default function CavettoCrestCrown() {
  return (
    <div className="w-full select-none pointer-events-none">
      {/* Top convex fillet */}
      <div
        className="h-1 w-full"
        style={{
          backgroundImage: "linear-gradient(180deg, #2a1b0f 0%, #1d1208 60%, #120a04 100%)",
          boxShadow: "inset 0 1px 0 rgba(150,100,55,0.22), inset 0 -1px 0 rgba(0,0,0,0.6)",
        }}
      />
      {/* Upper gold fillet */}
      <div
        className="h-px w-full"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(139,110,77,0.75) 15%, rgba(163,128,56,0.95) 50%, rgba(139,110,77,0.75) 85%, transparent)",
          boxShadow: "0 0 6px rgba(139,110,77,0.4)",
        }}
      />
      {/* Concave cavetto scoop — glossed deep dark oak */}
      <div
        className="h-3 w-full"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(120,80,45,0.28) 0%, transparent 22%, transparent 70%, rgba(0,0,0,0.45) 100%), radial-gradient(ellipse 180% 130% at 50% 120%, #2a1b0f 0%, #1d1208 38%, #120a04 72%, #0a0502 100%)",
          boxShadow:
            "inset 0 2px 3px rgba(0,0,0,0.75), inset 0 -1px 2px rgba(0,0,0,0.5), inset 0 1px 0 rgba(140,95,50,0.18)",
        }}
      />
      {/* Gilded bead-and-reel along the lip */}
      <div
        className="h-2 w-full"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(255,240,200,0.45) 0%, transparent 35%, rgba(0,0,0,0.4) 100%), repeating-linear-gradient(90deg, #8b6e4d 0px, #8b6e4d 7px, #120a04 7px, #120a04 10px)",
          boxShadow:
            "inset 0 1px 0 rgba(139,110,77,0.3), inset 0 -1px 0 rgba(0,0,0,0.65)",
        }}
      />
      {/* Lower gold fillet separating crown from panel */}
      <div
        className="h-px w-full"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(139,110,77,0.6) 15%, rgba(163,128,56,0.85) 50%, rgba(139,110,77,0.6) 85%, transparent)",
        }}
      />
    </div>
  );
}