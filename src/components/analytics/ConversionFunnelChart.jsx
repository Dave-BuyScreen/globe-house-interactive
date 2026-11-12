import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function ConversionFunnelChart({ analytics }) {
  const portalOpens = analytics.filter(e => e.event_type === "portal_open").length;
  const confessionalViews = analytics.filter(e => e.event_type === "confessional_view").length;
  const buyscreenViews = analytics.filter(e => e.event_type === "buyscreen_view").length;
  const shopClicks = analytics.filter(e => e.event_type === "shop_click").length;

  const funnelData = [
    { stage: "Portal Opens", count: portalOpens, fill: "#8B5CF6" },
    { stage: "Confessionals", count: confessionalViews, fill: "#D946EF" },
    { stage: "BuyScreen", count: buyscreenViews, fill: "#F59E0B" },
    { stage: "Shop Clicks", count: shopClicks, fill: "#10B981" }
  ];

  return (
    <div className="bg-[#13131a] border border-white/[0.06] rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-6">Conversion Funnel</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={funnelData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis type="number" stroke="rgba(255,255,255,0.3)" style={{ fontSize: '12px' }} />
          <YAxis 
            dataKey="stage" 
            type="category" 
            stroke="rgba(255,255,255,0.3)" 
            style={{ fontSize: '12px' }}
            width={100}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1a1a24', 
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px'
            }}
          />
          <Bar dataKey="count" radius={[0, 8, 8, 0]}>
            {funnelData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}