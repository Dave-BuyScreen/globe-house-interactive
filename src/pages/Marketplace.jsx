import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useSearchParams } from "react-router-dom";
import { Search, Store, ShoppingBag, Film } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import EpisodeCard from "../components/dashboard/EpisodeCard";

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "wellness", label: "Wellness" },
  { key: "home", label: "Home" },
  { key: "beauty", label: "Beauty" },
  { key: "kitchen", label: "Kitchen" },
  { key: "fashion", label: "Fashion" },
  { key: "facilities", label: "Facilities" },
];

export default function Marketplace() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCat = searchParams.get("category") || "all";
  const [activeCategory, setActiveCategory] = useState(initialCat);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: episodes = [], isLoading } = useQuery({
    queryKey: ["marketplaceEpisodes"],
    queryFn: () => base44.entities.Episode.filter(
      { platform: "buyscreen", status: "published" },
      "-created_date",
      100
    ),
  });

  const categoryCounts = useMemo(() => {
    const counts = { all: episodes.length };
    CATEGORIES.slice(1).forEach((cat) => {
      counts[cat.key] = episodes.filter((e) => e.marketplace_category === cat.key).length;
    });
    return counts;
  }, [episodes]);

  const filteredEpisodes = useMemo(() => {
    let result = episodes;
    if (activeCategory !== "all") {
      result = result.filter((e) => e.marketplace_category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.title?.toLowerCase().includes(q) ||
          e.summary?.toLowerCase().includes(q) ||
          e.keywords?.some((k) => k.toLowerCase().includes(q))
      );
    }
    return result;
  }, [episodes, activeCategory, searchQuery]);

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    if (cat === "all") {
      searchParams.delete("category");
    } else {
      searchParams.set("category", cat);
    }
    setSearchParams(searchParams, { replace: true });
  };

  return (
    <div className="min-h-screen px-4 sm:px-6 py-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
            <Store className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">BuyScreen Marketplace</h1>
            <p className="text-white/40 text-sm">Shoppable videos — click to watch and shop in real time</p>
          </div>
        </div>
        <Link to={createPageUrl("EpisodeEditor")}>
          <Button className="bg-emerald-500 hover:bg-emerald-600 rounded-xl h-11 gap-2">
            <Film className="w-4 h-4" />
            Upload Video
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search videos, titles, keywords..."
          className="h-11 pl-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30"
        />
      </div>

      {/* Category Navigation Bar — sticky below main nav */}
      <div className="sticky top-16 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 mb-8 bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => handleCategoryChange(cat.key)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-emerald-500 text-white border border-emerald-400 shadow-lg shadow-emerald-500/20"
                    : "bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-white hover:bg-white/[0.08]"
                }`}
              >
                {cat.label}
                <span className={`text-xs ${isActive ? "text-white/70" : "text-white/25"}`}>
                  ({categoryCounts[cat.key] || 0})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-[#13131a] rounded-2xl overflow-hidden">
              <Skeleton className="aspect-video bg-white/[0.04]" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-4 w-2/3 bg-white/[0.04]" />
                <Skeleton className="h-3 w-1/3 bg-white/[0.04]" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredEpisodes.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-emerald-500/10 flex items-center justify-center">
            <ShoppingBag className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-xl font-semibold text-white/80 mb-2">
            {searchQuery ? "No videos found" : `No ${activeCategory !== "all" ? activeCategory : ""} videos yet`}
          </h3>
          <p className="text-white/30 mb-6">Upload your first shoppable video to the marketplace</p>
          <Link to={createPageUrl("EpisodeEditor")}>
            <Button className="bg-emerald-500 hover:bg-emerald-600 rounded-xl">
              <Film className="w-4 h-4 mr-2" />
              Upload Video
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-wrap gap-5">
          {filteredEpisodes.map((episode, index) => (
            <EpisodeCard key={episode.id} episode={episode} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}