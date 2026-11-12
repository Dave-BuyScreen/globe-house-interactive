import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wand2, Plus, Trash2, Star } from "lucide-react";

const CATEGORIES = ["music", "comedy", "documentary", "talk_show", "sports", "arts", "jazz", "other"];

const defaultContentForm = {
  title: "", vimeo_embed_url: "", duration_seconds: 1800,
  category: "other", priority_score: 5, is_featured: false
};

export default function AutoProgrammer() {
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);
  const [days, setDays] = useState(1);
  const [showAddContent, setShowAddContent] = useState(false);
  const [contentForm, setContentForm] = useState(defaultContentForm);
  const [genResult, setGenResult] = useState(null);

  const { data: library = [], isLoading } = useQuery({
    queryKey: ["contentLibrary"],
    queryFn: () => base44.entities.ChannelContentLibrary.list(),
  });

  const addMutation = useMutation({
    mutationFn: (data) => base44.entities.ChannelContentLibrary.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contentLibrary"] });
      setShowAddContent(false);
      setContentForm(defaultContentForm);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ChannelContentLibrary.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contentLibrary"] }),
  });

  const handleGenerate = async () => {
    setGenerating(true);
    setGenResult(null);
    const res = await base44.functions.invoke("generateDailySchedule", {
      target_date: new Date().toISOString().split("T")[0],
      days,
    });
    setGenResult(res.data);
    setGenerating(false);
    queryClient.invalidateQueries({ queryKey: ["liveSchedule"] });
  };

  return (
    <div className="space-y-6">
      {/* Generate Controls */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <Wand2 className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">AI Auto Programming</h3>
            <p className="text-xs text-white/30">Generate a full schedule from your content library</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs text-white/40">Days:</label>
            <Input type="number" min={1} max={7} value={days}
              onChange={e => setDays(Number(e.target.value))}
              className="w-16 bg-white/[0.04] border-white/[0.08] text-white text-sm h-8" />
          </div>
          <Button onClick={handleGenerate} disabled={generating || library.length === 0}
            className="bg-violet-500 hover:bg-violet-600 gap-2 text-xs h-8">
            <Wand2 className="w-3.5 h-3.5" />
            {generating ? "Generating…" : "Generate Schedule"}
          </Button>
        </div>

        {library.length === 0 && (
          <p className="text-xs text-amber-400/60 mt-3">Add content to the library below before generating.</p>
        )}

        {genResult && (
          <div className={`mt-3 px-4 py-3 rounded-xl text-sm ${
            genResult.success
              ? "bg-green-500/10 text-green-400 border border-green-500/20"
              : "bg-red-500/10 text-red-400 border border-red-500/20"
          }`}>
            {genResult.message || genResult.error}
          </div>
        )}
      </div>

      {/* Content Library */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Content Library</h3>
          <Button onClick={() => setShowAddContent(!showAddContent)} size="sm"
            className="bg-violet-500 hover:bg-violet-600 gap-1.5 text-xs h-8">
            <Plus className="w-3.5 h-3.5" /> Add Video
          </Button>
        </div>

        {showAddContent && (
          <div className="mb-4 p-4 bg-white/[0.02] border border-violet-500/20 rounded-xl space-y-3">
            <Input value={contentForm.title} onChange={e => setContentForm({...contentForm, title: e.target.value})}
              placeholder="Video title" className="bg-white/[0.04] border-white/[0.08] text-white text-sm" />
            <Input value={contentForm.vimeo_embed_url} onChange={e => setContentForm({...contentForm, vimeo_embed_url: e.target.value})}
              placeholder="https://player.vimeo.com/video/..." className="bg-white/[0.04] border-white/[0.08] text-white text-sm" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/40 mb-1 block">Duration (seconds)</label>
                <Input type="number" value={contentForm.duration_seconds}
                  onChange={e => setContentForm({...contentForm, duration_seconds: Number(e.target.value)})}
                  className="bg-white/[0.04] border-white/[0.08] text-white text-sm" />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">Priority (1–10)</label>
                <Input type="number" min={1} max={10} value={contentForm.priority_score}
                  onChange={e => setContentForm({...contentForm, priority_score: Number(e.target.value)})}
                  className="bg-white/[0.04] border-white/[0.08] text-white text-sm" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select value={contentForm.category}
                onChange={e => setContentForm({...contentForm, category: e.target.value})}
                className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-md px-3 py-2 text-white/80 text-sm">
                {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#1c1c28]">{c.replace('_',' ')}</option>)}
              </select>
              <label className="flex items-center gap-1.5 cursor-pointer flex-shrink-0">
                <input type="checkbox" checked={contentForm.is_featured}
                  onChange={e => setContentForm({...contentForm, is_featured: e.target.checked})} />
                <span className="text-xs text-white/60 flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-400" /> Featured
                </span>
              </label>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => addMutation.mutate(contentForm)} size="sm"
                className="bg-violet-500 hover:bg-violet-600 text-xs">Add to Library</Button>
              <Button onClick={() => setShowAddContent(false)} size="sm" variant="ghost"
                className="text-white/40 text-xs">Cancel</Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <p className="text-center text-white/20 text-sm py-8">Loading…</p>
        ) : library.length === 0 ? (
          <p className="text-center text-white/20 text-sm py-8">No content yet. Add videos above.</p>
        ) : (
          <div className="space-y-2">
            {library.map(item => (
              <div key={item.id}
                className="flex items-center justify-between bg-white/[0.02] border border-white/[0.04] rounded-xl px-4 py-3 gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-white/80 font-medium truncate">{item.title}</p>
                    {item.is_featured && <Star className="w-3 h-3 text-amber-400 flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-white/30">
                    {item.category} · {Math.round((item.duration_seconds || 0) / 60)} min · Priority {item.priority_score}
                  </p>
                </div>
                <button onClick={() => deleteMutation.mutate(item.id)}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}