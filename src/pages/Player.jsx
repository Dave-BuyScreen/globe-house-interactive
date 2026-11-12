import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { ArrowLeft, Settings, Layers, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import PlayerExperience from "../components/player/PlayerExperience";

export default function Player() {
  const urlParams = new URLSearchParams(window.location.search);
  const episodeId = urlParams.get("id");

  const { data: episodes, isLoading } = useQuery({
    queryKey: ["episode", episodeId],
    queryFn: () => base44.entities.Episode.filter({ id: episodeId }),
    enabled: !!episodeId,
  });

  const episode = episodes?.[0];

  if (isLoading) {
    return (
      <div className="min-h-screen px-4 sm:px-6 py-10 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-48 bg-white/[0.04] mb-6" />
        <Skeleton className="aspect-video w-full bg-white/[0.04] rounded-2xl" />
      </div>
    );
  }

  if (!episode) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/40 mb-4">Episode not found</p>
          <Link to={createPageUrl("Dashboard")}>
            <Button variant="outline" className="border-white/10 text-white/60">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const triggerCount = episode.triggers?.length || 0;
  const productCount = episode.triggers?.filter(t => t.product_name)?.length || 0;

  return (
    <div className="min-h-screen px-4 sm:px-6 py-8 max-w-5xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to={episode.platform === "buyscreen" ? createPageUrl("Marketplace") : createPageUrl("Dashboard")}>
            <Button variant="ghost" size="icon" className="text-white/40 hover:text-white hover:bg-white/[0.06] rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">{episode.title}</h1>
            <div className="flex items-center gap-3 mt-1">
              <Badge className={`text-[10px] border-0 ${
                episode.status === "published" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
              }`}>
                {episode.status}
              </Badge>
              {triggerCount > 0 && (
                <span className="flex items-center gap-1 text-xs text-white/30">
                  <Layers className="w-3 h-3" /> {triggerCount} triggers
                </span>
              )}
              {productCount > 0 && (
                <span className="flex items-center gap-1 text-xs text-white/30">
                  <ShoppingBag className="w-3 h-3" /> {productCount} products
                </span>
              )}
            </div>
          </div>
        </div>

        <Link to={createPageUrl(`EpisodeEditor?id=${episode.id}`)}>
          <Button variant="outline" size="sm" className="border-white/10 text-white/50 hover:text-white hover:bg-white/[0.06] rounded-xl gap-2">
            <Settings className="w-4 h-4" />
            Edit
          </Button>
        </Link>
      </div>

      {/* Player with all overlays */}
      <PlayerExperience episode={episode} />

      {/* Trigger timeline */}
      {triggerCount > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-medium text-white/40 mb-4">Trigger Timeline</h3>
          <div className="space-y-2">
            {episode.triggers.map((trigger, i) => {
              const m = Math.floor((trigger.timestamp || 0) / 60);
              const s = Math.floor((trigger.timestamp || 0) % 60);
              return (
                <div key={i} className="flex items-center gap-4 p-3 bg-[#13131a] rounded-xl border border-white/[0.06]">
                  <div className="w-16 text-center">
                    <span className="text-sm font-mono text-white/50">{m}:{s.toString().padStart(2, "0")}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/70 truncate">{trigger.prompt_text}</p>
                  </div>
                  <div className="flex gap-2">
                    {trigger.confessional_video_url && (
                      <Badge className="bg-violet-500/10 text-violet-400 border-0 text-[10px]">Confessional</Badge>
                    )}
                    {trigger.product_name && (
                      <Badge className="bg-amber-500/10 text-amber-400 border-0 text-[10px]">{trigger.product_name}</Badge>
                    )}
                    {trigger.model_url && (
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-0 text-[10px]">AR</Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}