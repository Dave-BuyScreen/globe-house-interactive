import React from "react";
import VimeoWrapper from "./VimeoWrapper";
import YouTubeWrapper from "./YouTubeWrapper";
import DirectVideoWrapper from "./DirectVideoWrapper";

const isYouTubeUrl = (url) => {
  if (!url) return false;
  return /(?:youtube\.com|youtu\.be)/i.test(url);
};

const isVimeoUrl = (url) => {
  if (!url) return false;
  return /(?:vimeo\.com)/i.test(url);
};

const isDirectVideoFile = (url) => {
  if (!url) return false;
  return /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(url);
};

/**
 * Auto-detects the video source type from a URL and renders the
 * appropriate player: YouTube, Vimeo, or direct file (HTML5 video).
 */
export default function VideoSourcePlayer({
  vimeoUrl,
  youtubeUrl,
  triggers = [],
  onTrigger,
  onTimeUpdate,
  themeColor = "#8B5CF6",
  mappings = [],
}) {
  if (youtubeUrl && isYouTubeUrl(youtubeUrl)) {
    return (
      <YouTubeWrapper
        youtubeUrl={youtubeUrl}
        triggers={triggers}
        onTrigger={onTrigger}
        onTimeUpdate={onTimeUpdate}
        themeColor={themeColor}
        mappings={mappings}
      />
    );
  }

  if (vimeoUrl) {
    if (isDirectVideoFile(vimeoUrl)) {
      return (
        <DirectVideoWrapper
          videoUrl={vimeoUrl}
          triggers={triggers}
          onTrigger={onTrigger}
          onTimeUpdate={onTimeUpdate}
          themeColor={themeColor}
          mappings={mappings}
        />
      );
    }
    if (isVimeoUrl(vimeoUrl)) {
      return (
        <VimeoWrapper
          vimeoUrl={vimeoUrl}
          triggers={triggers}
          onTrigger={onTrigger}
          onTimeUpdate={onTimeUpdate}
          themeColor={themeColor}
          mappings={mappings}
        />
      );
    }
  }

  return (
    <div className="bg-[#13131a] border border-white/[0.06] rounded-2xl p-8 text-center">
      <p className="text-white/40 text-sm">No video URL configured</p>
      <p className="text-white/20 text-xs mt-1">Add a Vimeo, YouTube, or direct video URL in the editor</p>
    </div>
  );
}