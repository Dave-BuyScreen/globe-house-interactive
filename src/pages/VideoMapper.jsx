import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipBack, SkipForward, Crosshair, CheckCircle2, ArrowLeft, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import VideoCanvas from "../components/mapping/VideoCanvas";
import ObjectTagForm from "../components/mapping/ObjectTagForm";
import MappingTimeline from "../components/mapping/MappingTimeline";
import MappingObjectList from "../components/mapping/MappingObjectList";

export default function VideoMapper() {
  const urlParams = new URLSearchParams(window.location.search);
  const episodeId = urlParams.get("episodeId");

  const [isTagging, setIsTagging] = useState(false);
  const [pendingTag, setPendingTag] = useState(null); // { bbox, zone_h, zone_v, anchor_point }
  const [currentTime, setCurrentTime] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [selectedEpisode, setSelectedEpisode] = useState(null);

  const queryClient = useQueryClient();

  const { data: episode } = useQuery({
    queryKey: ["episode", episodeId],
    queryFn: () => base44.entities.Episode.filter({ id: episodeId }).then(r => r[0]),
    enabled: !!episodeId,
  });

  const { data: episodes = [] } = useQuery({
    queryKey: ["episodes"],
    queryFn: () => base44.entities.Episode.list("-created_date"),
    enabled: !episodeId,
  });

  const { data: mappings = [] } = useQuery({
    queryKey: ["videoMappings", episodeId || selectedEpisode?.id],
    queryFn: () => base44.entities.VideoObjectMapping.filter({ episode_id: episodeId || selectedEpisode?.id }),
    enabled: !!(episodeId || selectedEpisode?.id),
  });
  const activeEpisode = episode || selectedEpisode;

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.VideoObjectMapping.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["videoMappings"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.VideoObjectMapping.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["videoMappings"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.VideoObjectMapping.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["videoMappings"] }),
  });

  const handleObjectTagged = ({ bbox, zone_h, zone_v, anchor_point }) => {
    setIsPaused(true);
    setPendingTag({ bbox, zone_h, zone_v, anchor_point });
  };

  const handleSaveTag = (formData) => {
    createMutation.mutate({
      ...formData,
      episode_id: activeEpisode?.id,
    });
    setPendingTag(null);
    setIsTagging(false);
  };

  const handleConfirmAll = () => {
    mappings.filter(m => m.status !== "confirmed").forEach(m => {
      updateMutation.mutate({ id: m.id, data: { status: "confirmed" } });
    });
    setConfirmed(true);
  };

  const handleConfirmOne = (id) => {
    updateMutation.mutate({ id, data: { status: "confirmed" } });
  };

  const confirmedCount = mappings.filter(m => m.status === "confirmed").length;
  const totalCount = mappings.length;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <div className="border-b border-white/[0.06] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl("Dashboard")} className="text-white/40 hover:text-white/80 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-semibold text-white">
              {activeEpisode ? activeEpisode.title : "Video Object Mapper"}
            </h1>
            <p className="text-xs text-white/40">
              Spatial mapping workspace · {totalCount} object{totalCount !== 1 ? "s" : ""} tagged
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {totalCount > 0 && (
            <span className="text-xs text-white/40 mr-2">
              {confirmedCount}/{totalCount} confirmed
            </span>
          )}
          {totalCount > 0 && confirmedCount < totalCount && (
            <Button
              onClick={handleConfirmAll}
              className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/20 h-9 gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirm All
            </Button>
          )}
        </div>
      </div>

      {/* Episode selector if no episode in URL */}
      {!activeEpisode && (
        <div className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-xl font-semibold mb-6 text-white/80">Select an Episode to Map</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {episodes.map(ep => (
              <motion.div
                key={ep.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedEpisode(ep)}
                className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] rounded-xl p-4 cursor-pointer transition-colors"
              >
                {ep.thumbnail_url && (
                  <img src={ep.thumbnail_url} alt={ep.title} className="w-full aspect-video object-cover rounded-lg mb-3" />
                )}
                <h3 className="font-medium text-white text-sm">{ep.title}</h3>
                <p className="text-xs text-white/40 mt-1 capitalize">{ep.status}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Main workspace */}
      {activeEpisode && (
        <div className="flex flex-col lg:flex-row gap-0 h-[calc(100vh-65px)]">
          {/* Left: Video + Timeline */}
          <div className="flex-1 flex flex-col p-4 gap-4 overflow-auto">
            {/* Video canvas */}
            <div className="relative">
              <VideoCanvas
                vimeoUrl={activeEpisode.vimeo_url}
                mappings={mappings}
                onObjectTagged={handleObjectTagged}
                currentTime={currentTime}
                isTagging={isTagging && !pendingTag}
              />

              {/* Tag form overlay */}
              <AnimatePresence>
                {pendingTag && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute top-4 right-4 z-50"
                  >
                    <ObjectTagForm
                      bbox={pendingTag.bbox}
                      anchorPoint={pendingTag.anchor_point}
                      zoneH={pendingTag.zone_h}
                      zoneV={pendingTag.zone_v}
                      currentTime={currentTime}
                      videoDuration={300}
                      onSave={handleSaveTag}
                      onCancel={() => setPendingTag(null)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between bg-[#13131a] rounded-xl px-4 py-3 border border-white/[0.06]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentTime(t => Math.max(0, t - 5))}
                  className="p-2 rounded-lg hover:bg-white/[0.06] text-white/60 hover:text-white transition-colors"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsPaused(p => !p)}
                  className="p-2 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 transition-colors"
                >
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setCurrentTime(t => t + 5)}
                  className="p-2 rounded-lg hover:bg-white/[0.06] text-white/60 hover:text-white transition-colors"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono text-white/40 ml-2">t = {currentTime.toFixed(1)}s</span>
              </div>

              <button
                onClick={() => { setIsTagging(t => !t); setPendingTag(null); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isTagging
                    ? "bg-violet-500 text-white"
                    : "bg-white/[0.05] text-white/60 hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                <Crosshair className="w-4 h-4" />
                {isTagging ? "Tagging Mode ON" : "Enable Tagging"}
              </button>
            </div>

            {/* Timeline */}
            <MappingTimeline
              mappings={mappings}
              currentTime={currentTime}
              duration={300}
              onSeek={setCurrentTime}
            />

            {/* Zone Grid Reference */}
            <div className="bg-[#13131a] rounded-xl p-4 border border-white/[0.06]">
              <p className="text-xs text-white/40 mb-2">Semantic Zone Grid Reference</p>
              <div className="grid grid-cols-7 gap-0.5 text-center text-[10px]">
                {["FL","L","ML","M","MR","R","FR"].map(z => (
                  <div key={z} className="bg-violet-500/10 text-violet-300 rounded py-0.5">{z}</div>
                ))}
                {["HU","U","UC","C","BC","B","LB"].map(z => (
                  <div key={z} className="bg-fuchsia-500/10 text-fuchsia-300 rounded py-0.5">{z}</div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Object List */}
          <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-white/[0.06] p-4 flex flex-col gap-4 overflow-auto">
            <div>
              <h2 className="font-semibold text-white/80 text-sm mb-1">Tagged Objects</h2>
              <p className="text-xs text-white/30">
                Drag on the video to create a bounding box, then fill in the details.
              </p>
            </div>

            <MappingObjectList
              mappings={mappings}
              onDelete={(id) => deleteMutation.mutate(id)}
              onConfirm={handleConfirmOne}
            />

            {/* Confirm banner */}
            <AnimatePresence>
              {confirmed && confirmedCount === totalCount && totalCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center"
                >
                  <CheckCircle2 className="w-6 h-6 text-green-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-green-400">All mappings confirmed!</p>
                  <p className="text-xs text-white/40 mt-1">This video is now BuyScreen-enabled.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}