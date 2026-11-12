import React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const FONT_OPTIONS = [
  { label: "Sans (System)", value: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" },
  { label: "Cormorant Garamond", value: "'Cormorant Garamond', Georgia, serif" },
  { label: "Great Vibes", value: "'Great Vibes', cursive" },
  { label: "Georgia", value: "Georgia, 'Times New Roman', serif" },
  { label: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { label: "Courier New", value: "'Courier New', Courier, monospace" },
  { label: "Marcellus", value: "'Marcellus', Georgia, serif" },
  { label: "Cinzel", value: "'Cinzel', Georgia, serif" },
  { label: "Playfair Display", value: "'Playfair Display', Georgia, serif" },
  { label: "EB Garamond", value: "'EB Garamond', Georgia, serif" },
  { label: "Inter", value: "'Inter', system-ui, sans-serif" },
  { label: "Manrope", value: "'Manrope', system-ui, sans-serif" },
];

export const SIZE_OPTIONS = [
  { label: "Small", value: "sm" },
  { label: "Medium", value: "md" },
  { label: "Large", value: "lg" },
  { label: "Extra Large", value: "xl" },
];

const TITLE_SIZE_CLASSES = {
  sm: "text-2xl md:text-3xl lg:text-4xl",
  md: "text-3xl md:text-5xl lg:text-6xl",
  lg: "text-4xl md:text-6xl lg:text-7xl",
  xl: "text-5xl md:text-7xl lg:text-8xl",
};

const DESCRIPTION_SIZE_CLASSES = {
  sm: "text-sm md:text-base",
  md: "text-base md:text-lg",
  lg: "text-lg md:text-xl",
  xl: "text-xl md:text-2xl",
};

export function titleSizeClass(size) {
  return TITLE_SIZE_CLASSES[size] || TITLE_SIZE_CLASSES.lg;
}

export function descriptionSizeClass(size) {
  return DESCRIPTION_SIZE_CLASSES[size] || DESCRIPTION_SIZE_CLASSES.lg;
}

export default function SlideTypographyControls({ label, prefix, form, setForm }) {
  const fontField = `${prefix}_font`;
  const colorField = `${prefix}_color`;
  const sizeField = `${prefix}_size`;
  const italicField = `${prefix}_italic`;
  const spacingField = `${prefix}_letter_spacing`;

  const update = (field, value) =>
    setForm((f) => ({ ...f, [field]: value }));

  // Letter spacing is stored as an em number string (e.g. "0.05"); render as em.
  const spacingValue = form[spacingField] ? parseFloat(form[spacingField]) : 0;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
      <p className="text-xs text-white/40 uppercase tracking-wider">{label}</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs text-white/30">Font</label>
          <Select
            value={form[fontField] || "default"}
            onValueChange={(v) => update(fontField, v === "default" ? "" : v)}
          >
            <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-white text-xs h-9">
              <SelectValue placeholder="Default" />
            </SelectTrigger>
            <SelectContent className="bg-[#13131a] border-white/[0.08] text-white">
              <SelectItem value="default" className="text-white focus:bg-white/[0.06] focus:text-white">Default (sans)</SelectItem>
              {FONT_OPTIONS.map((f) => (
                <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.value }} className="text-white focus:bg-white/[0.06] focus:text-white">
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-white/30">Size</label>
          <Select
            value={form[sizeField] || "default"}
            onValueChange={(v) => update(sizeField, v === "default" ? "" : v)}
          >
            <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-white text-xs h-9">
              <SelectValue placeholder="Default" />
            </SelectTrigger>
            <SelectContent className="bg-[#13131a] border-white/[0.08] text-white">
              <SelectItem value="default" className="text-white focus:bg-white/[0.06] focus:text-white">Default</SelectItem>
              {SIZE_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value} className="text-white focus:bg-white/[0.06] focus:text-white">
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 col-span-2">
          <label className="text-xs text-white/30">Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form[colorField] || "#ffffff"}
              onChange={(e) => update(colorField, e.target.value)}
              className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] cursor-pointer p-0.5"
            />
            <Input
              placeholder="#ffffff"
              value={form[colorField] || ""}
              onChange={(e) => update(colorField, e.target.value)}
              className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 h-9"
            />
            {form[colorField] && (
              <button
                onClick={() => update(colorField, "")}
                className="text-xs text-white/30 hover:text-white/60 px-2"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="space-y-1.5 col-span-2">
          <label className="text-xs text-white/30">Style</label>
          <button
            type="button"
            onClick={() => update(italicField, !form[italicField])}
            className={`flex items-center gap-2 h-9 px-3 rounded-lg text-sm transition-colors border ${
              form[italicField]
                ? "bg-violet-500/20 border-violet-400/40 text-violet-300"
                : "bg-white/[0.04] border-white/[0.08] text-white/40 hover:text-white/70"
            }`}
          >
            <span className="italic font-semibold">I</span>
            Italic {form[italicField] ? "On" : "Off"}
          </button>
        </div>

        <div className="space-y-1.5 col-span-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-white/30">Letter Spacing</label>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/40 font-mono">{spacingValue.toFixed(2)}em</span>
              {form[spacingField] && (
                <button
                  onClick={() => update(spacingField, "")}
                  className="text-xs text-white/30 hover:text-white/60 px-1"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={0.5}
            step={0.01}
            value={spacingValue}
            onChange={(e) => update(spacingField, e.target.value)}
            className="w-full accent-violet-400 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}