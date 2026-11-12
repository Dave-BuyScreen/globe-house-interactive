import React, { useMemo } from "react";
import { AlertTriangle, Flame } from "lucide-react";

const INTEREST_TYPES = ["buyscreen_view", "confessional_view", "ar_launch", "confessional_complete"];

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function HeatmapTimeline({ episode, events }) {
  const maxTimestamp = useMemo(() => {
    const triggerEnds = (episode?.triggers || []).map(t => (t.timestamp || 0) + (t.duration || 10));
    const eventMax = events.map(e => e.trigger_timestamp || 0);
    return Math.max(...triggerEnds, ...eventMax, 60);
  }, [episode, events]);

  const bucketSize = useMemo(() => {
    if (maxTimestamp <= 120) return 5;
    if (maxTimestamp <= 300) return 10;
    if (maxTimestamp <= 600) return 15;
    return 30;
  }, [maxTimestamp]);

  const numBuckets = Math.ceil(maxTimestamp / bucketSize);

  const buckets = useMemo(() => {
    const arr = Array.from({ length: numBuckets }, (_, i) => ({
      start: i * bucketSize,
      end: (i + 1) * bucketSize,
      interest: 0,
      conversion: 0,
    }));

    events.forEach(e => {
      if (e.trigger_timestamp == null) return;
      const idx = Math.floor(e.trigger_timestamp / bucketSize);
      if (idx >= 0 && idx < numBuckets) {
        if (e.event_type === "shop_click") buckets[idx].conversion++;
        else if (INTEREST_TYPES.includes(e.event_type)) buckets[idx].interest++;
      }
    });

    return arr;
  }, [events, numBuckets, bucketSize]);

  const maxInterest = Math.max(...buckets.map(b => b.interest), 1);
  const maxConversion = Math.max(...buckets.map(b => b.conversion), 1);
  const refinementBuckets = buckets.filter(b => b.interest >= 2 && b.conversion === 0);

  if (!events || events.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#13131a] p-12 text-center">
        <Flame className="w-10 h-10 text-white/20 mx-auto mb-3" />
        <p className="text-white/40 text-sm">No engagement data yet for this episode</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[#13131a] p-6 space-y-6">
      {/* Interest Heatmap */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-white/60 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-violet-500" />
            Interest — Views, AR Launches
          </label>
          <span className="text-[10px] text-white/30">{maxInterest} peak</span>
        </div>
        <div className="flex items-end gap-px h-20 bg-white/[0.02] rounded-lg p-1">
          {buckets.map((bucket, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-sm transition-all hover:bg-violet-400 cursor-default"
              style={{
                height: `${(bucket.interest / maxInterest) * 100}%`,
                minHeight: bucket.interest > 0 ? "4px" : "1px",
                opacity: bucket.interest > 0 ? 0.4 + (bucket.interest / maxInterest) * 0.6 : 0.1,
                backgroundColor: bucket.interest > 0 ? "#8B5CF6" : "rgba(255,255,255,0.05)",
              }}
              title={`${formatTime(bucket.start)}–${formatTime(bucket.end)}: ${bucket.interest} interest, ${bucket.conversion} conversions`}
            />
          ))}
        </div>
      </div>

      {/* Conversion Heatmap */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-white/60 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Conversions — Shop Clicks
          </label>
          <span className="text-[10px] text-white/30">{maxConversion} peak</span>
        </div>
        <div className="flex items-end gap-px h-16 bg-white/[0.02] rounded-lg p-1">
          {buckets.map((bucket, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-sm transition-all hover:bg-emerald-400 cursor-default"
              style={{
                height: `${(bucket.conversion / maxConversion) * 100}%`,
                minHeight: bucket.conversion > 0 ? "4px" : "1px",
                opacity: bucket.conversion > 0 ? 0.4 + (bucket.conversion / maxConversion) * 0.6 : 0.1,
                backgroundColor: bucket.conversion > 0 ? "#10B981" : "rgba(255,255,255,0.05)",
              }}
              title={`${formatTime(bucket.start)}–${formatTime(bucket.end)}: ${bucket.interest} interest, ${bucket.conversion} conversions`}
            />
          ))}
        </div>
      </div>

      {/* Timeline + Triggers */}
      <div className="relative pt-4">
        <div className="relative h-8">
          <div className="absolute top-0 left-0 right-0 h-px bg-white/10" />
          {(episode?.triggers || []).map((trigger, i) => {
            const left = ((trigger.timestamp || 0) / maxTimestamp) * 100;
            return (
              <div
                key={i}
                className="absolute flex flex-col items-center -translate-x-1/2"
                style={{ left: `${left}%`, top: "-4px" }}
              >
                <div className="w-2 h-2 rounded-full bg-white/40 border border-white/30" />
                <span className="text-[9px] text-white/30 mt-1 whitespace-nowrap">T{i + 1}</span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-[10px] text-white/30 mt-1">
          <span>0:00</span>
          <span>{formatTime(maxTimestamp * 0.25)}</span>
          <span>{formatTime(maxTimestamp * 0.5)}</span>
          <span>{formatTime(maxTimestamp * 0.75)}</span>
          <span>{formatTime(maxTimestamp)}</span>
        </div>
      </div>

      {/* Refinement Opportunities */}
      {refinementBuckets.length > 0 && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-amber-300">Refinement Opportunities</span>
          </div>
          <p className="text-xs text-white/40 mb-2">
            High interest but zero conversions — consider adjusting AR trigger or product placement at:
          </p>
          <div className="flex flex-wrap gap-2">
            {refinementBuckets.map((b, i) => (
              <span key={i} className="px-2 py-1 rounded-md bg-amber-500/10 text-amber-300 text-xs font-mono">
                {formatTime(b.start)}–{formatTime(b.end)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}