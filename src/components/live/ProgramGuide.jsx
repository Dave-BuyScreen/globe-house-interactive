import React from "react";
import { format } from "date-fns";
import { Clock, Play } from "lucide-react";

function ProgramCard({ program, badge }) {
  const start = program.start_time ? format(new Date(program.start_time), "h:mm a") : "";
  const end = program.end_time ? format(new Date(program.end_time), "h:mm a") : "";
  const isNow = badge === "NOW";

  return (
    <div className={`flex gap-3 p-3 rounded-xl border transition-all ${
      isNow ? "bg-violet-500/10 border-violet-500/30" : "bg-white/[0.02] border-white/[0.04]"
    }`}>
      <div className="flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden bg-white/[0.04] relative">
        {program.thumbnail ? (
          <img src={program.thumbnail} alt={program.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="w-5 h-5 text-white/20" />
          </div>
        )}
        {isNow && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        {badge && (
          <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-semibold mb-1 ${
            badge === "NOW" ? "bg-red-500/20 text-red-400" :
            badge === "NEXT" ? "bg-violet-500/20 text-violet-400" :
            "bg-white/[0.06] text-white/40"
          }`}>{badge}</span>
        )}
        <p className={`text-sm font-medium truncate ${isNow ? "text-white" : "text-white/70"}`}>{program.title}</p>
        <p className="text-xs text-white/30 flex items-center gap-1 mt-0.5">
          <Clock className="w-3 h-3" />
          {start} – {end}
        </p>
      </div>
    </div>
  );
}

export default function ProgramGuide({ schedule, currentProgram }) {
  const now = new Date();

  const upcoming = schedule
    .filter(s => new Date(s.start_time) > now)
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
    .slice(0, 5);

  const nextProgram = upcoming[0];
  const upcomingRest = upcoming.slice(1);

  return (
    <div className="space-y-2">
      <h2 className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-3">Program Guide</h2>

      {currentProgram && <ProgramCard program={currentProgram} badge="NOW" />}
      {nextProgram && <ProgramCard program={nextProgram} badge="NEXT" />}
      {upcomingRest.map((p, i) => (
        <ProgramCard key={p.id} program={p} badge={i === 0 ? "UPCOMING" : null} />
      ))}

      {!currentProgram && upcoming.length === 0 && (
        <div className="text-center py-12 text-white/20 text-sm">No programs scheduled</div>
      )}
    </div>
  );
}