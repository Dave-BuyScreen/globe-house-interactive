import React from "react";
import { Link } from "react-router-dom";
import { Tv } from "lucide-react";

/**
 * Site logo for the nav corner. The outer perimeter circle has been
 * removed; the logo image fills the full container space.
 * `size="sm"` renders a compact version for corner placement.
 */
export default function NavEmblem({ logoUrl, size = "md" }) {
  const dims =
    size === "sm"
      ? "w-16 h-16 sm:w-[72px] sm:h-[72px]"
      : "w-[84px] h-[84px] sm:w-[96px] sm:h-[96px]";
  const iconCls =
    size === "sm" ? "w-12 h-12 sm:w-[54px] sm:h-[54px]" : "w-14 h-14 sm:w-16 sm:h-16";

  return (
    <Link to="/Dashboard" className="relative flex items-center justify-center group shrink-0" aria-label="Go to Dashboard">
      <div className={`relative z-10 ${dims} flex items-center justify-center`}>
        {logoUrl ? (
          <img src={logoUrl} alt="GlobeHouse" className="w-full h-full object-contain" />
        ) : (
          <Tv className={`${iconCls} text-[#d4af37]`} />
        )}
      </div>
    </Link>
  );
}