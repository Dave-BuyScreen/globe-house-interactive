import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const GOLD = "#D4AF37";

export default function FloorEngagementChart({ data }) {
  return (
    <div className="bg-[#13131a] border border-white/[0.06] rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-6">Views by Floor</h3>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} layout="vertical" margin={{ left: 20, right: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
          <XAxis
            type="number"
            stroke="rgba(255,255,255,0.3)"
            style={{ fontSize: "12px" }}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke="rgba(255,255,255,0.5)"
            style={{ fontSize: "13px" }}
            width={120}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1a1a24",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
            }}
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
          />
          <Bar dataKey="views" radius={[0, 6, 6, 0]} barSize={28}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.views > 0 ? GOLD : "rgba(255,255,255,0.08)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}