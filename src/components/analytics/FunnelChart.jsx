import React from "react";
import { motion } from "framer-motion";
import { ArrowDown, TrendingDown } from "lucide-react";

export default function FunnelChart({ data }) {
  const stages = [
    { key: "portal_open", label: "Portal Opened", color: "#8B5CF6" },
    { key: "confessional_view", label: "Confessional Viewed", color: "#A78BFA" },
    { key: "buyscreen_view", label: "BuyScreen Clicked", color: "#F59E0B" },
    { key: "shop_click", label: "Shop Clicked", color: "#10B981" },
  ];

  const counts = {
    portal_open: data.filter(e => e.event_type === "portal_open").length,
    confessional_view: data.filter(e => e.event_type === "confessional_view").length,
    buyscreen_view: data.filter(e => e.event_type === "buyscreen_view").length,
    shop_click: data.filter(e => e.event_type === "shop_click").length,
  };

  const maxCount = counts.portal_open || 1;

  return (
    <div className="space-y-4">
      {stages.map((stage, index) => {
        const count = counts[stage.key];
        const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
        const dropoff = index > 0 ? counts[stages[index - 1].key] - count : 0;
        const dropoffPercent = index > 0 && counts[stages[index - 1].key] > 0
          ? (dropoff / counts[stages[index - 1].key]) * 100
          : 0;

        return (
          <div key={stage.key} className="space-y-2">
            {/* Dropoff indicator */}
            {index > 0 && dropoff > 0 && (
              <div className="flex items-center justify-center gap-2 text-xs text-red-400/60">
                <TrendingDown className="w-3 h-3" />
                <span>{dropoffPercent.toFixed(0)}% drop-off</span>
              </div>
            )}

            {/* Stage bar */}
            <div className="relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: index * 0.1 }}
                className="h-14 rounded-xl relative overflow-hidden"
                style={{
                  background: `linear-gradient(90deg, ${stage.color}40, ${stage.color}20)`,
                  border: `1px solid ${stage.color}30`,
                }}
              >
                {/* Shimmer effect */}
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${stage.color}60, transparent)`,
                  }}
                />

                {/* Content */}
                <div className="absolute inset-0 flex items-center justify-between px-4">
                  <div>
                    <p className="text-sm font-medium text-white">{stage.label}</p>
                    <p className="text-xs text-white/40">{percentage.toFixed(0)}% of total</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">{count}</p>
                    <p className="text-[10px] text-white/30 uppercase tracking-wider">Events</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        );
      })}
    </div>
  );
}