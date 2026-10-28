import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Film, ShoppingBag, ArrowLeft, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Player() {
  const [searchParams] = useSearchParams();
  const episodeId = searchParams.get("id");
  const navigate = useNavigate();

  const [episode, setEpisode] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    if (episodeId) {
      fetchEpisodeAndProducts(episodeId);
    } else {
      fetchLatestEpisode();
    }
  }, [episodeId]);

  async function fetchLatestEpisode() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("episodes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      if (data) {
        setEpisode(data);
        fetchProductsForEpisode(data);
      }
    } catch (err) {
      console.error("Error fetching latest episode:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchEpisodeAndProducts(id) {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("episodes")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setEpisode(data);
      fetchProductsForEpisode(data);
    } catch (err) {
      console.error("Error fetching episode:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchProductsForEpisode(ep) {
    try {
      // Fetch products associated or general fallback products
      const { data } = await supabase.from("products").select("*").limit(6);
      setProducts(data || []);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  }

  if (loading) {
    return <div className="text-center py-24 text-[#EDE3D0]/50 text-sm">Loading interactive stream...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Top Navigation Back */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="text-[#EDE3D0]/70 hover:text-[#D4AF37] hover:bg-[#B89045]/10 text-xs gap-2 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Chateau Dashboard
        </Button>
        <div className="flex items-center gap-2 text-xs text-[#D4AF37] bg-[#1a1410] border border-[#B89045]/30 px-3 py-1.5 rounded-xl">
          <Sparkles className="w-3.5 h-3.5" /> BuyScreen Spatial Engine Active
        </div>
      </div>

      {/* Main Video & Interactive Overlay Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Video Frame & Details (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="aspect-video bg-[#1a1410] border border-[#B89045]/30 rounded-2xl overflow-hidden relative shadow-2xl flex items-center justify-center">
            {episode?.video_url || episode?.vimeo_url ? (
              <iframe
                src={episode.video_url || episode.vimeo_url}
                title={episode?.title || "GlobeHouse Stream"}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="text-center space-y-3 p-6">
                <Film className="w-12 h-12 text-[#B89045]/40 mx-auto" />
                <p className="text-[#EDE3D0] font-medium text-sm">
                  {episode?.title ? `Stream source pending for "${episode.title}"` : "No episode stream available."}
                </p>
                <p className="text-xs text-[#EDE3D0]/50 max-w-sm mx-auto">
                  Add a valid video URL or Vimeo link in your Supabase episode record to enable full cinematic playback.
                </p>
              </div>
            )}
          </div>

          <div className="bg-[#1a1410] border border-[#B89045]/20 rounded-2xl p-6 space-y-3 shadow-lg">
            <h1 className="text-2xl font-display font-bold text-[#EDE3D0]">
              {episode?.title || "GlobeHouse Feature Presentation"}
            </h1>
            <p className="text-sm text-[#EDE3D0]/70 leading-relaxed">
              {episode?.description || episode?.summary || "Experience sovereign interactive television powered by seamless multi-tier streaming and BuyScreen object intelligence."}
            </p>
          </div>
        </div>

        {/* BuyScreen Interactive Hotspot Drawer (1 col) */}
        <div className="bg-[#1a1410] border border-[#B89045]/20 rounded-2xl p-6 flex flex-col space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-[#B89045]/20 pb-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#D4AF37]" />
              <h3 className="font-display font-bold text-[#EDE3D0] text-base">BuyScreen Hotspots</h3>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-[#B89045] bg-[#241c15] px-2 py-1 rounded-lg border border-[#B89045]/30">
              Live Mappings
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 max-h-[500px] pr-1">
            {products.length === 0 ? (
              <p className="text-xs text-[#EDE3D0]/50 text-center py-10">No interactive hotspots mapped to this frame yet.</p>
            ) : (
              products.map((product) => (
                <div
                  key={product.id}
                  onClick={() => setSelectedProduct(product)}
                  className="bg-[#241c15] border border-[#B89045]/20 hover:border-[#D4AF37] rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-all group"
                >
                  <div className="w-14 h-14 bg-[#120e0a] rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    ) : (
                      <ShoppingBag className="w-6 h-6 text-[#B89045]/40" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-display font-semibold text-xs text-[#EDE3D0] truncate group-hover:text-[#D4AF37]">{product.name}</h4>
                    <p className="text-[11px] text-[#D4AF37] font-semibold mt-0.5">{product.price || "Price on Request"}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );

