import React, { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Clock, MessageSquare, ShoppingBag } from "lucide-react";

export default function TimelineVisualizer({ triggers = [], duration = 120, onAddTrigger, onSelectTrigger }) {
  const [hoverTime, setHoverTime] = useState(null);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleTimelineClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const timestamp = Math.floor(percentage * duration);
    onAddTrigger(timestamp);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-white/40">
          <Clock className="w-3.5 h-3.5" />
          <span>Click timeline to add trigger</span>
        </div>
        <span className="text-xs text-white/30">{formatTime(duration)}</span>
      </div>

      {/* Timeline */}
      <div
        className="relative h-16 bg-[#13131a] rounded-xl border border-white/[0.06] cursor-crosshair overflow-hidden"
        onClick={handleTimelineClick}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const percentage = x / rect.width;
          setHoverTime(Math.floor(percentage * duration));
        }}
        onMouseLeave={() => setHoverTime(null)}
      >
        {/* Grid lines */}
        {Array.from({ length: 11 }).map((_, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 w-px bg-white/[0.04]"
            style={{ left: `${i * 10}%` }}
          />
        ))}

        {/* Trigger markers */}
        {triggers.map((trigger, index) => {
          const position = ((trigger.timestamp || 0) / duration) * 100;
          const hasConfessional = trigger.confessional_video_url;
          const hasProduct = trigger.product_name || trigger.product_image_url;

          return (
            <motion.button
              key={index}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group"
              style={{ left: `${position}%` }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectTrigger(index);
              }}
            >
              {/* Glow effect */}
              <motion.div
                className="absolute inset-0 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  background: hasProduct ? "#F59E0B" : "#8B5CF6",
                  width: "24px",
                  height: "24px",
                  left: "-4px",
                  top: "-4px",
                }}
              />

              {/* Marker dot */}
              <div
                className="relative w-4 h-4 rounded-full border-2 border-[#0a0a0f] transition-transform group-hover:scale-125"
                style={{
                  background: hasProduct
                    ? "linear-gradient(135deg, #F59E0B, #FB923C)"
                    : "linear-gradient(135deg, #8B5CF6, #A78BFA)",
                }}
              >
                {/* Icons */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {hasConfessional && hasProduct ? (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  ) : hasProduct ? (
                    <ShoppingBag className="w-2 h-2 text-white" />
                  ) : (
                    <MessageSquare className="w-2 h-2 text-white" />
                  )}
                </div>
              </div>

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-[#1c1c28] border border-white/[0.12] rounded-lg px-3 py-2 text-xs text-white/90 whitespace-nowrap">
                  <p className="font-medium">{formatTime(trigger.timestamp || 0)}</p>
                  <p className="text-white/40 text-[10px] mt-0.5">
                    {trigger.prompt_text || "Trigger"}
                  </p>
                </div>
              </div>
            </motion.button>
          );
        })}

        {/* Hover preview */}
        {hoverTime !== null && (
          <div
            className="absolute top-0 bottom-0 w-px bg-violet-400/50 pointer-events-none"
            style={{ left: `${(hoverTime / duration) * 100}%` }}
          >
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1">
              <div className="bg-violet-400/20 border border-violet-400/40 rounded px-2 py-0.5 text-[10px] text-violet-300 whitespace-nowrap">
                {formatTime(hoverTime)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] text-white/30">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-violet-500 to-purple-500" />
          <span>Confessional</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-amber-500 to-orange-500" />
          <span>Product</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-white" />
          <span>Both</span>
        </div>
      </div>
    </div>
  );
}