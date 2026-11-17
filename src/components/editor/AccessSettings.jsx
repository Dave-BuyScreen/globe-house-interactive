import React from "react";
import { Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TIERS } from "@/lib/viewerAccess";

const OPTIONS = ["free", "subscription", "tvod", "vault"];

// Episode editor section: who can watch this episode and what it costs.
export default function AccessSettings({ form, setForm }) {
  const tier = form.access_tier || "free";
  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <section className="bg-[#13131a] border border-white/[0.06] rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
          <Lock className="w-5 h-5 text-yellow-400" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-white/90">Access & Pricing</h2>
          <p className="text-xs text-white/30">Who can watch this episode</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
        {OPTIONS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setForm((prev) => ({ ...prev, access_tier: key }))}
            className={`text-left px-3 py-3 rounded-xl border transition-all ${
              tier === key
                ? "border-yellow-500/60 bg-yellow-500/10 text-yellow-200"
                : "border-white/[0.08] bg-white/[0.04] text-white/50 hover:text-white"
            }`}
          >
            <span className="block text-sm font-medium">{TIERS[key].label}</span>
            <span className="block text-[11px] opacity-70 mt-0.5">{TIERS[key].description}</span>
          </button>
        ))}
      </div>

      {(tier === "tvod" || tier === "vault") && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <Label className="text-xs text-white/40 mb-1.5">Buy price (USD)</Label>
            <Input type="number" min="0" step="0.01" placeholder="e.g. 9.99" value={form.purchase_price ?? ""}
              onChange={set("purchase_price")} className="h-11 bg-white/[0.04] border-white/[0.08] text-white" />
          </div>
          {tier === "tvod" && (
            <>
              <div>
                <Label className="text-xs text-white/40 mb-1.5">Rent price (USD)</Label>
                <Input type="number" min="0" step="0.01" placeholder="e.g. 3.99" value={form.rental_price ?? ""}
                  onChange={set("rental_price")} className="h-11 bg-white/[0.04] border-white/[0.08] text-white" />
              </div>
              <div>
                <Label className="text-xs text-white/40 mb-1.5">Rental length (hours)</Label>
                <Input type="number" min="1" step="1" placeholder="48" value={form.rental_hours ?? ""}
                  onChange={set("rental_hours")} className="h-11 bg-white/[0.04] border-white/[0.08] text-white" />
              </div>
            </>
          )}
        </div>
      )}

      {tier !== "free" && (
        <div>
          <Label className="text-xs text-white/40 mb-1.5">Trailer URL (optional, shown to everyone)</Label>
          <Input placeholder="Vimeo, YouTube or .mp4 link" value={form.trailer_url ?? ""} onChange={set("trailer_url")}
            className="h-11 bg-white/[0.04] border-white/[0.08] text-white" />
          <p className="text-[11px] text-white/30 mt-2">
            The full video link is hidden from viewers until they have access.
          </p>
        </div>
      )}
      {tier === "free" && (
        <p className="text-[11px] text-white/30">Non-members see a short ad before free episodes (ads are managed under Monetization).</p>
      )}
    </section>
  );
}

// Form strings -> database values. Empty = not for sale / use the default.
export const accessFieldsForSave = (form) => {
  const num = (v) => (v === "" || v == null || Number.isNaN(Number(v)) ? null : Number(v));
  return {
    access_tier: form.access_tier || "free",
    purchase_price: num(form.purchase_price),
    rental_price: num(form.rental_price),
    rental_hours: num(form.rental_hours) && Math.round(num(form.rental_hours)),
    trailer_url: form.trailer_url || null,
  };
};
