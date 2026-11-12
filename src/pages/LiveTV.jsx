import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Tv2, Copy, Check } from "lucide-react";
import LivePlayer from "../components/live/LivePlayer";
import ProgramGuide from "../components/live/ProgramGuide";

function getCurrentProgram(schedule) {
  const now = new Date();
  return schedule.find(s => new Date(s.start_time) <= now && now <= new Date(s.end_time)) || null;
}

function getOffsetSeconds(program) {
  if (!program) return 0;
  return Math.max(0, Math.floor((new Date() - new Date(program.start_time)) / 1000));
}

export default function LiveTV() {
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(new Date());

  // Tick every 30s to re-evaluate current program
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const { data: schedule = [] } = useQuery({
    queryKey: ["liveSchedule"],
    queryFn: () => base44.entities.LiveChannelSchedule.list("-start_time", 50),
    refetchInterval: 60000,
  });

  const currentProgram = getCurrentProgram(schedule);
  const offsetSeconds = getOffsetSeconds(currentProgram);

  const embedUrl = typeof window !== "undefined"
    ? `${window.location.origin}/embed-live`
    : "";
  const iframeCode = `<iframe src="${embedUrl}" width="100%" height="600" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(iframeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-16">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
              <Tv2 className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">GlobeHouse Live</h1>
              <p className="text-xs text-white/30">
                {currentProgram ? `Now: ${currentProgram.title}` : "No program currently airing"}
              </p>
            </div>
          </div>
          <Link to={createPageUrl("ChannelScheduler")}
            className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
            Schedule →
          </Link>
        </div>

        {/* Player */}
        <LivePlayer
          vimeoUrl={currentProgram?.vimeo_embed_url}
          offsetSeconds={offsetSeconds}
          title={currentProgram?.title}
          isLive={!!currentProgram}
        />

        {/* Two-column layout: Guide + Embed */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Program Guide */}
          <div className="lg:col-span-2">
            <ProgramGuide schedule={schedule} currentProgram={currentProgram} />
          </div>

          {/* Embed Code */}
          <div>
            <h2 className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-3">Embed Player</h2>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 space-y-3">
              <p className="text-xs text-white/40 leading-relaxed">
                Embed this live channel on any GlobeHouse platform. The player always syncs to the current scheduled program.
              </p>
              <div className="bg-black/40 rounded-xl p-3">
                <code className="text-xs text-white/40 font-mono block break-all">{iframeCode}</code>
              </div>
              <button onClick={handleCopy}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 text-xs font-medium transition-colors">
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied!" : "Copy Embed Code"}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}