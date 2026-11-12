import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Shield, Search } from "lucide-react";
import { format } from "date-fns";

export default function FoundersRegistry() {
  const [search, setSearch] = useState("");

  const { data: founders = [], isLoading } = useQuery({
    queryKey: ["founders-registry"],
    queryFn: () => base44.entities.FoundersCertificate.filter({ status: "Active" }, "issue_date", 200),
  });

  const filtered = founders.filter((f) =>
    f.founder_name?.toLowerCase().includes(search.toLowerCase()) ||
    f.tier?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 py-12">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&display=swap');
        .font-cinzel { font-family: 'Cinzel', serif; }
        .gold-divider { background: linear-gradient(90deg, transparent, #c9a84c, transparent); height: 1px; }
      `}</style>

      {/* Header */}
      <div className="max-w-4xl mx-auto mb-10 text-center">
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6999eeb5400ab46cf574d543/4da6c0bf9_GlobeHouseTvOfficialCrestNSeal.PNG"
          alt="GlobeHouse Official Crest & Seal"
          className="w-28 h-28 object-contain mx-auto mb-4 drop-shadow-2xl"
        />
        <h1 className="font-cinzel text-3xl sm:text-4xl text-[#c9a84c] tracking-widest uppercase mb-2">
          Founders Registry
        </h1>
        <p className="text-white/30 text-sm tracking-widest uppercase">GlobeHouse Official Active Members</p>
        <div className="gold-divider mt-6 max-w-xs mx-auto" />
      </div>

      {/* Search */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search by name or tier…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/[0.04] border border-[#c9a84c33] rounded-xl pl-10 pr-4 py-3 text-white/70 placeholder-white/20 text-sm focus:outline-none focus:border-[#c9a84c66]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="max-w-4xl mx-auto">
        {isLoading ? (
          <div className="text-center text-white/30 py-20 text-sm tracking-widest uppercase">Loading Registry…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-white/20 py-20 text-sm tracking-widest uppercase">No Active Founders Found</div>
        ) : (
          <div className="border border-[#c9a84c22] rounded-2xl overflow-hidden">
            {/* Header Row */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 px-6 py-3 bg-[#c9a84c0a] border-b border-[#c9a84c22]">
              <span className="text-[#c9a84c] text-xs tracking-widest uppercase font-cinzel">Founder</span>
              <span className="text-[#c9a84c] text-xs tracking-widest uppercase font-cinzel hidden sm:block">Tier</span>
              <span className="text-[#c9a84c] text-xs tracking-widest uppercase font-cinzel">Issue Date</span>
              <span className="text-[#c9a84c] text-xs tracking-widest uppercase font-cinzel">Royalty</span>
            </div>

            {filtered.map((f, i) => (
              <div
                key={f.serial_number}
                className={`grid grid-cols-3 sm:grid-cols-4 gap-4 px-6 py-4 border-b border-white/[0.04] ${
                  i % 2 === 0 ? "bg-white/[0.01]" : ""
                }`}
              >
                <div>
                  <p className="text-white/80 text-sm font-medium">{f.founder_name}</p>
                  <p className="text-white/20 text-xs font-mono mt-0.5">{f.serial_number}</p>
                </div>
                <p className="text-[#c9a84c] text-sm hidden sm:block">{f.tier}</p>
                <p className="text-white/50 text-sm">
                  {f.issue_date ? format(new Date(f.issue_date), "MMM d, yyyy") : "—"}
                </p>
                <p className="text-white/60 text-sm">{f.founders_royalty ?? 5}%</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-center text-white/10 text-xs mt-12 tracking-widest uppercase">
        GlobeHouse Official Registry · {new Date().getFullYear()}
      </p>
    </div>
  );
}