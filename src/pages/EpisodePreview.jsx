import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play } from "lucide-react";
import VideoSourcePlayer from "../components/player/VideoSourcePlayer";
import PortalOverlay from "../components/portal/PortalOverlay";
import ConfessionalPanel from "../components/portal/ConfessionalPanel";
import BuyScreenPanel from "../components/portal/BuyScreenPanel";

export default function EpisodePreview() {
  const urlParams = new URLSearchParams(window.location.search);
  const episodeId = urlParams.get("id");

  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTrigger, setActiveTrigger] = useState(null);
  const [showPortal, setShowPortal] = useState(false);
  const [portalChoice, setPortalChoice] = useState(null);

  const { data: episodes = [] } = useQuery({
    queryKey: ["episode", episodeId],
    queryFn: () => base44.entities.Episode.filter({ id: episodeId }),
    enabled: !!episodeId,
  });

  const episode = episodes[0];

  // Check for active triggers based on current time
  useEffect(() => {
    if (!episode?.triggers || !isPlaying) return;

    const trigger = episode.triggers.find(t => {
      const triggerStart = t.timestamp;
      const triggerEnd = triggerStart + (t.duration || 5);
      return currentTime >= triggerStart && currentTime < triggerEnd;
    });

    if (trigger && trigger !== activeTrigger) {
      setActiveTrigger(trigger);
      setShowPortal(true);
      setIsPlaying(false); // Pause video when trigger appears
    }
  }, [currentTime, episode, isPlaying]);

  const handlePortalChoice = (choice) => {
    setPortalChoice(choice);
  };

  const handleClosePortal = () => {
    setShowPortal(false);
    setPortalChoice(null);
    setActiveTrigger(null);
    setIsPlaying(true); // Resume video
  };

  const handleTimeUpdate = (time) => {
    setCurrentTime(time);
  };

  const handlePlayStateChange = (playing) => {
    setIsPlaying(playing);
  };

  if (!episode) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/60">Episode not found</p>
          <Link to={createPageUrl("Dashboard")} className="text-violet-400 hover:text-violet-300 text-sm mt-2 inline-block">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <div className="border-b border-white/[0.06] bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to={createPageUrl("Dashboard")}>
                <Button variant="ghost" size="icon" className="text-white/40 hover:text-white">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-white">Preview Mode</h1>
                <p className="text-sm text-white/40">{episode.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 bg-amber-500/20 border border-amber-500/30 rounded-lg">
                <p className="text-xs font-medium text-amber-300">Testing Experience</p>
              </div>
              {episode.triggers && episode.triggers.length > 0 && (
                <div className="px-3 py-1.5 bg-violet-500/20 border border-violet-500/30 rounded-lg">
                  <p className="text-xs font-medium text-violet-300">
                    {episode.triggers.length} Trigger{episode.triggers.length > 1 ? 's' : ''} Active
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Video Player */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="relative">
          <VideoSourcePlayer
            vimeoUrl={episode.vimeo_url}
            youtubeUrl={episode.youtube_url}
            onTimeUpdate={handleTimeUpdate}
          />

          {/* Bounding Box Overlay */}
          {activeTrigger?.bounding_box && showPortal && (
            <div
              className="absolute border-2 border-violet-500 bg-violet-500/20 rounded-lg pointer-events-none animate-pulse"
              style={{
                left: `${activeTrigger.bounding_box.x}%`,
                top: `${activeTrigger.bounding_box.y}%`,
                width: `${activeTrigger.bounding_box.width}%`,
                height: `${activeTrigger.bounding_box.height}%`,
              }}
            />
          )}

          {/* Portal Overlay */}
          {showPortal && activeTrigger && (
            <PortalOverlay
              trigger={activeTrigger}
              onClose={handleClosePortal}
              onChoice={handlePortalChoice}
            />
          )}

          {/* Confessional Panel */}
          {portalChoice === "confessional" && activeTrigger && (
            <ConfessionalPanel
              trigger={activeTrigger}
              onClose={() => {
                setPortalChoice(null);
                setShowPortal(false);
                setIsPlaying(true);
              }}
              onContinueToBuyScreen={() => setPortalChoice("buyscreen")}
            />
          )}

          {/* BuyScreen Panel */}
          {portalChoice === "buyscreen" && activeTrigger && (
            <BuyScreenPanel
              trigger={activeTrigger}
              episodeId={episode.id}
              onClose={handleClosePortal}
            />
          )}
        </div>

        {/* Trigger Timeline */}
        {episode.triggers && episode.triggers.length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-medium text-white/60 mb-3">Trigger Timeline</h3>
            <div className="bg-[#13131a] border border-white/[0.06] rounded-xl p-4">
              <div className="relative h-12 bg-white/[0.04] rounded-lg overflow-hidden">
                {/* Current time indicator */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-violet-500 z-10"
                  style={{ left: `${(currentTime / 180) * 100}%` }}
                >
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-violet-500 rounded-full" />
                </div>

                {/* Trigger markers */}
                {episode.triggers.map((trigger, idx) => {
                  const position = (trigger.timestamp / 180) * 100;
                  const isActive = activeTrigger === trigger;
                  
                  return (
                    <div
                      key={idx}
                      className={`absolute top-0 bottom-0 transition-all ${
                        isActive ? 'bg-violet-500/40 border-l-2 border-violet-500' : 'bg-white/10 border-l border-white/20'
                      }`}
                      style={{
                        left: `${position}%`,
                        width: '2px',
                      }}
                      title={`${trigger.product_name || 'Trigger'} @ ${Math.floor(trigger.timestamp)}s`}
                    >
                      <div className={`absolute top-1/2 left-1 -translate-y-1/2 text-xs whitespace-nowrap ${
                        isActive ? 'text-violet-300 font-medium' : 'text-white/40'
                      }`}>
                        {Math.floor(trigger.timestamp)}s
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {episode.triggers.map((trigger, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded-lg border text-xs ${
                      activeTrigger === trigger
                        ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                        : 'bg-white/[0.03] border-white/[0.06] text-white/60'
                    }`}
                  >
                    <div className="font-medium truncate">
                      {trigger.product_name || `Trigger ${idx + 1}`}
                    </div>
                    <div className="text-white/40 mt-0.5">
                      {Math.floor(trigger.timestamp / 60)}:{(trigger.timestamp % 60).toFixed(0).padStart(2, '0')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 bg-[#13131a] border border-white/[0.06] rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
              <Play className="w-4 h-4 text-violet-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-white/90 mb-1">Preview Instructions</h3>
              <ul className="text-xs text-white/50 space-y-1">
                <li>• Video will pause when a trigger timestamp is reached</li>
                <li>• Interactive overlays appear exactly as users will see them</li>
                <li>• Bounding boxes highlight product locations when configured</li>
                <li>• Test all trigger interactions before publishing</li>
                <li>• Current time is tracked in the timeline below</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}