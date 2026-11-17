import React from "react";
import { Crown, Ticket, Gem } from "lucide-react";
import { TIERS, tierOf } from "@/lib/viewerAccess";

const ICONS = { subscription: Crown, tvod: Ticket, vault: Gem };

// Small gold label for non-free episodes. Renders nothing for free ones.
export default function TierBadge({ episode, className = "" }) {
  const tier = tierOf(episode);
  if (tier === "free") return null;
  const Icon = ICONS[tier];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-black/70 border border-[#D4AF37]/50 text-[#D4AF37] ${className}`}
    >
      <Icon className="w-3 h-3" />
      {TIERS[tier].short}
    </span>
  );
}
