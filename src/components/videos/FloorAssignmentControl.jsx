import React, { useState } from "react";
import { Building2, Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

// Compact per-card control: shows current floor tags as badges and a
// "Floors" button that opens a popover to toggle assignments.
// Mirrors the floor-chip styling used in EpisodeEditor's Floor Assignment section.
export default function FloorAssignmentControl({
  episode,
  floors,
  onSave,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(episode.assigned_floors || []);

  const assigned = floors.filter((f) => draft.includes(f.key));

  const toggle = (key) => {
    setDraft((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const apply = () => {
    onSave(draft);
    setOpen(false);
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap min-h-[28px]">
      {/* Current assignment badges */}
      {assigned.length > 0 ? (
        <div className="flex items-center gap-1 flex-wrap">
          {assigned.map((f) => (
            <span
              key={f.key}
              className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-md bg-[#2A1C12] border border-[#B89045]/30 text-[#E9C97A] text-[10px] font-semibold"
              title={f.name}
            >
              {f.tag}
            </span>
          ))}
        </div>
      ) : (
        <span className="text-[10px] text-white/30">No floor</span>
      )}

      <Popover open={open} onOpenChange={(o) => {
        setOpen(o);
        if (o) setDraft(episode.assigned_floors || []);
      }}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            className="ml-auto inline-flex items-center gap-1 px-2 h-6 rounded-md border border-white/[0.08] bg-white/[0.04] text-white/50 hover:text-white hover:bg-white/[0.06] text-[11px] transition-colors disabled:opacity-40"
          >
            <Building2 className="w-3 h-3" />
            Floors
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          onClick={(e) => e.stopPropagation()}
          className="w-64 p-3 bg-[#13131a] border-white/[0.08]"
        >
          <p className="text-[11px] text-white/40 mb-2">Place on dashboard floors</p>
          {floors.length === 0 ? (
            <p className="text-xs text-white/30 py-2">No floors configured.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {floors.map((floor) => {
                const selected = draft.includes(floor.key);
                return (
                  <button
                    key={floor.key}
                    type="button"
                    onClick={() => toggle(floor.key)}
                    className={`px-2 py-1.5 rounded-lg border text-xs transition-all flex items-center gap-1.5 ${
                      selected
                        ? "border-amber-500/50 bg-amber-500/15 text-amber-300"
                        : "border-white/[0.08] bg-white/[0.04] text-white/50 hover:text-white hover:bg-white/[0.06]"
                    }`}
                  >
                    <span className="w-5 h-5 rounded-md bg-[#2A1C12] border border-[#B89045]/30 text-[#E9C97A] text-[10px] flex items-center justify-center font-semibold">
                      {floor.tag}
                    </span>
                    {floor.name}
                    {selected && <Check className="w-3 h-3" />}
                  </button>
                );
              })}
            </div>
          )}
          <div className="flex gap-2 pt-1 border-t border-white/[0.06]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="flex-1 h-8 bg-white/[0.04] border-white/[0.08] text-white/60 hover:bg-white/[0.08]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={apply}
              disabled={disabled}
              className="flex-1 h-8 bg-amber-500/80 hover:bg-amber-500 text-white"
            >
              Save
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}