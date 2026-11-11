import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Tv, ShoppingBag, ShieldCheck, Wand2, Play, Film } from "lucide-react";

const tools = [
  { to: "/player", icon: Play, title: "Interactive Player", text: "Watch episodes with BuyScreen shoppable hotspots." },
  { to: "/marketplace", icon: ShoppingBag, title: "Marketplace", text: "Browse products featured across your broadcasts." },
  { to: "/mapper", icon: ShieldCheck, title: "Spatial Mapper", text: "Tag wardrobe, props and products onto video frames." },
  { to: "/ubpl-editor", icon: Wand2, title: "UBPL Editor", text: "Write scene scripts and timeline triggers per episode." },
];

export default function Dashboard() {
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEpisodes() {
      try {
        const { data, error } = await supabase
          .from("episodes")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        setEpisodes(data || []);
      } catch (err) {
        console.error("Error fetching episodes:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchEpisodes();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      <div className="border-b border-[#B89045]/20 pb-6">
        <span className="text-xs tracking-widest text-[#D4AF37] uppercase font-semibold">Transformation Chateau</span>
        <h1 className="text-3xl font-display font-bold text-[#EDE3D0] mt-1">Chateau Dashboard</h1>
        <p className="text-[#EDE3D0]/70 text-sm mt-1">
          Manage your episodes, spatial mappings, scripts and shoppable marketplace from one place.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {tools.map(({ to, icon: Icon, title, text }) => (
          <Link
            key={to}
            to={to}
            className="bg-[#1a1410] border border-[#B89045]/20 hover:border-[#D4AF37]/60 rounded-2xl p-6 shadow-lg transition-all group space-y-3"
          >
            <div className="w-10 h-10 rounded-xl border border-[#B89045]/40 bg-[#241c15] flex items-center justify-center">
              <Icon className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <h3 className="font-display font-bold text-[#EDE3D0] group-hover:text-[#D4AF37] transition-colors">{title}</h3>
            <p className="text-xs text-[#EDE3D0]/60 leading-relaxed">{text}</p>
          </Link>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Tv className="w-5 h-5 text-[#D4AF37]" />
          <h2 className="text-xl font-display font-bold text-[#EDE3D0]">Episodes</h2>
          <span className="text-xs text-[#B89045]">({episodes.length})</span>
        </div>

        {loading ? (
          <div className="text-center py-16 text-[#EDE3D0]/50 text-sm">Loading episodes from Supabase...</div>
        ) : episodes.length === 0 ? (
          <div className="bg-[#1a1410] border border-[#B89045]/20 rounded-2xl p-12 text-center space-y-2">
            <Film className="w-10 h-10 text-[#B89045] mx-auto opacity-50" />
            <h3 className="font-display font-bold text-[#EDE3D0]">No Episodes Yet</h3>
            <p className="text-xs text-[#EDE3D0]/60 max-w-md mx-auto">
              Add rows to the <code>episodes</code> table in Supabase and they will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {episodes.map((ep) => (
              <Link
                key={ep.id}
                to={`/player?id=${ep.id}`}
                className="bg-[#1a1410] border border-[#B89045]/20 hover:border-[#D4AF37]/60 rounded-2xl overflow-hidden shadow-lg transition-all group"
              >
                <div className="aspect-video bg-[#241c15] flex items-center justify-center overflow-hidden">
                  {ep.thumbnail_url ? (
                    <img src={ep.thumbnail_url} alt={ep.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <Play className="w-10 h-10 text-[#B89045]/50" />
                  )}
                </div>
                <div className="p-5 space-y-1.5">
                  <h3 className="font-display font-bold text-[#EDE3D0] group-hover:text-[#D4AF37] transition-colors">
                    {ep.title || "Untitled Episode"}
                  </h3>
                  {ep.platform && (
                    <span className="text-[10px] uppercase tracking-wider text-[#B89045]">{ep.platform}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
