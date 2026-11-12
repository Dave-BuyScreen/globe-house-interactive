import React, { useRef } from "react";

export default function MappingTimeline({ mappings, currentTime, duration, onSeek }) {
  const timelineRef = useRef(null);

  const handleClick = (e) => {
    if (!duration) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const t = (x / rect.width) * duration;
    onSeek(Math.max(0, Math.min(duration, t)));
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-[#13131a] rounded-xl p-4 border border-white/[0.06]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-white/40">Timeline</span>
        <span className="text-xs font-mono text-violet-400">{formatTime(currentTime)}</span>
      </div>

      {/* Track */}
      <div
        ref={timelineRef}
        className="relative h-8 bg-white/[0.04] rounded-lg cursor-pointer overflow-hidden"
        onClick={handleClick}
      >
        {/* Object ranges */}
        {duration > 0 && mappings.map((obj, i) => (
          <div
            key={obj.id || i}
            className="absolute top-1 h-6 rounded opacity-70 hover:opacity-100 transition-opacity"
            style={{
              left: `${(obj.start_time / duration) * 100}%`,
              width: `${((obj.end_time - obj.start_time) / duration) * 100}%`,
              backgroundColor: `hsl(${(i * 47 + 260) % 360}, 70%, 60%)`,
              minWidth: 4,
            }}
            title={`${obj.label}: ${obj.start_time}s – ${obj.end_time}s`}
          />
        ))}

        {/* Playhead */}
        {duration > 0 && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white z-10 pointer-events-none"
            style={{ left: `${(currentTime / duration) * 100}%` }}
          />
        )}
      </div>

      {/* Legend */}
      {mappings.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {mappings.map((obj, i) => (
            <span
              key={obj.id || i}
              className="flex items-center gap-1 text-xs text-white/60"
            >
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: `hsl(${(i * 47 + 260) % 360}, 70%, 60%)` }}
              />
              {obj.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}