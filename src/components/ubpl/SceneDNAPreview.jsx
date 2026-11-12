import React, { useState } from "react";
import { Dna, ChevronDown, ChevronRight, ShoppingBag, Box, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function ObjectCard({ obj, index }) {
  const [expanded, setExpanded] = useState(index === 0);

  const categoryIcon = obj.category === "apparel" ? "👗" :
    obj.category === "furniture" ? "🛋️" :
    obj.category === "electronics" ? "📱" : "📦";

  return (
    <div className="border border-white/[0.06] rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg leading-none">{categoryIcon}</span>
          <div className="text-left">
            <p className="text-sm font-semibold text-white/90 leading-none">{obj.name}</p>
            <p className="text-xs text-white/30 mt-0.5">{obj.brand} · {obj.object_id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {obj.commerce?.ar_supported && (
            <span className="text-xs bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full">AR</span>
          )}
          <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">BuyScreen</span>
          {expanded ? <ChevronDown className="w-4 h-4 text-white/30" /> : <ChevronRight className="w-4 h-4 text-white/30" />}
        </div>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-white/[0.06] pt-3">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {[
                  ["object_id", obj.object_id],
                  ["category", obj.category],
                  ["color", obj.color || "—"],
                  ["track_priority", obj.track_priority],
                  ["interaction", obj.interaction_type],
                  ["visibility start", obj.visibility_frames?.start],
                  ["visibility end", obj.visibility_frames?.end],
                  ["affiliate", obj.commerce?.affiliate_enabled ? "enabled" : "disabled"],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p className="text-xs text-white/30 uppercase tracking-wider">{label}</p>
                    <p className="text-xs text-white/70 font-mono mt-0.5">{val}</p>
                  </div>
                ))}
              </div>
              {obj.spatial_coordinates && (
                <div className="mt-3 pt-3 border-t border-white/[0.06]">
                  <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Spatial Coordinates</p>
                  <code className="text-xs text-fuchsia-300 font-mono">{JSON.stringify(obj.spatial_coordinates)}</code>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SceneDNAPreview({ sceneDNA, isParsing }) {
  const [viewMode, setViewMode] = useState("visual"); // "visual" | "raw"

  if (isParsing) {
    return (
      <div className="bg-[#13131a] border border-white/[0.06] rounded-2xl flex-1 flex items-center justify-center p-12">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto animate-pulse">
            <Dna className="w-6 h-6 text-violet-400" />
          </div>
          <p className="text-sm text-white/40">Generating Scene DNA...</p>
        </div>
      </div>
    );
  }

  if (!sceneDNA) {
    return (
      <div className="bg-[#13131a] border border-white/[0.06] rounded-2xl flex-1 flex items-center justify-center p-12">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto">
            <Dna className="w-6 h-6 text-white/20" />
          </div>
          <p className="text-sm text-white/30">Scene DNA preview will appear here</p>
          <p className="text-xs text-white/15">Enter a UBPL prompt and click Parse</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#13131a] border border-white/[0.06] rounded-2xl flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Dna className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-semibold text-white/80">Scene DNA</span>
          <span className="text-xs text-white/20 font-mono ml-1">{sceneDNA.scene_id}</span>
        </div>
        <div className="flex bg-white/[0.04] border border-white/[0.06] rounded-lg p-0.5 gap-0.5">
          {["visual", "raw"].map((m) => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all capitalize ${viewMode === m ? "bg-white/10 text-white" : "text-white/30 hover:text-white/50"}`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {viewMode === "visual" ? (
          <>
            {/* Scene Meta */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.05]">
                <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Scene Title</p>
                <p className="text-sm font-semibold text-white/90">{sceneDNA.scene_title}</p>
              </div>
              <div className={`rounded-xl p-3 border ${sceneDNA.vimeo_id ? "bg-emerald-500/[0.05] border-emerald-500/20" : "bg-amber-500/[0.05] border-amber-500/20"}`}>
                <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Vimeo ID</p>
                <p className={`text-sm font-semibold font-mono ${sceneDNA.vimeo_id ? "text-emerald-300" : "text-amber-400"}`}>
                  {sceneDNA.vimeo_id || "⚠ Not linked"}
                </p>
              </div>
            </div>

            {/* Environment */}
            <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.05]">
              <div className="flex items-center gap-2 mb-2">
                <Layers className="w-3.5 h-3.5 text-white/30" />
                <p className="text-xs text-white/30 uppercase tracking-wider">Environment</p>
              </div>
              <div className="flex gap-3 flex-wrap">
                {[
                  ["type", sceneDNA.environment?.type],
                  ["style", sceneDNA.environment?.style],
                  ["lighting", sceneDNA.environment?.lighting],
                ].filter(([, v]) => v).map(([k, v]) => (
                  <span key={k} className="text-xs text-white/60">
                    <span className="text-white/30">{k}:</span> {v}
                  </span>
                ))}
              </div>
            </div>

            {/* Format */}
            <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.05]">
              <div className="flex items-center gap-2 mb-2">
                <Box className="w-3.5 h-3.5 text-white/30" />
                <p className="text-xs text-white/30 uppercase tracking-wider">Video Format</p>
              </div>
              <div className="flex gap-4">
                {Object.entries(sceneDNA.video_format || {}).map(([k, v]) => (
                  <span key={k} className="text-xs text-white/60">
                    <span className="text-white/30">{k}:</span> {v}
                  </span>
                ))}
              </div>
            </div>

            {/* Objects */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ShoppingBag className="w-3.5 h-3.5 text-white/30" />
                <p className="text-xs text-white/30 uppercase tracking-wider">
                  Object Registry — {sceneDNA.objects?.length || 0} item(s)
                </p>
              </div>
              <div className="space-y-2">
                {(sceneDNA.objects || []).map((obj, i) => (
                  <ObjectCard key={obj.object_id || i} obj={obj} index={i} />
                ))}
              </div>
            </div>
          </>
        ) : (
          <pre className="text-xs text-emerald-300 font-mono leading-relaxed whitespace-pre-wrap break-all bg-black/20 rounded-xl p-4 border border-white/[0.05]">
            {JSON.stringify(sceneDNA, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}