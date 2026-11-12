import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { CalendarDays, Plus, Pencil, Trash2, Play, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import ScheduleForm from "../components/live/ScheduleForm";
import AutoProgrammer from "../components/live/AutoProgrammer";

export default function ChannelScheduler() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [editingEntry, setEditingEntry] = useState(null); // null | "new" | entry object
  const [activeTab, setActiveTab] = useState("schedule"); // "schedule" | "auto"

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: schedule = [], isLoading } = useQuery({
    queryKey: ["liveSchedule"],
    queryFn: () => base44.entities.LiveChannelSchedule.list("start_time", 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.LiveChannelSchedule.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["liveSchedule"] }); setEditingEntry(null); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LiveChannelSchedule.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["liveSchedule"] }); setEditingEntry(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.LiveChannelSchedule.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["liveSchedule"] }),
  });

  // Redirect non-admins (after all hooks)
  if (user && user.role !== "admin") {
    navigate(createPageUrl("LiveTV"));
    return null;
  }

  const handleSave = (formData) => {
    if (editingEntry === "new") createMutation.mutate(formData);
    else updateMutation.mutate({ id: editingEntry.id, data: formData });
  };

  const now = new Date();

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-16">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Channel Scheduler</h1>
              <p className="text-xs text-white/30">Program your 24-hour live channel</p>
            </div>
          </div>
          <Button onClick={() => setEditingEntry("new")}
            className="bg-violet-500 hover:bg-violet-600 gap-2 text-sm">
            <Plus className="w-4 h-4" /> Add Program
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white/[0.04] rounded-xl mb-6 w-fit">
          {[
            { id: "schedule", label: "Manual Schedule", icon: CalendarDays },
            { id: "auto", label: "AI Auto Programmer", icon: Wand2 },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-violet-500 text-white"
                    : "text-white/40 hover:text-white/70"
                }`}>
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "auto" ? (
          <AutoProgrammer />
        ) : (
          <>
            {/* Add/Edit Form */}
            {editingEntry && (
              <div className="mb-6">
                <ScheduleForm
                  entry={editingEntry === "new" ? null : editingEntry}
                  onSave={handleSave}
                  onCancel={() => setEditingEntry(null)}
                />
              </div>
            )}

            {/* Schedule List */}
            {isLoading ? (
              <div className="text-center text-white/20 text-sm py-16">Loading schedule…</div>
            ) : schedule.length === 0 ? (
              <div className="text-center py-20">
                <CalendarDays className="w-12 h-12 text-white/10 mx-auto mb-4" />
                <p className="text-white/20 text-sm">No programs scheduled yet.</p>
                <p className="text-white/10 text-xs mt-1">Add programs manually or use the AI Auto Programmer.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {schedule.map(entry => {
                  const start = new Date(entry.start_time);
                  const end = new Date(entry.end_time);
                  const isAiring = start <= now && now <= end;
                  const isPast = end < now;

                  return (
                    <div key={entry.id}
                      className={`flex items-center gap-4 px-4 py-3 rounded-xl border transition-all ${
                        isAiring ? "bg-red-500/[0.06] border-red-500/20" :
                        isPast ? "opacity-40 bg-white/[0.01] border-white/[0.03]" :
                        "bg-white/[0.02] border-white/[0.05]"
                      }`}>

                      {/* Thumbnail */}
                      <div className="flex-shrink-0 w-16 h-10 rounded-lg overflow-hidden bg-white/[0.04]">
                        {entry.thumbnail
                          ? <img src={entry.thumbnail} alt={entry.title} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><Play className="w-4 h-4 text-white/20" /></div>
                        }
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {isAiring && (
                            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse flex-shrink-0" />
                          )}
                          <p className="text-sm font-medium text-white/80 truncate">{entry.title}</p>
                          {entry.ar_trigger_enabled && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400 flex-shrink-0">AR</span>
                          )}
                        </div>
                        <p className="text-xs text-white/30 mt-0.5">
                           {isNaN(start) || isNaN(end)
                             ? "Invalid date"
                             : `${format(start, "MMM d, h:mm a")} → ${format(end, "h:mm a")}`}
                           {" · "}{entry.category?.replace("_", " ")}
                         </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button onClick={() => setEditingEntry(entry)}
                          className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white/70 transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteMutation.mutate(entry.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}