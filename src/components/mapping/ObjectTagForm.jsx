import React, { useState, useEffect } from "react";
import { ZONES_H, ZONES_V } from "./ZoneCalculator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, ShoppingBag } from "lucide-react";

export default function ObjectTagForm({ bbox, anchorPoint, zoneH, zoneV, currentTime, videoDuration, onSave, onCancel }) {
  const [form, setForm] = useState({
    label: "",
    product_name: "",
    product_price: "",
    product_image_url: "",
    shop_url: "",
    start_time: Math.max(0, currentTime - 1),
    end_time: Math.min(videoDuration || 30, currentTime + 5),
    z_index: 0,
    zone_h: zoneH,
    zone_v: zoneV,
  });

  useEffect(() => {
    setForm(f => ({ ...f, zone_h: zoneH, zone_v: zoneV }));
  }, [zoneH, zoneV]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = () => {
    if (!form.label.trim()) return;
    onSave({
      ...form,
      bounding_box: bbox,
      anchor_point: anchorPoint,
      object_id: `obj_${Date.now()}`,
      status: "draft",
    });
  };

  return (
    <div className="bg-[#13131a] border border-white/10 rounded-2xl p-5 shadow-2xl w-80 max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-violet-400" />
          Tag Object
        </h3>
        <button onClick={onCancel} className="text-white/40 hover:text-white/80">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {/* Semantic Zones */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Label className="text-white/50 text-xs mb-1 block">H Zone</Label>
            <select
              value={form.zone_h}
              onChange={e => set("zone_h", e.target.value)}
              className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-2 py-1.5 text-white text-sm"
            >
              {ZONES_H.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <Label className="text-white/50 text-xs mb-1 block">V Zone</Label>
            <select
              value={form.zone_v}
              onChange={e => set("zone_v", e.target.value)}
              className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-2 py-1.5 text-white text-sm"
            >
              {ZONES_V.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>
        </div>

        <div>
          <Label className="text-white/50 text-xs mb-1 block">Object Label *</Label>
          <Input
            value={form.label}
            onChange={e => set("label", e.target.value)}
            placeholder="e.g. Red Sneaker"
            className="bg-white/[0.05] border-white/10 text-white placeholder:text-white/30"
          />
        </div>

        <div>
          <Label className="text-white/50 text-xs mb-1 block">Product Name</Label>
          <Input
            value={form.product_name}
            onChange={e => set("product_name", e.target.value)}
            placeholder="Nike Air Max"
            className="bg-white/[0.05] border-white/10 text-white placeholder:text-white/30"
          />
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <Label className="text-white/50 text-xs mb-1 block">Price</Label>
            <Input
              value={form.product_price}
              onChange={e => set("product_price", e.target.value)}
              placeholder="$99"
              className="bg-white/[0.05] border-white/10 text-white placeholder:text-white/30"
            />
          </div>
          <div className="flex-1">
            <Label className="text-white/50 text-xs mb-1 block">Z-Index</Label>
            <Input
              type="number"
              value={form.z_index}
              onChange={e => set("z_index", Number(e.target.value))}
              className="bg-white/[0.05] border-white/10 text-white"
            />
          </div>
        </div>

        <div>
          <Label className="text-white/50 text-xs mb-1 block">Shop URL</Label>
          <Input
            value={form.shop_url}
            onChange={e => set("shop_url", e.target.value)}
            placeholder="https://shop.example.com/..."
            className="bg-white/[0.05] border-white/10 text-white placeholder:text-white/30"
          />
        </div>

        <div>
          <Label className="text-white/50 text-xs mb-1 block">Product Image URL</Label>
          <Input
            value={form.product_image_url}
            onChange={e => set("product_image_url", e.target.value)}
            placeholder="https://..."
            className="bg-white/[0.05] border-white/10 text-white placeholder:text-white/30"
          />
        </div>

        {/* Time Range */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Label className="text-white/50 text-xs mb-1 block">Start (s)</Label>
            <Input
              type="number"
              step="0.1"
              value={form.start_time}
              onChange={e => set("start_time", Number(e.target.value))}
              className="bg-white/[0.05] border-white/10 text-white"
            />
          </div>
          <div className="flex-1">
            <Label className="text-white/50 text-xs mb-1 block">End (s)</Label>
            <Input
              type="number"
              step="0.1"
              value={form.end_time}
              onChange={e => set("end_time", Number(e.target.value))}
              className="bg-white/[0.05] border-white/10 text-white"
            />
          </div>
        </div>

        {/* Coordinate readout */}
        <div className="bg-white/[0.03] rounded-lg p-2 text-xs text-white/40 font-mono">
          bbox: {bbox.x.toFixed(3)}, {bbox.y.toFixed(3)}, {bbox.width.toFixed(3)}×{bbox.height.toFixed(3)}
          <br />
          anchor: {anchorPoint.x.toFixed(3)}, {anchorPoint.y.toFixed(3)}
        </div>

        <div className="flex gap-2 pt-1">
          <Button variant="ghost" onClick={onCancel} className="flex-1 border border-white/10 text-white/60 hover:text-white">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!form.label.trim()}
            className="flex-1 bg-violet-500 hover:bg-violet-600 text-white"
          >
            Save Tag
          </Button>
        </div>
      </div>
    </div>
  );
}