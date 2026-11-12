import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Plus, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { resolveFloors } from "../components/dashboard/floors";
import VideoLibraryCard from "../components/videos/VideoLibraryCard";

export default function Videos() {
  const queryClient = useQueryClient();

  const { data: episodes = [], isLoading } = useQuery({
    queryKey: ["episodes"],
    queryFn: () => base44.entities.Episode.list("-created_date"),
  });

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: settings = [] } = useQuery({
    queryKey: ["siteSettings"],
    queryFn: () => base44.entities.SiteSettings.list(),
  });
  const siteSettings = settings[0];
  const floors = resolveFloors(siteSettings?.floors_config, siteSettings?.row_labels);

  const urlParams = new URLSearchParams(window.location.search);
  const previewAsUser = urlParams.get("preview") === "user";
  const isAdmin = user?.role === "admin" && !previewAsUser;

  const assignFloorsMutation = useMutation({
    mutationFn: ({ id, assigned_floors }) =>
      base44.entities.Episode.update(id, { assigned_floors }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["episodes"] }),
  });

  const statusCounts = {
    published: episodes.filter(e => e.status === "published").length,
    draft: episodes.filter(e => e.status === "draft").length,
    archived: episodes.filter(e => e.status === "archived").length,
  };

  return (
    <div className="min-h-screen px-4 sm:px-6 py-10 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Video Library</h1>
          <p className="text-white/40">Manage all your episodes with portal triggers</p>
        </div>
        <Link to={createPageUrl("EpisodeEditor")}>
          <Button className="bg-violet-500 hover:bg-violet-600 rounded-xl h-11 gap-2">
            <Plus className="w-4 h-4" />
            Upload Video
          </Button>
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] border border-white/[0.06] rounded-xl">
          <span className="text-sm text-white/70">All</span>
          <span className="text-xs text-white/30">({episodes.length})</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 hover:bg-white/[0.02] border border-transparent rounded-xl cursor-pointer transition-colors">
          <span className="text-sm text-white/40">Published</span>
          <span className="text-xs text-white/20">({statusCounts.published})</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 hover:bg-white/[0.02] border border-transparent rounded-xl cursor-pointer transition-colors">
          <span className="text-sm text-white/40">Draft</span>
          <span className="text-xs text-white/20">({statusCounts.draft})</span>
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
      ) : episodes.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-violet-500/10 flex items-center justify-center">
            <Film className="w-8 h-8 text-violet-400" />
          </div>
          <h3 className="text-xl font-semibold text-white/80 mb-2">No videos yet</h3>
          <p className="text-white/30 mb-6">Upload your first video to start</p>
          <Link to={createPageUrl("EpisodeEditor")}>
            <Button className="bg-violet-500 hover:bg-violet-600 rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              Upload Video
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {episodes.map((episode, index) => (
            <VideoLibraryCard
              key={episode.id}
              episode={episode}
              index={index}
              floors={floors}
              isAdmin={isAdmin}
              onAssignFloors={(assigned_floors) =>
                assignFloorsMutation.mutate({ id: episode.id, assigned_floors })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}