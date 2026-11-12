import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Shield, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";

function generateHash(serial, name, date) {
  let str = `${serial}|${name}|${date}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).toUpperCase().padStart(8, "0");
}

export default function Verify() {
  const urlParams = new URLSearchParams(window.location.search);
  const serial = (urlParams.get("serial") || "").trim();

  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [verifiedAt] = useState(new Date());

  useEffect(() => {
    if (!serial) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    base44.entities.FoundersCertificate.filter({ serial_number: serial })
      .then((results) => {
        if (results && results.length > 0) {
          // Only expose safe fields, never internal DB id
          const r = results[0];
          setCert({
            founder_name: r.founder_name,
            serial_number: r.serial_number,
            tier: r.tier,
            ar_bonus_percentage: r.ar_bonus_percentage,
            founders_royalty: r.founders_royalty ?? 5,
            issue_date: r.issue_date,
            status: r.status,
            registry_entry: `GH-${r.serial_number}-REG`,
          });
        } else {
          setNotFound(true);
        }
      })
      .finally(() => setLoading(false));
  }, [serial]);

  const hash = cert
    ? generateHash(cert.serial_number, cert.founder_name, cert.issue_date)
    : null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4 py-12">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;500&display=swap');
        .font-cinzel { font-family: 'Cinzel', serif; }
        .gold-divider { background: linear-gradient(90deg, transparent, #c9a84c, transparent); height: 1px; }
        .gold-text { color: #c9a84c; }
        .cert-card { background: linear-gradient(145deg, #111111, #0d0d0d); border: 1px solid #c9a84c33; }
      `}</style>

      {/* Crest / Logo */}
      <div className="mb-8 flex flex-col items-center">
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6999eeb5400ab46cf574d543/e22836d96_GlobeHouseTvOfficialCrestNSeal.PNG"
          alt="GlobeHouse Official Crest & Seal"
          className="w-36 h-36 object-contain mb-3 drop-shadow-2xl" style={{mixBlendMode: "screen"}}
        />
        <h1 className="font-cinzel text-xl sm:text-2xl tracking-[0.2em] gold-text uppercase">GlobeHouse</h1>
        <p className="text-[#c9a84c88] text-xs tracking-[0.3em] uppercase mt-1">Founder Registry</p>
      </div>

      {loading && (
        <div className="flex flex-col items-center gap-4 text-white/40">
          <Loader2 className="w-8 h-8 animate-spin text-[#c9a84c]" />
          <p className="text-sm tracking-widest uppercase">Verifying Certificate…</p>
        </div>
      )}

      {!loading && notFound && (
        <div className="cert-card rounded-2xl p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="font-cinzel text-2xl text-white mb-2">Certificate Not Found</h2>
          <div className="gold-divider my-4" />
          <p className="text-white/40 text-sm">
            Serial <span className="text-white/70 font-mono">{serial || "—"}</span> does not match any record in the GlobeHouse Founder Registry.
          </p>
          <p className="text-white/30 text-xs mt-4">
            If you believe this is an error, contact GlobeHouse support.
          </p>
        </div>
      )}

      {!loading && cert && (
        <div className="cert-card rounded-2xl p-6 sm:p-10 max-w-lg w-full">
          {/* Status Badge */}
          <div className="flex justify-center mb-6">
            {cert.status === "Active" ? (
              <div className="flex items-center gap-2 px-6 py-2 rounded-full border border-[#c9a84c] bg-[#c9a84c15]">
                <CheckCircle className="w-5 h-5 text-[#c9a84c]" />
                <span className="font-cinzel text-[#c9a84c] tracking-widest text-sm uppercase">Verified</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-6 py-2 rounded-full border border-red-500 bg-red-500/10">
                <XCircle className="w-5 h-5 text-red-500" />
                <span className="font-cinzel text-red-400 tracking-widest text-sm uppercase">Revoked</span>
              </div>
            )}
          </div>

          <div className="gold-divider mb-6" />

          {/* Founder Name */}
          <h2 className="font-cinzel text-2xl sm:text-3xl text-white text-center mb-1 tracking-wide">
            {cert.founder_name}
          </h2>
          <p className="text-center text-[#c9a84c88] text-xs tracking-[0.25em] uppercase mb-6">
            GlobeHouse Founder
          </p>

          <div className="gold-divider mb-6" />

          {/* Data Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <DataRow label="Certificate No." value={cert.serial_number} mono />
            <DataRow label="Tier" value={cert.tier} />
            <DataRow label="AR Bonus" value={`${cert.ar_bonus_percentage ?? "—"}%`} />
            <DataRow label="Founders Royalty" value={`${cert.founders_royalty}%`} />
            <DataRow label="Issue Date" value={cert.issue_date ? format(new Date(cert.issue_date), "MMMM d, yyyy") : "—"} />
            <DataRow label="Status" value={cert.status} highlight={cert.status === "Active" ? "gold" : "red"} />
            <DataRow label="Registry Entry" value={cert.registry_entry} mono />
          </div>

          <div className="gold-divider my-6" />

          {/* Verification Meta */}
          <div className="space-y-2 text-center">
            <p className="text-white/30 text-xs uppercase tracking-widest">Verification Timestamp</p>
            <p className="text-white/60 text-sm font-mono">{verifiedAt.toUTCString()}</p>

            <p className="text-white/30 text-xs uppercase tracking-widest mt-3">Verification Hash</p>
            <p className="text-[#c9a84c] text-sm font-mono tracking-widest">{hash}</p>
          </div>

          <div className="gold-divider mt-6" />

          {/* Footer */}
          <p className="text-center text-white/20 text-xs mt-4 tracking-wider uppercase">
            GlobeHouse Official Registry · Certificate authenticity verified
          </p>
        </div>
      )}

      {/* Crest watermark bottom */}
      <div className="mt-10 flex flex-col items-center gap-1 opacity-30">
        <div className="gold-divider w-24" />
        <p className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mt-2">globehouse-ar.com</p>
      </div>
    </div>
  );
}

function DataRow({ label, value, mono, highlight }) {
  let valueClass = "text-white/80";
  if (highlight === "gold") valueClass = "text-[#c9a84c]";
  if (highlight === "red") valueClass = "text-red-400";

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-3">
      <p className="text-white/30 text-xs uppercase tracking-widest mb-1">{label}</p>
      <p className={`${valueClass} ${mono ? "font-mono text-xs" : "text-sm font-medium"} break-all`}>{value ?? "—"}</p>
    </div>
  );
}