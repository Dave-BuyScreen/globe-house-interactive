import React, { useRef, useState, useCallback } from "react";
import { getZonesFromBoundingBox } from "./ZoneCalculator";

export default function VideoCanvas({ vimeoUrl, mappings, onObjectTagged, currentTime, isTagging }) {
  const containerRef = useRef(null);
  const [dragging, setDragging] = useState(null); // {startX, startY}
  const [pendingBox, setPendingBox] = useState(null);

  const getRelativeCoords = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height,
    };
  };

  const handlePointerDown = useCallback((e) => {
    if (!isTagging) return;
    e.preventDefault();
    const pos = getRelativeCoords(e);
    setDragging(pos);
    setPendingBox(null);
  }, [isTagging]);

  const handlePointerMove = useCallback((e) => {
    if (!dragging || !isTagging) return;
    e.preventDefault();
    const pos = getRelativeCoords(e);
    setPendingBox({
      x: Math.min(dragging.x, pos.x),
      y: Math.min(dragging.y, pos.y),
      width: Math.abs(pos.x - dragging.x),
      height: Math.abs(pos.y - dragging.y),
    });
  }, [dragging, isTagging]);

  const handlePointerUp = useCallback((e) => {
    if (!dragging || !isTagging) return;
    e.preventDefault();
    const box = pendingBox;
    setDragging(null);
    setPendingBox(null);

    if (!box || box.width < 0.02 || box.height < 0.02) return;

    const zones = getZonesFromBoundingBox(box);
    onObjectTagged({ bbox: box, ...zones });
  }, [dragging, pendingBox, isTagging, onObjectTagged]);

  // Extract Vimeo video ID
  const vimeoId = vimeoUrl?.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/)?.[1];
  const embedSrc = vimeoId
    ? `https://player.vimeo.com/video/${vimeoId}?badge=0&autopause=0&player_id=0&app_id=58479&controls=1`
    : null;

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black rounded-xl overflow-hidden select-none"
      style={{ aspectRatio: "16/9", cursor: isTagging ? "crosshair" : "default" }}
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
    >
      {/* Video */}
      {embedSrc ? (
        <iframe
          src={embedSrc}
          className="absolute inset-0 w-full h-full pointer-events-none"
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          title="Video"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-white/30 text-sm">
          No video URL
        </div>
      )}

      {/* Existing mappings overlay */}
      {mappings.map((obj, i) => {
        const bb = obj.bounding_box;
        if (!bb) return null;
        const isActive = currentTime >= obj.start_time && currentTime <= obj.end_time;
        return (
          <div
            key={obj.id || i}
            className="absolute pointer-events-none transition-opacity duration-200"
            style={{
              left: `${bb.x * 100}%`,
              top: `${bb.y * 100}%`,
              width: `${bb.width * 100}%`,
              height: `${bb.height * 100}%`,
              border: isActive ? "2px solid #a78bfa" : "1px dashed rgba(167,139,250,0.3)",
              borderRadius: 4,
              boxShadow: isActive ? "0 0 12px rgba(167,139,250,0.5)" : "none",
              opacity: isActive ? 1 : 0.4,
            }}
          >
            <span className="absolute -top-5 left-0 text-[10px] bg-violet-500/80 text-white px-1.5 py-0.5 rounded whitespace-nowrap">
              {obj.label}
            </span>
            {/* Anchor dot */}
            {obj.anchor_point && (
              <div
                className="absolute w-2 h-2 bg-violet-400 rounded-full -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${((obj.anchor_point.x - bb.x) / bb.width) * 100}%`,
                  top: `${((obj.anchor_point.y - bb.y) / bb.height) * 100}%`,
                }}
              />
            )}
          </div>
        );
      })}

      {/* Pending drag box */}
      {pendingBox && (
        <div
          className="absolute pointer-events-none border-2 border-dashed border-violet-400 bg-violet-400/10"
          style={{
            left: `${pendingBox.x * 100}%`,
            top: `${pendingBox.y * 100}%`,
            width: `${pendingBox.width * 100}%`,
            height: `${pendingBox.height * 100}%`,
            borderRadius: 4,
          }}
        />
      )}

      {/* Tagging hint */}
      {isTagging && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/70 text-white/80 text-xs px-3 py-1.5 rounded-full pointer-events-none">
          Drag to draw a bounding box around an object
        </div>
      )}
    </div>
  );
}