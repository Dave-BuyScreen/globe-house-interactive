import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Radio, Copy, Check, Settings, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LiveChannel() {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [editing, setEditing] = useState(null); // channel object or "new"
  const [form, setForm] = useState({ title: "", vimeo_embed_url: "", description: "", is_live: false });

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });
  const isAdmin = user?.role === "admin";

  const { data: channels = [], isLoading } = useQuery({
    queryKey: ["liveChannels"],
    queryFn: () => base44.entities.LiveChannel.list(),
  });

  const channel = channels[0]; // show first channel

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.LiveChannel.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["liveChannels"] }); closeForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LiveChannel.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["liveChannels"] }); closeForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.LiveChannel.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["liveChannels"] }),
  });

  const openNew = () => {
    setForm({ title: "", vimeo_embed_url: "", description: "", is_live: false });
    setEditing("new");
  };

  const openEdit = (ch) => {
    setForm({ title: ch.title, vimeo_embed_url: ch.vimeo_embed_url || "", description: ch.description || "", is_live: ch.is_live || false });
    setEditing(ch);
  };

  const closeForm = () => setEditing(null);

  const handleSave = () => {
    if (editing === "new") createMutation.mutate(form);
    else updateMutation.mutate({ id: editing.id, data: form });
  };

  // Build the public embed URL for this page
  const publicPageUrl = typeof window !== "undefined" ? `${window.location.origin}/live` : "";
  const iframeCode = `<iframe src="${publicPageUrl}" width="100%" height="600" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(iframeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
              <Radio className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {channel?.title || "Live Channel"}
              </h1>
              {channel?.is_live && (
                <span className="inline-flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-red-400 text-xs font-semibold tracking-widest uppercase">Live Now</span>
                </span>
              )}
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={() => setShowAdmin(!showAdmin)}
              className="p-2 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white/80 transition-colors"
              title="Manage Channel"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Admin Panel */}
      {isAdmin && showAdmin && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 mb-6">
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Manage Channels</h2>
              <Button onClick={openNew} size="sm" className="bg-violet-500 hover:bg-violet-600 gap-1.5 text-xs">
                <Plus className="w-3.5 h-3.5" /> Add Channel
              </Button>
            </div>

            {channels.map((ch) => (
              <div key={ch.id} className="flex items-center justify-between bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm text-white/80 font-medium">{ch.title}</p>
                  <p className="text-xs text-white/30 font-mono truncate max-w-xs">{ch.vimeo_embed_url || "No URL set"}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(ch)} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white/80 transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteMutation.mutate(ch.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Form */}
            {editing && (
              <div className="border border-violet-500/20 rounded-xl p-4 space-y-3 bg-violet-500/[0.03]">
                <h3 className="text-sm font-medium text-violet-300">{editing === "new" ? "New Channel" : "Edit Channel"}</h3>
                <Input
                  placeholder="Channel title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="bg-white/[0.04] border-white/[0.08] text-white text-sm"
                />
                <Input
                  placeholder="Vimeo embed URL (e.g. https://player.vimeo.com/video/123456789)"
                  value={form.vimeo_embed_url}
                  onChange={(e) => setForm({ ...form, vimeo_embed_url: e.target.value })}
                  className="bg-white/[0.04] border-white/[0.08] text-white text-sm"
                />
                <Input
                  placeholder="Description (optional)"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="bg-white/[0.04] border-white/[0.08] text-white text-sm"
                />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_live}
                    onChange={(e) => setForm({ ...form, is_live: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-white/60">Show LIVE badge</span>
                </label>
                <div className="flex gap-2 pt-1">
                  <Button onClick={handleSave} size="sm" className="bg-violet-500 hover:bg-violet-600 text-xs">Save</Button>
                  <Button onClick={closeForm} size="sm" variant="ghost" className="text-white/40 text-xs">Cancel</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Player */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {isLoading ? (
          <div className="w-full aspect-video bg-white/[0.03] rounded-2xl animate-pulse" />
        ) : !channel?.vimeo_embed_url ? (
          <div className="w-full aspect-video bg-white/[0.03] rounded-2xl border border-white/[0.06] flex flex-col items-center justify-center gap-3">
            <Radio className="w-10 h-10 text-white/10" />
            <p className="text-white/20 text-sm">No live stream configured</p>
            {isAdmin && (
              <Button onClick={openNew} size="sm" className="bg-violet-500 hover:bg-violet-600 gap-1.5 mt-2">
                <Plus className="w-4 h-4" /> Set Up Channel
              </Button>
            )}
          </div>
        ) : (
          <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl shadow-black/60">
            <iframe
              src={channel.vimeo_embed_url}
              className="w-full h-full"
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              title={channel.title}
            />
          </div>
        )}

        {/* Description */}
        {channel?.description && (
          <p className="mt-4 text-white/40 text-sm leading-relaxed">{channel.description}</p>
        )}

        {/* Embed Code */}
        {channel?.vimeo_embed_url && (
          <div className="mt-8 mb-16">
            <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-3">Embed on other platforms</p>
            <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
              <code className="flex-1 text-xs text-white/40 font-mono truncate">{iframeCode}</code>
              <button
                onClick={handleCopy}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 text-xs font-medium transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}