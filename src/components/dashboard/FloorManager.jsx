import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Settings, Check, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { FLOOR_TYPES, resolveFloors } from "./floors";
import FloatingDashboardButton from "./FloatingDashboardButton";

export default function FloorManager({ floorsConfig, rowLabels, settingsId }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState([]);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (floors_config) => {
      if (settingsId) {
        return base44.entities.SiteSettings.update(settingsId, { floors_config });
      }
      return base44.entities.SiteSettings.create({ floors_config });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["siteSettings"] });
      setOpen(false);
    },
  });

  const handleOpen = (v) => {
    if (v) {
      setDraft(
        resolveFloors(floorsConfig, rowLabels).map((f) => ({
          key: f.key,
          tag: f.tag,
          name: f.name,
          blurb: f.blurb,
          type: f.type,
        }))
      );
    }
    setOpen(v);
  };

  const update = (i, field, value) => {
    setDraft((prev) => prev.map((f, idx) => (idx === i ? { ...f, [field]: value } : f)));
  };

  const addFloor = () => {
    setDraft((prev) => [
      ...prev,
      { key: `f_${Date.now()}`, tag: "", name: "New Floor", blurb: "", type: "other" },
    ]);
  };

  const removeFloor = (i) => {
    setDraft((prev) => prev.filter((_, idx) => idx !== i));
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 gap-2 text-[#EDE3D0]/60 hover:text-[#EDE3D0]">
          <Settings className="w-4 h-4" />
          Manage Floors
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1a1410] border-[#B89045]/25 text-white max-h-[85vh] overflow-y-auto">
        <FloatingDashboardButton onClose={() => setOpen(false)} />
        <DialogHeader>
          <DialogTitle className="font-display text-[#EDE3D0]">Manage Hotel Floors</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-[#EDE3D0]/40 -mt-2">
          Edit each floor's letter, name, and description. Add or remove floors freely — fonts, styles, and colors stay locked for brand consistency.
        </p>
        <div className="space-y-3 pt-2">
          {draft.map((f, i) => (
            <div key={f.key} className="rounded-xl border border-[#B89045]/15 bg-[#241c15]/50 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  value={f.tag}
                  onChange={(e) => update(i, "tag", e.target.value.slice(0, 3))}
                  placeholder="L"
                  className="bg-white/[0.04] border-[#B89045]/20 text-[#D4AF37] text-center font-semibold w-14 h-9"
                />
                <Input
                  value={f.name}
                  onChange={(e) => update(i, "name", e.target.value)}
                  placeholder="Floor name"
                  className="bg-white/[0.04] border-[#B89045]/20 text-[#EDE3D0] flex-1 h-9"
                />
                <button
                  onClick={() => removeFloor(i)}
                  className="p-2 rounded-lg text-[#EDE3D0]/30 hover:text-red-400 hover:bg-red-400/10 transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <Input
                value={f.blurb}
                onChange={(e) => update(i, "blurb", e.target.value)}
                placeholder="Short description"
                className="bg-white/[0.04] border-[#B89045]/20 text-[#D4AF37] placeholder:text-[#D4AF37]/40 h-9 text-sm"
              />
              <Label className="text-[10px] text-[#EDE3D0]/40 uppercase tracking-wider">Floor type</Label>
              <Select value={f.type} onValueChange={(v) => update(i, "type", v)}>
                <SelectTrigger className="bg-white/[0.04] border-[#B89045]/20 text-[#EDE3D0]/70 h-9 text-sm">
                  <SelectValue placeholder="Content type" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1410] border-[#B89045]/25 text-[#EDE3D0]">
                  {FLOOR_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value} className="text-[#EDE3D0] focus:bg-[#241c15]">
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
          <Button
            onClick={addFloor}
            variant="outline"
            className="w-full border-[#B89045]/25 text-[#EDE3D0] hover:bg-[#241c15] gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Floor
          </Button>
          <Button
            onClick={() => updateMutation.mutate(draft)}
            disabled={updateMutation.isPending}
            className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B89045] hover:opacity-90 text-[#1a1410] gap-2 mt-1"
          >
            <Check className="w-4 h-4" />
            Save Floors
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}