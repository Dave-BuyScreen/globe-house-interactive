import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import LivePlayer from "../components/live/LivePlayer";

function getCurrentProgram(schedule) {
  const now = new Date();
  return schedule.find(s => new Date(s.start_time) <= now && now <= new Date(s.end_time)) || null;
}

function getOffsetSeconds(program) {
  if (!program) return 0;
  return Math.max(0, Math.floor((new Date() - new Date(program.start_time)) / 1000));
}

export default function EmbedLive() {
  const [, tick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => tick(n => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const { data: schedule = [] } = useQuery({
    queryKey: ["liveScheduleEmbed"],
    queryFn: () => base44.entities.LiveChannelSchedule.list("-start_time", 50),
    refetchInterval: 60000,
  });

  const currentProgram = getCurrentProgram(schedule);
  const offsetSeconds = getOffsetSeconds(currentProgram);

  return (
    <div className="w-full h-screen bg-black overflow-hidden">
      <LivePlayer
        vimeoUrl={currentProgram?.vimeo_embed_url}
        offsetSeconds={offsetSeconds}
        title={currentProgram?.title}
        isLive={!!currentProgram}
      />
    </div>
  );
}