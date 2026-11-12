import React, { forwardRef } from "react";
import EpisodeCard from "./EpisodeCard";
import ComingSoonPlaque from "./ComingSoonPlaque";
import ShelfDivider from "./cabinet/ShelfDivider";
import FloorCartouche from "./cabinet/FloorCartouche";
import FlutedPilasters from "./cabinet/FlutedPilasters";
import SpotlightWash from "./cabinet/SpotlightWash";
import { floorName } from "./floors";

const FloorBand = forwardRef(({ floor, index, episodes, rowLabels }, ref) => {
  const name = floorName(floor, rowLabels);
  const items = floor.select(episodes || []);
  const empty = items.length === 0;

  return (
    <section ref={ref} data-floor-key={floor.key} className="relative scroll-mt-28">
      {/* Beveled walnut shelf divider (replaces hairline border-t) */}
      <ShelfDivider />

      <div className="relative bg-gradient-to-b from-[#17120d] to-[#120e0a]">
        <SpotlightWash />
        <FlutedPilasters />

        <div className="relative px-4 sm:px-6 max-w-[1800px] mx-auto py-8 z-10">
          {/* Floor header */}
          <div className="flex items-center gap-4 mb-5">
            <FloorCartouche tag={floor.tag} />
            <div className="flex-1 min-w-0">
              <h2 className="font-display text-2xl sm:text-3xl text-[#EDE3D0] leading-tight truncate">{name}</h2>
              <p className="text-xs text-[#D4AF37] mt-0.5">{floor.blurb}</p>
            </div>
            <div className="hidden sm:block flex-1 h-px bg-gradient-to-r from-[#B89045]/30 to-transparent max-w-xs" />
          </div>

          {/* Gallery or coming-soon plaque */}
          {empty ? (
            <ComingSoonPlaque />
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {items.map((ep, i) => (
                <EpisodeCard key={ep.id} episode={ep} index={i} ratio="poster" />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
});

FloorBand.displayName = "FloorBand";
export default FloorBand;