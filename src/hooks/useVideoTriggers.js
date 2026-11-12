import { useState, useEffect, useRef } from "react";

/**
 * Shared trigger-detection logic used by both VimeoWrapper and YouTubeWrapper.
 * Watches currentTime and fires activeTrigger when a trigger timestamp is crossed.
 */
export function useVideoTriggers({ triggers, currentTime, isPaused }) {
  const [activeTrigger, setActiveTrigger] = useState(null);
  const [triggeredIds, setTriggeredIds] = useState(new Set());
  const lastTimeRef = useRef(0);

  // Reset triggered IDs when video replays (time jumps backward)
  useEffect(() => {
    if (currentTime < lastTimeRef.current - 2) {
      setTriggeredIds(new Set());
    }
    lastTimeRef.current = currentTime;
  }, [currentTime]);

  // Check triggers against current time
  useEffect(() => {
    if (!triggers.length || isPaused) return;

    for (const trigger of triggers) {
      const triggerKey = `${trigger.timestamp}`;
      const tolerance = 0.5;
      if (
        !triggeredIds.has(triggerKey) &&
        currentTime >= trigger.timestamp - tolerance &&
        currentTime <= trigger.timestamp + tolerance
      ) {
        setActiveTrigger(trigger);
        setTriggeredIds((prev) => new Set([...prev, triggerKey]));
        break;
      }
    }
  }, [currentTime, triggers, triggeredIds, isPaused]);

  // Auto-dismiss prompt after 6 seconds
  useEffect(() => {
    if (!activeTrigger) return;
    const timer = setTimeout(() => setActiveTrigger(null), 6000);
    return () => clearTimeout(timer);
  }, [activeTrigger]);

  return { activeTrigger, setActiveTrigger };
}