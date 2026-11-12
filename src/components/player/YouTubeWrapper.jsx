import React, { useRef, useEffect, useState, useCallback } from "react";
import { useVideoTriggers } from "@/hooks/useVideoTriggers";
import VideoPlayerShell from "./VideoPlayerShell";

const getYouTubeId = (url) => {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
    /(?:youtube\.com\/shorts\/)([\w-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

let apiLoadingPromise = null;
const loadYouTubeAPI = () => {
  if (window.YT && window.YT.Player) return Promise.resolve();
  if (apiLoadingPromise) return apiLoadingPromise;
  apiLoadingPromise = new Promise((resolve) => {
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }
    const check = () => {
      if (window.YT && window.YT.Player) resolve();
      else setTimeout(check, 100);
    };
    check();
  });
  return apiLoadingPromise;
};

export default function YouTubeWrapper({
  youtubeUrl,
  triggers = [],
  onTrigger,
  onTimeUpdate,
  themeColor = "#8B5CF6",
  mappings = [],
}) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const youtubeId = getYouTubeId(youtubeUrl);

  useEffect(() => {
    onTimeUpdateRef.current = onTimeUpdate;
  });

  useEffect(() => {
    if (!youtubeId || !containerRef.current) return;
    let interval;
    let destroyed = false;

    loadYouTubeAPI().then(() => {
      if (destroyed || !containerRef.current) return;
      const container = containerRef.current;
      container.innerHTML = "";
      const playerDiv = document.createElement("div");
      playerDiv.className = "w-full h-full";
      container.appendChild(playerDiv);

      playerRef.current = new window.YT.Player(playerDiv, {
        videoId: youtubeId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          modestbranding: 1,
          rel: 0,
          origin: window.location.origin,
        },
        events: {
          onStateChange: (e) => {
            // 1 = playing, 2 = paused, 0 = ended
            if (e.data === 1) setIsPaused(false);
            if (e.data === 2) setIsPaused(true);
          },
        },
      });

      interval = setInterval(() => {
        const p = playerRef.current;
        if (p && p.getCurrentTime) {
          const time = p.getCurrentTime();
          setCurrentTime(time);
          if (onTimeUpdateRef.current) onTimeUpdateRef.current(time);
        }
      }, 250);
    });

    return () => {
      destroyed = true;
      if (interval) clearInterval(interval);
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // ignore
        }
        playerRef.current = null;
      }
    };
  }, [youtubeId]);

  const { activeTrigger, setActiveTrigger } = useVideoTriggers({
    triggers,
    currentTime,
    isPaused,
  });

  const handlePromptClick = () => {
    playerRef.current?.pauseVideo();
    setIsPaused(true);
    if (onTrigger) onTrigger(activeTrigger);
    setActiveTrigger(null);
  };

  const resumeVideo = useCallback(() => {
    playerRef.current?.playVideo();
    setIsPaused(false);
  }, []);

  const pauseVideo = useCallback(() => {
    playerRef.current?.pauseVideo();
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
      <div className="absolute top-0 left-0 w-full h-full">
        <div ref={containerRef} className="w-full h-full" />
      </div>
    </VideoPlayerShell>
  );
}