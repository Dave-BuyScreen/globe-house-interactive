import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { motion } from "framer-motion";
import { Play, Settings, Layers, ShoppingBag, Bookmark, Trash2, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import TriggerManager from "../triggers/TriggerManager";

// ratio: "poster" (2:3) | "landscape" (16:9)
export default function EpisodeCard({ episode, index, ratio = "landscape" }) {
  const [showTriggerManager, setShowTriggerManager] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: savedEpisodes = [] } = useQuery({
    queryKey: ["savedEpisodes"],
    queryFn: () => base44.entities.SavedEpisode.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const isSaved = savedEpisodes.some(s => s.episode_id === episode.id);

  const toggleSaveMutation = useMutation({
    mutationFn: async () => {
      if (isSaved) {
        const saved = savedEpisodes.find(s => s.episode_id === episode.id);
        if (saved) await base44.entities.SavedEpisode.delete(saved.id);
      } else {
        await base44.entities.SavedEpisode.create({ user_email: user.email, episode_id: episode.id });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["savedEpisodes"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Episode.delete(episode.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["episodes"] }),
  });

  const triggerCount = episode.triggers?.length || 0;
  const productCount = episode.triggers?.filter(t => t.product_name)?.length || 0;
  const themeColor = episode.theme_color || "#8B5CF6";

  const isPoster = ratio === "poster";
  const aspectClass = isPoster ? "aspect-[2/3]" : "aspect-video";
  const cardWidth = isPoster ? "w-[160px] sm:w-[190px]" : "w-[260px] sm:w-[300px]";

  return (
    <>
      <TriggerManager
        episodeId={episode.id}
        isOpen={showTriggerManager}
        onClose={() => setShowTriggerManager(false)}
      />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.06, duration: 0.35 }}
        className={`flex-shrink-0 ${cardWidth}`}
      >
        <Link to={createPageUrl(`Player?id=${episode.id}`)} className="block group">
          <div className={`relative overflow-hidden transition-all duration-300 ${isPoster ? "bg-[#1a1410] rounded-lg border border-[#B89045]/30 hover:border-[#D4AF37]/70 shadow-lg shadow-black/40" : "bg-[#13131a] rounded-xl border border-white/[0.06] hover:border-white/[0.14]"}`}>
            {/* Thumbnail */}
            <div className={`${aspectClass} bg-gradient-to-br from-[#1c1c28] to-[#0f0f17] relative overflow-hidden`}>
              {episode.thumbnail_url ? (
                <img
                  src={episode.thumbnail_url}
                  alt={episode.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${themeColor}18` }}>
                    <Play className="w-5 h-5" style={{ color: themeColor }} />
                  </div>
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <Play className="w-5 h-5 text-white ml-0.5" />
                </div>
              </div>

              {/* Bookmark */}
              <div className="absolute top-2 left-2 z-10">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => { e.preventDefault(); toggleSaveMutation.mutate(); }}
                  className={`rounded-full w-7 h-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity ${
                    isSaved ? "bg-violet-500 hover:bg-violet-600" : "bg-black/50 hover:bg-black/70"
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "fill-white text-white" : "text-white"}`} />
                </Button>
              </div>

              {/* Status dot */}
              <div className="absolute top-2 right-2">
                <div className={`w-2 h-2 rounded-full ${
                  episode.status === "published" ? "bg-emerald-400" :
                  episode.status === "archived" ? "bg-white/30" : "bg-amber-400"
                }`} />
              </div>

              {/* Stats overlay on poster (bottom) - subtle icons on hover */}
              {isPoster && (triggerCount > 0 || productCount > 0) && (
                <div className="absolute bottom-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <TooltipProvider delayDuration={100}>
                    {triggerCount > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-0.5 bg-black/60 backdrop-blur-sm rounded-full px-1.5 py-0.5 text-[9px] text-white/70 hover:text-violet-300 transition-colors cursor-default">
                            <Zap className="w-2.5 h-2.5" />
                            <span>{triggerCount}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          {triggerCount} Trigger{triggerCount !== 1 ? "s" : ""}
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {productCount > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-0.5 bg-black/60 backdrop-blur-sm rounded-full px-1.5 py-0.5 text-[9px] text-white/70 hover:text-fuchsia-300 transition-colors cursor-default">
                            <ShoppingBag className="w-2.5 h-2.5" />
                            <span>{productCount}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          {productCount} Product{productCount !== 1 ? "s" : ""}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </TooltipProvider>
                </div>
              )}
            </div>

            {/* Info footer */}
            <div className="px-3 py-2.5 space-y-1.5">
              <h3 className={`text-xs truncate leading-tight ${isPoster ? "font-medium text-[#EDE3D0]" : "font-medium text-white/90"}`}>{episode.title}</h3>

              {/* Stats row for landscape */}
              {!isPoster && (triggerCount > 0 || productCount > 0) && (
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <TooltipProvider delayDuration={100}>
                    {triggerCount > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-0.5 bg-black/40 rounded-full px-1.5 py-0.5 text-[9px] text-white/60 hover:text-violet-400 transition-colors cursor-default">
                            <Zap className="w-2.5 h-2.5" />
                            <span>{triggerCount}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          {triggerCount} Trigger{triggerCount !== 1 ? "s" : ""}
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {productCount > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-0.5 bg-black/40 rounded-full px-1.5 py-0.5 text-[9px] text-white/60 hover:text-fuchsia-400 transition-colors cursor-default">
                            <ShoppingBag className="w-2.5 h-2.5" />
                            <span>{productCount}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          {productCount} Product{productCount !== 1 ? "s" : ""}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </TooltipProvider>
                </div>
              )}


            </div>
          </div>
        </Link>
      </motion.div>
    </>
  );
}