import React, { useRef, useState, useCallback, useEffect } from "react";
import { useVideoTriggers } from "@/hooks/useVideoTriggers";
import VideoPlayerShell from "./VideoPlayerShell";

/**
 * Plays direct video file URLs (mp4, webm, mov) — used when a video
 * is uploaded from local drive and stored as a raw file URL.
 */
export default function DirectVideoWrapper({
  videoUrl,
  triggers = [],
  onTrigger,
  onTimeUpdate,
  themeColor = "#8B5CF6",
  mappings = [],
}) {
  const videoRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPaused, setIsPaused] = useState(true);

  const handleTimeUpdate = () => {
    const time = videoRef.current?.currentTime || 0;
    setCurrentTime(time);
    if (onTimeUpdate) onTimeUpdate(time);
  };

  const { activeTrigger, setActiveTrigger } = useVideoTriggers({
    triggers,
    currentTime,
    isPaused,
  });

  const handlePromptClick = () => {
    videoRef.current?.pause();
    setIsPaused(true);
    if (onTrigger) onTrigger(activeTrigger);
    setActiveTrigger(null);
  };

  const resumeVideo = useCallback(() => {
    videoRef.current?.play();
    setIsPaused(false);
  }, []);

  const pauseVideo = useCallback(() => {
    videoRef.current?.pause();
    setIsPaused(true);
  }, []);

  useEffect(() => {
    window.__portalResumeVideo = resumeVideo;
    window.__portalPauseVideo = pauseVideo;
    return () => {
      delete window.__portalResumeVideo;
      delete window.__portalPauseVideo;
    };
  }, [resumeVideo, pauseVideo]);

  return (
    <VideoPlayerShell
      activeTrigger={activeTrigger}
      onPromptClick={handlePromptClick}
      isPaused={isPaused}
      themeColor={themeColor}
      mappings={mappings}
      currentTime={currentTime}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        className="absolute top-0 left-0 w-full h-full object-contain bg-black"
        controls
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPaused(false)}
        onPause={() => setIsPaused(true)}
      />
    </VideoPlayerShell>
  );
}