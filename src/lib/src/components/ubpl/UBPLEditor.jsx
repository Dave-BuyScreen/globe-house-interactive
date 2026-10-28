import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Wand2, Code, Save, CheckCircle2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UBPLEditor() {
  const [episodes, setEpisodes] = useState([]);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [scriptContent, setScriptContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchEpisodes();
  }, []);

  async function fetchEpisodes() {
    try {
      const { data, error } = await supabase.from("episodes").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setEpisodes(data || []);
      if (data && data.length > 0) {
        setSelectedEpisode(data[0]);
        setScriptContent(data[0].description || data[0].summary || "// Universal Broadcast Programming Language (UBPL)\n@scene: Opening Act\n@action: Introduction");
      }
    } catch (err) {
      console.error("Error fetching episodes for UBPL:", err);
    }
  }

  async function handleSaveScript(e) {
    e.preventDefault();
    if (!selectedEpisode) return;

    try {
      setSaving(true);
      setSuccess(false);

      const { error } = await supabase
        .from("episodes")
        .update({ description: scriptContent })
        .eq("id", selectedEpisode.id);

      if (error) throw error;
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error updating UBPL script:", err);
      alert("Error saving script content.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      {/* Header */}
      <div className="border-b border-[#B89045]/20 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs tracking-widest text-[#D4AF37] uppercase font-semibold">Script & Programming Language</span>
          <h1 className="text-3xl font-display font-bold text-[#EDE3D0] mt-1">
            UBPL Studio & Editor
          </h1>
          <p className="text-[#EDE3D0]/70 text-sm mt-1">
            Author and refine Universal Broadcast Programming Language scripts and timeline triggers for your episodes.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#1a1410] border border-[#B89045]/30 rounded-xl px-4 py-2 text-xs text-[#D4AF37]">
          <Code className="w-4 h-4" /> Supabase Synchronized
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Episode Selector Sidebar (1 col) */}
        <div className="bg-[#1a1410] border border-[#B89045]/20 rounded-2xl p-6 shadow-lg space-y-4 self-start">
          <h3 className="font-display font-bold text-[#EDE3D0] text-sm uppercase tracking-wider text-[#D4AF37]">
            Select Episode Script
          </h3>
          <div className="space-y-2">
            {episodes.map((ep) => (
              <button
                key={ep.id}
                onClick={() => {
                  setSelectedEpisode(ep);
                  setScriptContent(ep.description || ep.summary || "");
                }}
                className={`w-full text-left px-4 py-3 rounded-xl text-xs transition-all flex items-center gap-2.5 ${
                  selectedEpisode?.id === ep.id
                    ? "bg-[#241c15] border border-[#D4AF37] text-[#EDE3D0] font-semibold shadow-md"
                    : "text-[#EDE3D0]/60 hover:bg-[#241c15]/50 hover:text-[#EDE3D0]"
                }`}
              >
                <FileText className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
                <span className="truncate">{ep.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Code Editor Workspace (3 cols) */}
        <div className="lg:col-span-3 bg-[#1a1410] border border-[#B89045]/20 rounded-2xl p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-[#B89045]/20 pb-4">
            <div className="flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-[#D4AF37]" />
              <h3 className="font-display font-bold text-[#EDE3D0] text-base">
                {selectedEpisode ? `Editing: ${selectedEpisode.title}` : "Select an episode to begin"}
              </h3>
            </div>
            {success && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved to Supabase
              </div>
            )}
          </div>

          <form onSubmit={handleSaveScript} className="space-y-4">
            <textarea
              rows={14}
              value={scriptContent}
              onChange={(e) => setScriptContent(e.target.value)}
              placeholder="// Enter UBPL syntax, scene directions, and object triggers here..."
              className="w-full bg-[#120e0a] border border-[#B89045]/30 rounded-xl p-4 font-mono text-xs text-[#EDE3D0] focus:outline-none focus:border-[#D4AF37] leading-relaxed resize-y"
            />

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={saving || !selectedEpisode}
                className="bg-gradient-to-r from-[#D4AF37] to-[#B89045] text-[#1a1410] hover:opacity-90 font-semibold text-xs px-6 py-3 rounded-xl shadow-md flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> {saving ? "Saving Script..." : "Save UBPL Script"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
