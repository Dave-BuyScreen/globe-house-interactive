import React from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Eye, MousePointer, ShoppingCart, Clock } from "lucide-react";

export default function EpisodeMetricsCard({ title, value, subtitle, trend, icon: Icon, color }) {
  const trendIsPositive = trend > 0;
  
  return (
    <Card className="bg-[#13131a] border-white/[0.06] p-5 hover:bg-[#1a1a24] transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            trendIsPositive ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {trendIsPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
      <p className="text-xs text-white/40 uppercase tracking-wider mb-1">{title}</p>
      {subtitle && <p className="text-xs text-white/30">{subtitle}</p>}
    </Card>
  );
}