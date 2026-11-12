import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Palette, X, Check, Film } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import GatewayImageUploader from "./GatewayImageUploader";
import IntroVideoUploader from "./IntroVideoUploader";
import FloatingDashboardButton from "./FloatingDashboardButton";

const COLOR_FIELDS = [
  { key: "heading_color", label: "Section Headings", default: "#ffffff" },
  { key: "body_text_color", label: "Body / Description Text", default: "rgba(255,255,255,0.6)" },
  { key: "nav_text_color", label: "Navigation Links", default: "rgba(255,255,255,0.5)" },
  { key: "accent_text_color", label: "Accent / Highlight Text", default: "#a78bfa" },
  { key: "card_text_color", label: "Card Titles", default: "#ffffff" },
];

const PRESETS = [
  "#ffffff", "#e2e8f0", "#a78bfa", "#f0abfc", "#34d399",
  "#fbbf24", "#f87171", "#60a5fa", "#fb923c", "#e879f9",
];

export default function AppearancePanel({ siteSettings }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(null);
  const queryClient = useQueryClient();

  const getValue = (key) => siteSettings?.[key] || COLOR_FIELDS.find(f => f.key === key)?.default || "#ffffff";

  const save = async (key, value) => {
    setSaving(key);
    if (siteSettings?.id) {
      await base44.entities.SiteSettings.update(siteSettings.id, { [key]: value });
    } else {
      await base44.entities.SiteSettings.create({ [key]: value });
    }
    await queryClient.invalidateQueries({ queryKey: ["siteSettings"] });
    setSaving(null);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-white text-sm transition-all"
        title="Appearance Settings"
      >
        <Palette className="w-4 h-4" />
        <span className="hidden sm:inline">Appearance</span>
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <FloatingDashboardButton onClose={() => setOpen(false)} />
          <div className="bg-[#13131a] border border-white/[0.08] rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] shrink-0">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-violet-400" />
                <span className="font-semibold text-white">Site Text Colors</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                title="Close"
                className="flex items-center justify-center w-8 h-8 rounded-lg border border-[#B8934D]/40 bg-black/20 hover:bg-black/40 text-[#E6D3B6]/70 hover:text-[#E6D3B6] transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Color fields */}
            <div className="p-5 space-y-5 overflow-y-auto">
              {COLOR_FIELDS.map(({ key, label }) => {
                const value = getValue(key);
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs text-white/50 font-medium">{label}</label>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-white/20 font-mono">{value}</span>
                        {saving === key && <div className="w-3 h-3 border border-violet-400 border-t-transparent rounded-full animate-spin" />}
                        {saving !== key && <Check className="w-3 h-3 text-green-400 opacity-0" />}
                      </div>
                    </div>

                    {/* Presets */}
                    <div className="flex gap-1.5 flex-wrap mb-2">
                      {PRESETS.map(c => (
                        <button
                          key={c}
                          onClick={() => save(key, c)}
                          className="w-6 h-6 rounded-full border-2 hover:scale-110 transition-all"
                          style={{ backgroundColor: c, borderColor: value === c ? "white" : "transparent" }}
                        />
                      ))}
                      {/* Custom color */}
                      <label className="w-6 h-6 rounded-full border-2 border-white/20 overflow-hidden cursor-pointer hover:scale-110 transition-all" title="Custom color">
                        <input
                          type="color"
                          value={value.startsWith("rgba") ? "#ffffff" : value}
                          onChange={(e) => save(key, e.target.value)}
                          className="opacity-0 absolute"
                        />
                        <div className="w-full h-full bg-gradient-to-br from-red-400 via-green-400 to-blue-400" />
                      </label>
                    </div>

                    {/* Current preview */}
                    <div className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                      <span className="text-sm" style={{ color: value }}>Preview text in this color</span>
                    </div>
                  </div>
                );
              })}
              <div className="border-t border-white/[0.06] pt-5">
                <GatewayImageUploader siteSettings={siteSettings} />
              </div>
              <div className="border-t border-white/[0.06] pt-5">
                <div className="flex items-center gap-2 mb-3">
                  <Film className="w-4 h-4 text-violet-400" />
                  <span className="font-semibold text-white">Landing Intro Video</span>
                </div>
                <IntroVideoUploader siteSettings={siteSettings} />
              </div>
              <p className="text-[11px] text-white/20 text-center">Changes apply site-wide immediately. Only visible to admins while editing.</p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}