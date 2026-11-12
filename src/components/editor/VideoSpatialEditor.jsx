import React, { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Pause, Play, Target, Save, Trash2, Info, Move, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * VideoSpatialEditor
 * Full-screen overlay modal with embedded Vimeo player.
 * User pauses the video then draws/drags a bounding box over the target object.
 * On save, populates both:
 *   - bounding_box: { x, y, width, height } as % of frame (0–100)
 *   - spatial_coordinates: { x, y, z, width, height } normalized (0–1)
 */
export default function VideoSpatialEditor({ vimeoUrl, trigger, triggerIndex, onSave, onClose }) {
  const iframeRef = useRef(null);
  const overlayRef = useRef(null);

  // Player state
  const [isPaused, setIsPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // Box drawing state
  const [drawMode, setDrawMode] = useState(false); // enabled after pause
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState(null);
  const [box, setBox] = useState(
    trigger?.bounding_box
      ? { ...trigger.bounding_box }
      : null
  );
  const [liveBox, setLiveBox] = useState(null); // box being drawn right now

  // Drag/resize existing box
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [interactStart, setInteractStart] = useState(null);

  // ─── Vimeo postMessage bridge ────────────────────────────────────────────
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
      try { data = typeof event.data === "string" ? JSON.parse(event.data) : event.data; }
      catch { return; }
      if (data.event === "playProgress") {
        setCurrentTime(data.data?.seconds || 0);
      }
      if (data.event === "pause") setIsPaused(true);
      if (data.event === "play") setIsPaused(false);
    };
    window.addEventListener("message", handleMessage);
    const t = setTimeout(() => {
      postMessage("addEventListener", "playProgress");
      postMessage("addEventListener", "pause");
      postMessage("addEventListener", "play");
      // Seek to trigger timestamp
      if (trigger?.timestamp) postMessage("seekTo", trigger.timestamp);
    }, 1500);
    return () => { window.removeEventListener("message", handleMessage); clearTimeout(t); };
  }, [postMessage, trigger?.timestamp]);

  const handlePause = () => { postMessage("pause"); setIsPaused(true); setDrawMode(true); };
  const handlePlay = () => { postMessage("play"); setIsPaused(false); setDrawMode(false); };

  // ─── Coordinate helpers ───────────────────────────────────────────────────
  const getPct = (e) => {
    const rect = overlayRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)),
    };
  };

  // ─── Draw new box ─────────────────────────────────────────────────────────
  const handleOverlayMouseDown = (e) => {
    if (!drawMode || isDragging || isResizing) return;
    if (e.target !== overlayRef.current) return; // only bare overlay
    e.preventDefault();
    const pct = getPct(e);
    setIsDrawing(true);
    setStartPos(pct);
    setLiveBox(null);
  };

  const handleOverlayMouseMove = useCallback((e) => {
    if (!overlayRef.current) return;

    // Drawing new box
    if (isDrawing && startPos) {
      const pct = getPct(e);
      setLiveBox({
        x: Math.min(startPos.x, pct.x),
        y: Math.min(startPos.y, pct.y),
        width: Math.abs(pct.x - startPos.x),
        height: Math.abs(pct.y - startPos.y),
      });
      return;
    }

    // Dragging existing box
    if (isDragging && interactStart && box) {
      const pct = getPct(e);
      const dx = pct.x - interactStart.x;
      const dy = pct.y - interactStart.y;
      setBox(prev => ({
        ...prev,
        x: Math.max(0, Math.min(100 - prev.width, prev.x + dx)),
        y: Math.max(0, Math.min(100 - prev.height, prev.y + dy)),
      }));
      setInteractStart(pct);
      return;
    }

    // Resizing existing box
    if (isResizing && interactStart && box) {
      const pct = getPct(e);
      const dx = pct.x - interactStart.x;
      const dy = pct.y - interactStart.y;
      setBox(prev => ({
        ...prev,
        width: Math.max(5, Math.min(100 - prev.x, prev.width + dx)),
        height: Math.max(5, Math.min(100 - prev.y, prev.height + dy)),
      }));
      setInteractStart(pct);
    }
  }, [isDrawing, startPos, isDragging, isResizing, interactStart, box]);

  const handleOverlayMouseUp = useCallback(() => {
    if (isDrawing && liveBox && liveBox.width > 2 && liveBox.height > 2) {
      setBox(liveBox);
    }
    setIsDrawing(false);
    setLiveBox(null);
    setStartPos(null);
    setIsDragging(false);
    setIsResizing(false);
    setInteractStart(null);
  }, [isDrawing, liveBox]);

  useEffect(() => {
    if (isDrawing || isDragging || isResizing) {
      window.addEventListener("mousemove", handleOverlayMouseMove);
      window.addEventListener("mouseup", handleOverlayMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleOverlayMouseMove);
        window.removeEventListener("mouseup", handleOverlayMouseUp);
      };
    }
  }, [isDrawing, isDragging, isResizing, handleOverlayMouseMove, handleOverlayMouseUp]);

  // Box interaction handles
  const startDrag = (e) => {
    if (!drawMode) return;
    e.preventDefault(); e.stopPropagation();
    setIsDragging(true);
    setInteractStart(getPct(e));
  };
  const startResize = (e) => {
    if (!drawMode) return;
    e.preventDefault(); e.stopPropagation();
    setIsResizing(true);
    setInteractStart(getPct(e));
  };

  // ─── Save ─────────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!box) return;
    const rounded = {
      x: Math.round(box.x * 10) / 10,
      y: Math.round(box.y * 10) / 10,
      width: Math.round(box.width * 10) / 10,
      height: Math.round(box.height * 10) / 10,
    };
    // spatial_coordinates: normalized center point (0–1) + normalized size
    const spatial = {
      x: Math.round(((rounded.x + rounded.width / 2) / 100) * 1000) / 1000,
      y: Math.round(((rounded.y + rounded.height / 2) / 100) * 1000) / 1000,
      z: 0.5, // depth unknown from 2D — default midpoint
      width: Math.round((rounded.width / 100) * 1000) / 1000,
      height: Math.round((rounded.height / 100) * 1000) / 1000,
    };
    onSave({ bounding_box: rounded, spatial_coordinates: spatial });
    onClose();
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    return `${m}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  };

  const activeBox = liveBox || box;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col"
    >
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <Target className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Spatial Bounding Box Editor</h2>
            <p className="text-xs text-white/30">
              Trigger {triggerIndex + 1}
              {trigger?.product_name ? ` · ${trigger.product_name}` : ""}
              {" · "}t={formatTime(trigger?.timestamp || 0)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {box && (
            <Button
              onClick={() => setBox(null)}
              variant="ghost"
              size="sm"
              className="text-red-400 hover:text-red-300 hover:bg-red-400/10 text-xs h-8 gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear Box
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={!box}
            size="sm"
            className="bg-violet-600 hover:bg-violet-500 text-white text-xs h-8 gap-1.5"
          >
            <Save className="w-3.5 h-3.5" /> Save & Apply to Scene DNA
          </Button>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Main Area ── */}
      <div className="flex flex-1 min-h-0 gap-6 px-6 py-5">

        {/* Video + Overlay */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* Controls bar */}
          <div className="flex items-center gap-3">
            {!isPaused ? (
              <Button onClick={handlePause} size="sm" className="bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs h-8 gap-1.5">
                <Pause className="w-3.5 h-3.5" /> Pause to Draw
              </Button>
            ) : (
              <Button onClick={handlePlay} size="sm" className="bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs h-8 gap-1.5">
                <Play className="w-3.5 h-3.5" /> Resume
              </Button>
            )}
            <span className="text-xs text-white/30 font-mono">{formatTime(currentTime)}</span>
            {drawMode && (
              <span className="ml-2 text-xs bg-violet-500/20 border border-violet-500/30 text-violet-300 px-2 py-1 rounded-full">
                ✏ Draw mode active — click and drag on video
              </span>
            )}
            {!drawMode && (
              <span className="text-xs text-white/25 flex items-center gap-1.5">
                <Info className="w-3 h-3" /> Pause the video first to draw a bounding box
              </span>
            )}
          </div>

          {/* Video frame + draw overlay */}
          <div className="relative flex-1 bg-black rounded-2xl overflow-hidden border border-white/[0.08]"
               style={{ maxHeight: "calc(100vh - 240px)" }}>
            {/* Vimeo iframe */}
            <iframe
              ref={iframeRef}
              src={`https://player.vimeo.com/video/${getVimeoId(vimeoUrl)}?api=1&player_id=spatial-editor&background=0&autopause=0&responsive=1`}
              className="absolute inset-0 w-full h-full"
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              title="Spatial Editor Player"
            />

            {/* Draw overlay — only shown when paused */}
            <AnimatePresence>
              {drawMode && (
                <motion.div
                  ref={overlayRef}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-20"
                  style={{ cursor: isDrawing ? "crosshair" : (isDragging ? "move" : "crosshair") }}
                  onMouseDown={handleOverlayMouseDown}
                >
                  {/* Semi-transparent capture layer */}
                  <div className="absolute inset-0 bg-black/20" />

                  {/* Existing / committed box */}
                  {box && !liveBox && (
                    <div
                      className="absolute group"
                      style={{
                        left: `${box.x}%`, top: `${box.y}%`,
                        width: `${box.width}%`, height: `${box.height}%`,
                        border: "2px solid #8B5CF6",
                        boxShadow: "0 0 0 1px rgba(0,0,0,0.4), 0 0 20px rgba(139,92,246,0.5)",
                        pointerEvents: "all",
                      }}
                      onMouseDown={startDrag}
                    >
                      {/* Corner label */}
                      <div className="absolute -top-6 left-0 bg-black/80 text-violet-300 text-[10px] font-mono px-2 py-0.5 rounded whitespace-nowrap pointer-events-none">
                        {box.x.toFixed(1)}, {box.y.toFixed(1)} · {box.width.toFixed(1)}×{box.height.toFixed(1)}
                      </div>

                      {/* Move handle */}
                      <div
                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: "rgba(139,92,246,0.1)" }}
                      >
                        <div className="w-8 h-8 rounded-full bg-violet-500/30 border border-violet-400/50 flex items-center justify-center">
                          <Move className="w-4 h-4 text-violet-300" />
                        </div>
                      </div>

                      {/* Resize handle — bottom-right */}
                      <div
                        className="absolute -bottom-2 -right-2 w-5 h-5 rounded-full bg-violet-500 border-2 border-white cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg"
                        onMouseDown={startResize}
                      >
                        <Maximize2 className="w-2.5 h-2.5 text-white" />
                      </div>

                      {/* All corner accents */}
                      {["-top-0.5 -left-0.5", "-top-0.5 -right-0.5", "-bottom-0.5 -left-0.5", "-bottom-0.5 -right-0.5"].map((pos, i) => (
                        <div key={i} className={`absolute ${pos} w-2.5 h-2.5 border-2 border-violet-400`}
                          style={{ background: "transparent" }} />
                      ))}
                    </div>
                  )}

                  {/* Live-drawing box */}
                  {liveBox && (
                    <div
                      className="absolute pointer-events-none"
                      style={{
                        left: `${liveBox.x}%`, top: `${liveBox.y}%`,
                        width: `${liveBox.width}%`, height: `${liveBox.height}%`,
                        border: "2px dashed #22C55E",
                        background: "rgba(34,197,94,0.08)",
                        boxShadow: "0 0 12px rgba(34,197,94,0.3)",
                      }}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Right Panel: coordinates + instructions ── */}
        <div className="w-64 shrink-0 flex flex-col gap-4">
          {/* Instructions */}
          <div className="bg-[#13131a] border border-white/[0.06] rounded-2xl p-4">
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">How to use</p>
            <ol className="space-y-2.5">
              {[
                ["1", "Pause", "Click Pause to freeze the frame"],
                ["2", "Draw", "Click & drag on the video to draw a box around the product"],
                ["3", "Adjust", "Drag the box to move · drag corner handle to resize"],
                ["4", "Save", "Click Save — populates bounding_box and spatial_coordinates"],
              ].map(([num, title, desc]) => (
                <li key={num} className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 text-xs flex items-center justify-center shrink-0 font-bold mt-0.5">{num}</span>
                  <div>
                    <p className="text-xs font-semibold text-white/70">{title}</p>
                    <p className="text-xs text-white/30 leading-tight">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Output preview */}
          <div className="bg-[#13131a] border border-white/[0.06] rounded-2xl p-4 flex-1">
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Scene DNA Output</p>
            {box ? (
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">bounding_box (%)</p>
                  <pre className="text-[10px] font-mono text-violet-300 bg-violet-500/5 border border-violet-500/20 rounded-lg p-2 leading-relaxed">
{`x:      ${box.x.toFixed(1)}
y:      ${box.y.toFixed(1)}
width:  ${box.width.toFixed(1)}
height: ${box.height.toFixed(1)}`}
                  </pre>
                </div>
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">spatial_coordinates (0–1)</p>
                  <pre className="text-[10px] font-mono text-emerald-300 bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-2 leading-relaxed">
{`x:      ${((box.x + box.width / 2) / 100).toFixed(3)}
y:      ${((box.y + box.height / 2) / 100).toFixed(3)}
z:      0.500
width:  ${(box.width / 100).toFixed(3)}
height: ${(box.height / 100).toFixed(3)}`}
                  </pre>
                </div>
                <p className="text-[10px] text-white/25 leading-relaxed">
                  x/y = normalized center · z = depth (default 0.5) · width/height = normalized size
                </p>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center py-8">
                <p className="text-xs text-white/20 text-center">
                  Draw a box on the<br />video to see output
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function getVimeoId(url) {
  if (!url) return "";
  const m = url.match(/(?:vimeo\.com\/)(\d+)/);
  return m ? m[1] : url;
}