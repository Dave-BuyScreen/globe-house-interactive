import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle, XCircle, AlertCircle, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const statusConfig = {
  pending:        { label: "Pending",       color: "text-amber-400 bg-amber-500/10",    icon: Clock },
  approved:       { label: "Approved",      color: "text-emerald-400 bg-emerald-500/10", icon: CheckCircle },
  rejected:       { label: "Rejected",      color: "text-red-400 bg-red-500/10",        icon: XCircle },
  needs_changes:  { label: "Needs Changes", color: "text-blue-400 bg-blue-500/10",      icon: AlertCircle },
};

export default function ProductApprovalCard({ product, merchantName, user, onUpdated }) {
  const [notes, setNotes] = useState(product.approval_notes || "");
  const [saving, setSaving] = useState(false);
  const cfg = statusConfig[product.approval_status || "pending"];
  const Icon = cfg.icon;

  const update = async (approval_status) => {
    setSaving(true);
    const isApproved = approval_status === "approved";
    await base44.entities.ProductRegistry.update(product.id, {
      approval_status,
      approval_notes: notes,
      is_active: isApproved,
      approved_at: isApproved ? new Date().toISOString() : undefined,
      approved_by: isApproved ? user?.email : undefined,
    });
    setSaving(false);
    onUpdated();
  };

  return (
    <div className="bg-[#13131a] border border-white/[0.06] rounded-2xl p-5 space-y-4">
      <div className="flex gap-4">
        {product.image_url
          ? <img src={product.image_url} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
          : <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center text-white/20 text-2xl flex-shrink-0">📦</div>
        }
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-white truncate">{product.name}</p>
              {product.brand && <p className="text-xs text-violet-400">{product.brand}</p>}
              <p className="text-xs text-white/40 mt-0.5">{merchantName || "Unknown Merchant"}</p>
            </div>
            <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${cfg.color}`}>
              <Icon className="w-3 h-3" /> {cfg.label}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-white/50">
            <span className="font-medium text-white">{product.display_price || `$${((product.price || 0) / 100).toFixed(2)}`}</span>
            <span className="capitalize">{product.category}</span>
            {product.product_url && (
              <a href={product.product_url} target="_blank" rel="noreferrer"
                className="flex items-center gap-0.5 text-violet-400 hover:underline">
                <ExternalLink className="w-3 h-3" /> View Product
              </a>
            )}
          </div>
        </div>
      </div>

      {product.description && (
        <p className="text-xs text-white/40 line-clamp-2">{product.description}</p>
      )}

      <Textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Approval notes or rejection reason..."
        className="bg-white/[0.03] border-white/10 text-white/80 text-sm resize-none h-16"
      />

      <div className="flex gap-2 flex-wrap">
        <Button size="sm" disabled={saving} onClick={() => update("approved")}
          className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20">
          <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
        </Button>
        <Button size="sm" disabled={saving} onClick={() => update("needs_changes")}
          className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20">
          <AlertCircle className="w-3.5 h-3.5 mr-1" /> Needs Changes
        </Button>
        <Button size="sm" disabled={saving} onClick={() => update("rejected")}
          className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20">
          <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
        </Button>
      </div>
    </div>
  );
}