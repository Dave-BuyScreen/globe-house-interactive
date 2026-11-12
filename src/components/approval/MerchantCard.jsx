import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle, XCircle, Clock, ShieldCheck, Globe, Mail, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const statusConfig = {
  unverified:    { label: "Unverified",    color: "text-white/40 bg-white/5",       icon: Clock },
  under_review:  { label: "Under Review",  color: "text-amber-400 bg-amber-500/10", icon: Clock },
  verified:      { label: "Verified",      color: "text-emerald-400 bg-emerald-500/10", icon: ShieldCheck },
  rejected:      { label: "Rejected",      color: "text-red-400 bg-red-500/10",     icon: XCircle },
};

export default function MerchantCard({ merchant, user, onUpdated }) {
  const [notes, setNotes] = useState(merchant.verification_notes || "");
  const [saving, setSaving] = useState(false);
  const cfg = statusConfig[merchant.verification_status || "unverified"];
  const Icon = cfg.icon;

  const update = async (verification_status) => {
    setSaving(true);
    await base44.entities.Merchant.update(merchant.id, {
      verification_status,
      verification_notes: notes,
      verified_at: verification_status === "verified" ? new Date().toISOString() : undefined,
      verified_by: verification_status === "verified" ? user?.email : undefined,
      status: verification_status === "verified" ? "active" : merchant.status,
    });
    setSaving(false);
    onUpdated();
  };

  return (
    <div className="bg-[#13131a] border border-white/[0.06] rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {merchant.logo_url
            ? <img src={merchant.logo_url} className="w-12 h-12 rounded-xl object-cover" />
            : <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400 font-bold text-lg">{merchant.company_name?.[0]}</div>
          }
          <div>
            <p className="font-semibold text-white">{merchant.company_name}</p>
            {merchant.legal_name && <p className="text-xs text-white/40">{merchant.legal_name}</p>}
          </div>
        </div>
        <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color}`}>
          <Icon className="w-3 h-3" /> {cfg.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-white/50">
        <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{merchant.contact_email}</span>
        {merchant.website && <a href={merchant.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-violet-400 hover:underline"><Globe className="w-3 h-3" />{merchant.website}</a>}
        {merchant.tax_id && <span className="flex items-center gap-1"><Tag className="w-3 h-3" />EIN: {merchant.tax_id}</span>}
        <span className="capitalize">{merchant.category} · {merchant.subscription_tier}</span>
      </div>

      <Textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Verification notes (optional)..."
        className="bg-white/[0.03] border-white/10 text-white/80 text-sm resize-none h-16"
      />

      <div className="flex gap-2">
        <Button size="sm" disabled={saving} onClick={() => update("under_review")}
          className="bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20">
          Mark Under Review
        </Button>
        <Button size="sm" disabled={saving} onClick={() => update("verified")}
          className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20">
          <CheckCircle className="w-3.5 h-3.5 mr-1" /> Verify
        </Button>
        <Button size="sm" disabled={saving} onClick={() => update("rejected")}
          className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20">
          <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
        </Button>
      </div>
    </div>
  );
}