import React from "react";
import { Sparkles } from "lucide-react";

export default function ComingSoonPlaque() {
  return (
    <div className="flex items-center gap-4 px-5 py-5 rounded-xl border border-[#B89045]/25 bg-[#1a1410]/70 max-w-md"
      style={{ boxShadow: "inset 0 1px 0 rgba(245,230,200,0.10), 0 1px 0 rgba(0,0,0,0.3)" }}
    >
      <div className="w-12 h-12 rounded-full border border-[#B89045]/40 flex items-center justify-center bg-[#B89045]/10 flex-shrink-0">
        <Sparkles className="w-5 h-5 text-[#B89045]" />
      </div>
      <div>
        <p className="font-display text-lg text-[#EDE3D0] leading-tight">Coming Soon</p>
        <p className="text-xs text-[#EDE3D0]/40 mt-0.5">This floor is being prepared.</p>
      </div>
    </div>
  );
}