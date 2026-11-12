import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Shield, Plus, Loader2, Pencil, Trash2, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import AIVerificationAssistant from "../components/verify/AIVerificationAssistant";
import ExportCSV from "../components/verify/ExportCSV";
import QRCodePanel from "../components/verify/QRCodePanel";
import { format } from "date-fns";

export default function VerifyAdmin() {
  const [activeTab, setActiveTab] = useState("registry");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me(),
  });

  const { data: certs = [], isLoading, refetch } = useQuery({
    queryKey: ["founder-certs"],
    queryFn: () => base44.entities.FoundersCertificate.list("-created_date", 200),
  });

  if (user && user.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-white/50 text-sm">Admin access required.</p>
        </div>
      </div>
    );
  }

  const generateSerialNumber = () => {
    const usedSerials = new Set(certs.map(c => c.serial_number).filter(Boolean));
    const prefix = "GHF";
    let num = certs.length + 1;
    let serial;
    do {
      serial = `${prefix}-${String(num).padStart(4, "0")}`;
      num++;
    } while (usedSerials.has(serial));
    return serial;
  };

  const openNew = () => {
    const today = new Date().toISOString().split("T")[0];
    setForm({ status: "Active", founders_royalty: 5, serial_number: generateSerialNumber(), issue_date: today });
    setEditing("new");
  };

  const openEdit = (cert) => {
    setForm({ ...cert });
    setEditing(cert.id);
  };

  const handleSave = async () => {
    setSaving(true);
    if (editing === "new") {
      await base44.entities.FoundersCertificate.create(form);
    } else {
      await base44.entities.FoundersCertificate.update(editing, form);
    }
    setSaving(false);
    setEditing(null);
    refetch();
  };

  const handleDelete = async (id) => {
    await base44.entities.FoundersCertificate.delete(id);
    refetch();
  };

  const tabs = [
    { id: "registry", label: "Registry" },
    { id: "export", label: "Export CSV" },
    { id: "qr", label: "QR Codes" },
    { id: "ai", label: "AI Assistant" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 py-10">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&display=swap'); .font-cinzel{font-family:'Cinzel',serif;}`}</style>

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6999eeb5400ab46cf574d543/e22836d96_GlobeHouseTvOfficialCrestNSeal.PNG"
              alt="Seal" className="w-12 h-12 object-contain" style={{mixBlendMode: "screen"}}
            />
            <div>
              <h1 className="font-cinzel text-xl text-[#c9a84c] tracking-widest uppercase">Founders Registry</h1>
              <p className="text-white/30 text-xs">Admin Portal</p>
            </div>
          </div>
          <Button onClick={openNew} className="bg-[#c9a84c] hover:bg-[#b8943e] text-black font-semibold text-sm">
            <Plus className="w-4 h-4 mr-1" /> New Certificate
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === t.id
                  ? "bg-[#c9a84c] text-black"
                  : "bg-white/[0.04] text-white/50 hover:text-white/80"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Registry Tab */}
        {activeTab === "registry" && (
          <div className="border border-[#c9a84c22] rounded-2xl overflow-hidden">
            <div className="grid grid-cols-5 gap-4 px-5 py-3 bg-[#c9a84c0a] border-b border-[#c9a84c22] text-[#c9a84c] text-xs tracking-widest uppercase font-cinzel">
              <span>Founder</span>
              <span>Serial</span>
              <span>Tier</span>
              <span>Status</span>
              <span>Actions</span>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-[#c9a84c]" />
              </div>
            ) : certs.map((c, i) => (
              <div key={c.id} className={`grid grid-cols-5 gap-4 px-5 py-3 border-b border-white/[0.04] items-center ${i % 2 === 0 ? "bg-white/[0.01]" : ""}`}>
                <div>
                  <p className="text-white/80 text-sm">{c.founder_name}</p>
                  <p className="text-white/25 text-xs">{c.issue_date ? format(new Date(c.issue_date), "MMM d, yyyy") : "—"}</p>
                </div>
                <p className="text-white/40 text-xs font-mono">{c.serial_number}</p>
                <p className="text-[#c9a84c] text-sm">{c.tier}</p>
                <div>
                  {c.status === "Active" ? (
                    <span className="flex items-center gap-1 text-emerald-400 text-xs"><CheckCircle className="w-3 h-3" /> Active</span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-400 text-xs"><XCircle className="w-3 h-3" /> Revoked</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(c)} className="text-white/30 hover:text-[#c9a84c] transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="text-white/30 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Export CSV Tab */}
        {activeTab === "export" && <ExportCSV certs={certs} />}

        {/* QR Codes Tab */}
        {activeTab === "qr" && <QRCodePanel certs={certs} />}

        {/* AI Assistant Tab */}
        {activeTab === "ai" && (
          <AIVerificationAssistant existingRecords={certs} />
        )}
      </div>

      {/* Edit / Create Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-[#c9a84c33] rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-cinzel text-[#c9a84c] text-lg tracking-widest uppercase">
              {editing === "new" ? "New Certificate" : "Edit Certificate"}
            </h3>

            {/* Serial Number with auto-generate */}
            <div>
              <label className="text-white/30 text-xs uppercase tracking-widest block mb-1">Serial Number</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.serial_number ?? ""}
                  onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
                  className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-white/80 text-sm focus:outline-none focus:border-[#c9a84c66]"
                  placeholder="e.g. GHF-0001"
                />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, serial_number: generateSerialNumber() })}
                  title="Auto-generate unique serial"
                  className="px-3 py-2 bg-[#c9a84c22] border border-[#c9a84c44] rounded-lg text-[#c9a84c] hover:bg-[#c9a84c33] transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              <p className="text-white/20 text-xs mt-1">Click <RefreshCw className="w-3 h-3 inline" /> to auto-generate a unique serial number.</p>
            </div>

            {[
              { key: "founder_name", label: "Founder Name" },
            ].map(({ key, label, type }) => (
              <div key={key}>
                <label className="text-white/30 text-xs uppercase tracking-widest block mb-1">{label}</label>
                <input
                  type={type || "text"}
                  value={form[key] ?? ""}
                  onChange={(e) => setForm({ ...form, [key]: type === "number" ? Number(e.target.value) : e.target.value })}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-white/80 text-sm focus:outline-none focus:border-[#c9a84c66]"
                />
              </div>
            ))}

            <div>
              <label className="text-white/30 text-xs uppercase tracking-widest block mb-1">Tier</label>
              <select
                value={form.tier || ""}
                onChange={(e) => setForm({ ...form, tier: e.target.value })}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-white/80 text-sm focus:outline-none focus:border-[#c9a84c66]"
              >
                <option value="">Select Tier</option>
                <option value="Genesis">Genesis</option>
                <option value="Founders">Founders</option>
                <option value="Investors">Investors</option>
              </select>
            </div>

            {[
              { key: "issue_date", label: "Issue Date", type: "date" },
              { key: "ar_bonus_percentage", label: "AR Bonus %", type: "number" },
              { key: "founders_royalty", label: "Founders Royalty %", type: "number" },
              { key: "notes", label: "Notes" },
            ].map(({ key, label, type }) => (
              <div key={key}>
                <label className="text-white/30 text-xs uppercase tracking-widest block mb-1">{label}</label>
                <input
                  type={type || "text"}
                  value={form[key] ?? ""}
                  onChange={(e) => setForm({ ...form, [key]: type === "number" ? Number(e.target.value) : e.target.value })}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-white/80 text-sm focus:outline-none focus:border-[#c9a84c66]"
                />
              </div>
            ))}

            <div>
              <label className="text-white/30 text-xs uppercase tracking-widest block mb-1">Status</label>
              <select
                value={form.status || "Active"}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-white/80 text-sm focus:outline-none"
              >
                <option value="Active">Active</option>
                <option value="Revoked">Revoked</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={() => setEditing(null)} variant="outline" className="flex-1 border-white/10 text-white/50">Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1 bg-[#c9a84c] hover:bg-[#b8943e] text-black font-semibold">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}