import React from "react";
import { Settings } from "lucide-react";
import AppearancePanel from "./AppearancePanel";
import FleurDeLisCenterpiece from "@/components/layout/cabinet/FleurDeLisCenterpiece";

const HERO_IMAGE =
  "/brand/0a8a9a195_TheNewestGlobeHouseLandingPage.PNG";
const HERO_IMAGE_MOBILE =
  "/brand/3ac91a905_globeHousePortrait9-16newpage.PNG";

export default function ConciergeHero({ effectiveIsAdmin, onOpenManager, siteSettings }) {
  return (
    <div className="relative w-full overflow-hidden h-[100svh] md:h-[72vh] lg:h-[92vh] bg-[#120e0a]">
      {effectiveIsAdmin && (
        <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
          <AppearancePanel siteSettings={siteSettings} />
          <button
            onClick={onOpenManager}
            className="w-10 h-10 rounded-full bg-[#1a1410]/70 hover:bg-[#241c15] flex items-center justify-center border border-[#B89045]/25 transition-colors"
            title="Manage Slides"
          >
            <Settings className="w-4 h-4 text-[#D4AF37]" />
          </button>
        </div>
      )}

      {/* Mobile portrait background (no text) */}
      <img
        src={HERO_IMAGE_MOBILE}
        alt=""
        className="md:hidden w-full h-full object-cover"
        draggable={false}
      />
      {/* Tablet / desktop landscape background */}
      <img
        src={HERO_IMAGE}
        alt=""
        className="hidden md:block w-full h-full object-cover"
        draggable={false}
      />

      {/* Tablet-only branded composition (md breakpoint) */}
      <div className="hidden md:flex lg:hidden absolute inset-0 z-20 flex-col items-center justify-between pt-[5vh] pb-[16vh] px-4 pointer-events-none text-center">
        <p className="font-sans text-white/85 text-[0.7rem] tracking-[0.5em] uppercase drop-shadow-[0_1px_6px_rgba(0,0,0,0.6)]">
          Discover Transformation
        </p>

        {siteSettings?.logo_url && (
          <img
            src={siteSettings.logo_url}
            alt=""
            className="w-24 h-24 object-contain drop-shadow-[0_2px_12px_rgba(0,0,0,0.65)]"
          />
        )}

        <div className="flex flex-col items-center gap-2.5">
          <p className="font-sans text-white/80 text-[0.7rem] tracking-[0.4em] uppercase">Welcome To</p>
          <h1
            className="text-white text-4xl tracking-[0.14em] leading-none"
            style={{ fontFamily: "Italiana, serif", textShadow: "0 2px 18px rgba(0,0,0,0.6)" }}
          >
            GLOBEHOUSE
          </h1>
          <p className="font-sans text-white/80 text-[0.7rem] tracking-[0.4em] uppercase">Interactive</p>
          <FleurDeLisCenterpiece className="w-9 h-9 opacity-90" />
        </div>

        <p className="font-display text-white/85 text-[0.7rem] tracking-[0.32em] uppercase">
          Educate &nbsp;·&nbsp; Enlighten &nbsp;·&nbsp; Empower &nbsp;·&nbsp; Emancipate
        </p>
        </div>

        {/* Bottom gradient to blend the image into the site (begins below the tagline) */}
        <div className="absolute bottom-0 left-0 right-0 h-[14vh] bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/55 to-transparent pointer-events-none z-10" />

        </div>
        );
        }