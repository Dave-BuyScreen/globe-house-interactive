import React, { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function ExportCSV({ certs }) {
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterTier, setFilterTier] = useState("All");

  const tiers = ["All", ...Array.from(new Set(certs.map((c) => c.tier).filter(Boolean)))];

  const filtered = certs.filter((c) => {
    const statusOk = filterStatus === "All" || c.status === filterStatus;
    const tierOk = filterTier === "All" || c.tier === filterTier;
    return statusOk && tierOk;
  });

  const handleExport = () => {
    const headers = ["Serial Number", "Founder Name", "Tier", "Status", "Issue Date", "AR Bonus %", "Founders Royalty %", "Notes"];
    const rows = filtered.map((c) => [
      c.serial_number,
      c.founder_name,
      c.tier,
      c.status,
      c.issue_date ? format(new Date(c.issue_date), "yyyy-MM-dd") : "",
      c.ar_bonus_percentage ?? "",
      c.founders_royalty ?? 5,
      (c.notes || "").replace(/,/g, ";"),
    ]);

    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `GlobeHouse_Founders_${filterStatus}_${filterTier}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectClass = "bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-white/70 text-sm focus:outline-none focus:border-[#c9a84c66]";

  return (
    <div className="bg-[#0f0f0f] border border-[#c9a84c22] rounded-2xl p-6">
      <h3 className="text-[#c9a84c] text-sm font-semibold uppercase tracking-widest mb-4">Export CSV</h3>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex flex-col gap-1">
          <label className="text-white/30 text-xs uppercase tracking-widest">Status</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={selectClass}>
            <option value="All">All</option>
            <option value="Active">Active</option>
            <option value="Revoked">Revoked</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-white/30 text-xs uppercase tracking-widest">Tier</label>
          <select value={filterTier} onChange={(e) => setFilterTier(e.target.value)} className={selectClass}>
            {tiers.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-white/30 text-xs">{filtered.length} record{filtered.length !== 1 ? "s" : ""} selected</p>
        <Button
          onClick={handleExport}
          disabled={filtered.length === 0}
          className="bg-[#c9a84c] hover:bg-[#b8943e] text-black font-semibold text-sm"
        >
          <Download className="w-4 h-4 mr-2" /> Download CSV
        </Button>
      </div>
    </div>
  );
}