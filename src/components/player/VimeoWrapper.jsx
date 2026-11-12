import React, { useRef, useEffect, useState, useCallback } from "react";
import { useVideoTriggers } from "@/hooks/useVideoTriggers";
import VideoPlayerShell from "./VideoPlayerShell";

export default function VimeoWrapper({
  vimeoUrl,
  triggers = [],
  onTrigger,
  onTimeUpdate,
  themeColor = "#8B5CF6",
  mappings = [],
}) {
  const iframeRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const getVimeoId = (url) => {
    if (!url) return null;
    // Handle player.vimeo.com/video/ID, vimeo.com/ID, vimeo.com/channels/xxx/ID, embed URLs
    const patterns = [
      /player\.vimeo\.com\/video\/(\d+)/,
      /vimeo\.com\/(?:channels\/[\w]+\/)?(\d+)/,
      /vimeo\.com\/(\d+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    // If it's purely numeric, assume it's already an ID
    if (/^\d+$/.test(url.trim())) return url.trim();
    return null;
  };
  const vimeoId = getVimeoId(vimeoUrl);

  const postMessage = useCallback((method, value) => {
    if (iframeRef.current?.contentWindow) {
      const data = { method };
      if (value !== undefined) data.value = value;
      iframeRef.current.contentWindow.postMessage(JSON.stringify(data), "*");
    }
  }, []);

  useEffect(() => {
    const handleMessage = (event) => {
      let data;
      try {
        data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      } catch {
        return;
      }
      if (data.event === "playProgress" || data.method === "playProgress") {
        const seconds = data.data?.seconds || 0;
        setCurrentTime(seconds);
        if (onTimeUpdate) onTimeUpdate(seconds);
      }
    };

    window.addEventListener("message", handleMessage);
    const timer = setTimeout(() => postMessage("addEventListener", "playProgress"), 2000);

    return () => {
      window.removeEventListener("message", handleMessage);
      clearTimeout(timer);
    };
  }, [postMessage, onTimeUpdate]);

  const { activeTrigger, setActiveTrigger } = useVideoTriggers({
    triggers,
    currentTime,
    isPaused,
  });

  const handlePromptClick = () => {
    postMessage("pause");
    setIsPaused(true);
    if (onTrigger) onTrigger(activeTrigger);
    setActiveTrigger(null);
  };

  const resumeVideo = useCallback(() => {
    postMessage("play");
    setIsPaused(false);
  }, [postMessage]);

  const pauseVideo = useCallback(() => {
    postMessage("pause");
    setIsPaused(true);
  }, [postMessage]);

  useEffect(() => {
    window.__portalResumeVideo = resumeVideo;
    window.__portalPauseVideo = pauseVideo;
    return () => {
      delete window.__portalResumeVideo;
      delete window.__portalPauseVideo;
    };
  }, [resumeVideo, pauseVideo]);

  if (!vimeoId) {
    return (
      <div className="bg-[#13131a] border border-white/[0.06] rounded-2xl p-8 text-center">
        <p className="text-white/40 text-sm">Invalid Vimeo URL</p>
        <p className="text-white/20 text-xs mt-1">Expected: https://vimeo.com/123456789</p>
      </div>
    );
  }

  return (
    <VideoPlayerShell
      activeTrigger={activeTrigger}
      onPromptClick={handlePromptClick}
      isPaused={isPaused}
      themeColor={themeColor}
      mappings={mappings}
      currentTime={currentTime}
    >
      <iframe
        ref={iframeRef}
        src={`https://player.vimeo.com/video/${vimeoId}?api=1&player_id=vimeo-player&background=0&autopause=0&responsive=1`}
        className="absolute top-0 left-0 w-full h-full"
        frameBorder="0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        title="Vimeo Player"
      />
    </VideoPlayerShell>
  );
}