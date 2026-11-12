import React, { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { findNearestObject } from "@/components/mapping/ZoneCalculator";

const LONG_PRESS_DURATION = 650; // ms
const MOVE_THRESHOLD = 0.03; // 3% of container dimension

/**
 * Transparent overlay capturing long-press interactions on the video.
 * On successful long press: finds nearest active object, triggers onActivate(object, position).
 */
export default function LongPressOverlay({ mappings = [], currentTime, onActivate, themeColor = "#8B5CF6" }) {
  const containerRef = useRef(null);
  const timerRef = useRef(null);
  const startPosRef = useRef(null);

  const [pressState, setPressState] = useState(null); // null | { x, y, progress }
  const [progressValue, setProgressValue] = useState(0);
  const progressIntervalRef = useRef(null);

  const getRelativePos = useCallback((clientX, clientY) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height,
      px: clientX - rect.left,
      py: clientY - rect.top,
    };
  }, []);

  const startPress = useCallback((clientX, clientY) => {
    const pos = getRelativePos(clientX, clientY);
    if (!pos) return;

    startPosRef.current = pos;
    setProgressValue(0);
    setPressState({ px: pos.px, py: pos.py });

    // Animate progress
    const startTime = Date.now();
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const p = Math.min(elapsed / LONG_PRESS_DURATION, 1);
      setProgressValue(p);
    }, 16);

    timerRef.current = setTimeout(() => {
      clearInterval(progressIntervalRef.current);
      const nearest = findNearestObject(pos.x, pos.y, mappings, currentTime);
      setPressState(null);
      setProgressValue(0);
      if (nearest && onActivate) {
        onActivate(nearest, pos);
      }
    }, LONG_PRESS_DURATION);
  }, [getRelativePos, mappings, currentTime, onActivate]);

  const cancelPress = useCallback((clientX, clientY) => {
    // Check if moved too far
    if (clientX !== undefined && startPosRef.current) {
      const pos = getRelativePos(clientX, clientY);
      if (pos) {
        const dx = Math.abs(pos.x - startPosRef.current.x);
        const dy = Math.abs(pos.y - startPosRef.current.y);
        if (dx > MOVE_THRESHOLD || dy > MOVE_THRESHOLD) {
          clearTimeout(timerRef.current);
          clearInterval(progressIntervalRef.current);
          setPressState(null);
          setProgressValue(0);
        }
      }
    } else {
      clearTimeout(timerRef.current);
      clearInterval(progressIntervalRef.current);
      setPressState(null);
      setProgressValue(0);
    }
  }, [getRelativePos]);

  // Mouse events
  const onMouseDown = (e) => startPress(e.clientX, e.clientY);
  const onMouseMove = (e) => { if (pressState) cancelPress(e.clientX, e.clientY); };
  const onMouseUp = () => cancelPress();

  // Touch events
  const onTouchStart = (e) => {
    const t = e.touches[0];
    startPress(t.clientX, t.clientY);
  };
  const onTouchMove = (e) => {
    const t = e.touches[0];
    cancelPress(t.clientX, t.clientY);
  };
  const onTouchEnd = () => cancelPress();

  const circumference = 2 * Math.PI * 20; // r=20

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-20 cursor-crosshair select-none"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ touchAction: "none" }}
    >
      {/* Long press visual indicator */}
      <AnimatePresence>
        {pressState && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute",
              left: pressState.px,
              top: pressState.py,
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
            }}
          >
            {/* Ripple glow */}
            <motion.div
              className="absolute rounded-full"
              style={{
                width: 56,
                height: 56,
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                background: `radial-gradient(circle, ${themeColor}40 0%, transparent 70%)`,
              }}
              animate={{ scale: [1, 1.4 + progressValue * 0.6], opacity: [0.6, 0.2] }}
              transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse" }}
            />

            {/* Circular SVG progress ring */}
            <svg width="56" height="56" style={{ position: "relative", zIndex: 2 }}>
              {/* Track */}
              <circle
                cx="28"
                cy="28"
                r="20"
                fill="none"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="3"
              />
              {/* Progress arc */}
              <circle
                cx="28"
                cy="28"
                r="20"
                fill="none"
                stroke={themeColor}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progressValue)}
                transform="rotate(-90 28 28)"
                style={{ transition: "stroke-dashoffset 16ms linear", filter: `drop-shadow(0 0 4px ${themeColor})` }}
              />
              {/* Center dot */}
              <circle cx="28" cy="28" r="3" fill={themeColor} opacity={0.8} />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}