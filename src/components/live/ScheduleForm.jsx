import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { X, Upload } from "lucide-react";

const CATEGORIES = ["music", "comedy", "documentary", "talk_show", "sports", "arts", "jazz", "other"];

const toLocalInput = (iso) => {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 16);
};

export default function ScheduleForm({ entry, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: entry?.title || "",
    description: entry?.description || "",
    vimeo_embed_url: entry?.vimeo_embed_url || "",
    start_time: toLocalInput(entry?.start_time),
    end_time: toLocalInput(entry?.end_time),
    thumbnail: entry?.thumbnail || "",
    category: entry?.category || "other",
    ar_trigger_enabled: entry?.ar_trigger_enabled || false,
    trigger_timestamp: entry?.trigger_timestamp || "",
    product_link: entry?.product_link || "",
  });
  const [uploading, setUploading] = useState(false);

  const handleThumbnail = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, thumbnail: file_url }));
    setUploading(false);
  };

  const handleSubmit = () => {
    onSave({
      ...form,
      start_time: form.start_time ? new Date(form.start_time).toISOString() : "",
      end_time: form.end_time ? new Date(form.end_time).toISOString() : "",
      trigger_timestamp: form.trigger_timestamp ? Number(form.trigger_timestamp) : undefined,
    });
  };

  return (
    <div className="bg-[#1c1c28] border border-violet-500/20 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-violet-300">{entry ? "Edit Program" : "Add Program"}</h3>
        <button onClick={onCancel} className="text-white/30 hover:text-white/60 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="text-xs text-white/40 mb-1 block">Title *</label>
          <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})}
            placeholder="Program title" className="bg-white/[0.04] border-white/[0.08] text-white text-sm" />
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs text-white/40 mb-1 block">Vimeo Embed URL</label>
          <Input value={form.vimeo_embed_url} onChange={e => setForm({...form, vimeo_embed_url: e.target.value})}
            placeholder="https://player.vimeo.com/video/..." className="bg-white/[0.04] border-white/[0.08] text-white text-sm" />
        </div>

        <div>
          <label className="text-xs text-white/40 mb-1 block">Start Time *</label>
          <input type="datetime-local" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-md px-3 py-2 text-white/80 text-sm focus:outline-none focus:border-violet-500/40" />
        </div>

        <div>
          <label className="text-xs text-white/40 mb-1 block">End Time *</label>
          <input type="datetime-local" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-md px-3 py-2 text-white/80 text-sm focus:outline-none focus:border-violet-500/40" />
        </div>

        <div>
          <label className="text-xs text-white/40 mb-1 block">Category</label>
          <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-md px-3 py-2 text-white/80 text-sm focus:outline-none">
            {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#1c1c28]">{c.replace('_', ' ')}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs text-white/40 mb-1 block">Thumbnail</label>
          <div className="flex gap-2">
            <Input value={form.thumbnail} onChange={e => setForm({...form, thumbnail: e.target.value})}
              placeholder="URL or upload" className="bg-white/[0.04] border-white/[0.08] text-white text-sm flex-1" />
            <label className="flex-shrink-0 cursor-pointer">
              <input type="file" accept="image/*" onChange={handleThumbnail} className="hidden" />
              <div className="h-9 px-3 flex items-center gap-1 rounded-md bg-white/[0.06] hover:bg-white/[0.10] text-white/50 text-xs transition-colors">
                {uploading ? "…" : <><Upload className="w-3.5 h-3.5" /><span>Up</span></>}
              </div>
            </label>
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.ar_trigger_enabled}
              onChange={e => setForm({...form, ar_trigger_enabled: e.target.checked})} className="rounded" />
            <span className="text-sm text-white/60">Enable AR / BuyScreen Trigger</span>
          </label>
        </div>

        {form.ar_trigger_enabled && (
          <>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Trigger at (seconds)</label>
              <Input type="number" value={form.trigger_timestamp}
                onChange={e => setForm({...form, trigger_timestamp: e.target.value})}
                placeholder="e.g. 120" className="bg-white/[0.04] border-white/[0.08] text-white text-sm" />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Product Link</label>
              <Input value={form.product_link} onChange={e => setForm({...form, product_link: e.target.value})}
                placeholder="https://..." className="bg-white/[0.04] border-white/[0.08] text-white text-sm" />
            </div>
          </>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <Button onClick={handleSubmit} size="sm" className="bg-violet-500 hover:bg-violet-600 text-xs">Save Program</Button>
        <Button onClick={onCancel} size="sm" variant="ghost" className="text-white/40 text-xs">Cancel</Button>
      </div>
    </div>
  );
}