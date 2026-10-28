import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ShieldCheck, Plus, Layers, Target, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VideoMapper() {
  const [episodes, setEpisodes] = useState([]);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state for creating a new mapping
  const [objectName, setObjectName] = useState("");
  const [objectBrand, setObjectBrand] = useState("");
  const [objectCategory, setObjectCategory] = useState("Fashion");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchEpisodes();
  }, []);

  useEffect(() => {
    if (selectedEpisode) {
      fetchMappings(selectedEpisode.id);
    }
  }, [selectedEpisode]);

  async function fetchEpisodes() {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("episodes").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setEpisodes(data || []);
      if (data && data.length > 0) {
        setSelectedEpisode(data[0]);
      }
    } catch (err) {
      console.error("Error fetching episodes for mapping:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMappings(episodeId) {
    try {
      const { data, error } = await supabase
        .from("video_object_mappings")
        .select("*")
        .eq("episode_id", episodeId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMappings(data || []);
    } catch (err) {
      console.error("Error fetching object mappings:", err);
    }
  }

  async function handleAddMapping(e) {
    e.preventDefault();
    if (!selectedEpisode || !objectName) return;

    try {
      setSaving(true);
      const { error } = await supabase.from("video_object_mappings").insert([
        {
          episode_id: selectedEpisode.id,
          object_id: `obj_${Date.now()}`,
          name: objectName,
          brand: objectBrand,
          category: objectCategory,
          status: "active",
          spatial_coordinates: { x: 50, y: 50 },
          bounding_box: { width: 20, height: 20 }
        }
      ]);

      if (error) throw error;

      setObjectName("");
      setObjectBrand("");
      fetchMappings(selectedEpisode.id);
    } catch (err) {
      console.error("Error inserting mapping:", err);
      alert("Error adding spatial mapping. Check console for details.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      {/* Header */}
      <div className="border-b border-[#B89045]/20 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs tracking-widest text-[#D4AF37] uppercase font-semibold">Spatial Intelligence</span>
          <h1 className="text-3xl font-display font-bold text-[#EDE3D0] mt-1">
            BuyScreen Spatial Mapper Studio
          </h1>
          <p className="text-[#EDE3D0]/70 text-sm mt-1">
            Tag physical wardrobe items, luxury accessories, and props directly onto video frames for interactive checkout.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#1a1410] border border-[#B89045]/30 rounded-xl px-4 py-2 text-xs text-[#D4AF37]">
          <ShieldCheck className="w-4 h-4" /> Supabase Linked Studio
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Episode Selector & Canvas / Hotspot List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Episode Select Dropdown */}
          <div className="bg-[#1a1410] border border-[#B89045]/20 rounded-2xl p-6 shadow-lg space-y-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
              Select Target Broadcast Episode
            </label>
            <select
              value={selectedEpisode?.id || ""}
              onChange={(e) => {
                const found = episodes.find((ep) => ep.id === e.target.value);
                setSelectedEpisode(found);
              }}
              className="w-full bg-[#241c15] border border-[#B89045]/30 rounded-xl px-4 py-3 text-sm text-[#EDE3D0] focus:outline-none focus:border-[#D4AF37]"
            >
              {episodes.map((ep) => (
                <option key={ep.id} value={ep.id}>
                  {ep.title} ({ep.platform || "GlobeHouse"})
                </option>
              ))}
            </select>
          </div>

          {/* Active Hotspot Mappings Table / Cards */}
          <div className="bg-[#1a1410] border border-[#B89045]/20 rounded-2xl p-6 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-[#EDE3D0] text-lg">Mapped Objects for this Episode</h3>
              <span className="text-xs text-[#B89045]">{mappings.length} Active Hotspots</span>
            </div>

            {mappings.length === 0 ? (
              <div className="text-center py-12 text-[#EDE3D0]/50 text-xs space-y-2">
                <Target className="w-8 h-8 text-[#B89045]/40 mx-auto" />
                <p>No BuyScreen spatial coordinates mapped for this episode yet.</p>
                <p className="text-[11px] text-[#EDE3D0]/40">Use the form on the right to tag your first item.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {mappings.map((m) => (
                  <div key={m.id} className="bg-[#241c15] border border-[#B89045]/20 rounded-xl p-4 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <h4 className="font-display font-semibold text-sm text-[#EDE3D0]">{m.name}</h4>
                      </div>
                      <p className="text-xs text-[#EDE3D0]/60">
                        Brand: <span className="text-[#D4AF37]">{m.brand || "Unspecified"}</span> • Category: {m.category}
                      </p>
                    </div>
                    <span className="text-[10px] tracking-wider uppercase bg-[#120e0a] border border-[#B89045]/30 text-[#D4AF37] px-2.5 py-1 rounded-lg">
                      {m.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Add New Hotspot Form */}
        <div className="bg-[#1a1410] border border-[#B89045]/20 rounded-2xl p-6 shadow-lg space-y-6 self-start">
          <div className="flex items-center gap-2 border-b border-[#B89045]/20 pb-4">
            <Plus className="w-5 h-5 text-[#D4AF37]" />
            <h3 className="font-display font-bold text-[#EDE3D0] text-base">Tag New BuyScreen Object</h3>
          </div>

          <form onSubmit={handleAddMapping} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-[#EDE3D0]/80">Object / Product Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Silk Velvet Evening Jacket"
                value={objectName}
                onChange={(e) => setObjectName(e.target.value)}
                className="w-full bg-[#241c15] border border-[#B89045]/30 rounded-xl px-4 py-2.5 text-sm text-[#EDE3D0] placeholder:text-[#EDE3D0]/30 focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-[#EDE3D0]/80">Brand / Designer</label>
              <input
                type="text"
                placeholder="e.g. Finward Blackwell"
                value={objectBrand}
                onChange={(e) => setObjectBrand(e.target.value)}
                className="w-full bg-[#241c15] border border-[#B89045]/30 rounded-xl px-4 py-2.5 text-sm text-[#EDE3D0] placeholder:text-[#EDE3D0]/30 focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-[#EDE3D0]/80">Category</label>
              <select
                value={objectCategory}
                onChange={(e) => setObjectCategory(e.target.value)}
                className="w-full bg-[#241c15] border border-[#B89045]/30 rounded-xl px-4 py-2.5 text-sm text-[#EDE3D0] focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="Fashion">Fashion & Apparel</option>
                <option value="Accessories">Luxury Accessories</option>
                <option value="Props">Scene Prop</option>
                <option value="Home">Chateau Decor</option>
              </select>
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B89045] text-[#1a1410] hover:opacity-90 font-semibold text-xs py-3 rounded-xl shadow-md mt-2"
            >
              {saving ? "Saving Hotspot..." : "Save Spatial Hotspot"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
