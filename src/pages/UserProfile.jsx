import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { User, Activity, Bookmark, Settings, Bell, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";

export default function UserProfile() {
  const queryClient = useQueryClient();
  
  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: savedEpisodes = [] } = useQuery({
    queryKey: ["savedEpisodes"],
    queryFn: async () => {
      const saved = await base44.entities.SavedEpisode.filter({ user_email: user.email });
      const episodeIds = saved.map(s => s.episode_id);
      if (episodeIds.length === 0) return [];
      const episodes = await base44.entities.Episode.list();
      return episodes.filter(ep => episodeIds.includes(ep.id));
    },
    enabled: !!user?.email,
  });

  const { data: activity = [] } = useQuery({
    queryKey: ["userActivity"],
    queryFn: () => base44.entities.PortalAnalytics.filter({ created_by: user.email }, "-created_date", 50),
    enabled: !!user?.email,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => base44.entities.Notification.filter({ user_email: user.email }, "-created_date"),
    enabled: !!user?.email,
  });

  const unsaveMutation = useMutation({
    mutationFn: async (episodeId) => {
      const saved = await base44.entities.SavedEpisode.filter({ 
        user_email: user.email, 
        episode_id: episodeId 
      });
      if (saved[0]) {
        await base44.entities.SavedEpisode.delete(saved[0].id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedEpisodes"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.read);
      await Promise.all(unread.map(n => 
        base44.entities.Notification.update(n.id, { read: true })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const activityStats = {
    totalViews: activity.filter(a => a.event_type === "portal_open").length,
    triggers: activity.filter(a => a.event_type === "confessional_view" || a.event_type === "buyscreen_view").length,
    conversions: activity.filter(a => a.event_type === "shop_click").length,
  };

  return (
    <div className="min-h-screen px-4 sm:px-6 py-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-6 mb-10">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
          <User className="w-10 h-10 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white">{user?.full_name || "User"}</h1>
          <p className="text-white/40 mt-1">{user?.email}</p>
          <div className="flex items-center gap-4 mt-3">
            <span className="px-3 py-1 bg-violet-500/10 text-violet-400 text-xs rounded-full border border-violet-500/20 uppercase font-medium">
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-[#13131a] border border-white/[0.06] rounded-2xl p-5">
          <p className="text-2xl font-bold text-white">{activityStats.totalViews}</p>
          <p className="text-xs text-white/30 mt-1">Total Views</p>
        </div>
        <div className="bg-[#13131a] border border-white/[0.06] rounded-2xl p-5">
          <p className="text-2xl font-bold text-white">{savedEpisodes.length}</p>
          <p className="text-xs text-white/30 mt-1">Saved Episodes</p>
        </div>
        <div className="bg-[#13131a] border border-white/[0.06] rounded-2xl p-5">
          <p className="text-2xl font-bold text-white">{activityStats.triggers}</p>
          <p className="text-xs text-white/30 mt-1">Interactions</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="activity" className="w-full">
        <TabsList className="bg-[#13131a] border border-white/[0.06] p-1">
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="w-4 h-4" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="saved" className="gap-2">
            <Bookmark className="w-4 h-4" />
            Saved
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Notifications
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="w-2 h-2 bg-violet-500 rounded-full" />
            )}
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Activity Tab */}
        <TabsContent value="activity" className="mt-6">
          <div className="bg-[#13131a] border border-white/[0.06] rounded-2xl p-6">
            <h3 className="text-base font-semibold text-white mb-4">Recent Activity</h3>
            {activity.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-sm text-white/40">No activity yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activity.slice(0, 20).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                        <Activity className="w-4 h-4 text-violet-400" />
                      </div>
                      <div>
                        <p className="text-sm text-white/80 capitalize">
                          {item.event_type.replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs text-white/40">
                          {new Date(item.created_date).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Saved Episodes Tab */}
        <TabsContent value="saved" className="mt-6">
          <div className="bg-[#13131a] border border-white/[0.06] rounded-2xl p-6">
            <h3 className="text-base font-semibold text-white mb-4">Saved Episodes</h3>
            {savedEpisodes.length === 0 ? (
              <div className="text-center py-12">
                <Bookmark className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-sm text-white/40">No saved episodes yet</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {savedEpisodes.map((episode) => (
                  <div key={episode.id} className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-xl hover:bg-white/[0.04] transition-colors">
                    <div className="w-24 h-16 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex-shrink-0 overflow-hidden">
                      {episode.thumbnail_url ? (
                        <img src={episode.thumbnail_url} alt={episode.title} className="w-full h-full object-cover" />
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white truncate">{episode.title}</h4>
                      <p className="text-xs text-white/40 mt-1">
                        {episode.triggers?.length || 0} triggers
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link to={createPageUrl(`Player?id=${episode.id}`)}>
                        <Button size="sm" variant="outline" className="border-white/10 text-white/60 hover:text-white">
                          Watch
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => unsaveMutation.mutate(episode.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-6">
          <div className="bg-[#13131a] border border-white/[0.06] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white">All Notifications</h3>
              {notifications.filter(n => !n.read).length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => markAllReadMutation.mutate()}
                  className="text-xs text-violet-400 hover:text-violet-300"
                >
                  Mark all as read
                </Button>
              )}
            </div>
            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-sm text-white/40">No notifications</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 rounded-lg border transition-colors ${
                      !notif.read
                        ? "bg-violet-500/5 border-violet-500/20"
                        : "bg-white/[0.02] border-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                        !notif.read ? "bg-violet-500" : "bg-white/20"
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white/90">{notif.title}</p>
                        <p className="text-xs text-white/50 mt-1">{notif.message}</p>
                        <p className="text-xs text-white/30 mt-2">
                          {new Date(notif.created_date).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-6">
          <div className="bg-[#13131a] border border-white/[0.06] rounded-2xl p-6">
            <h3 className="text-base font-semibold text-white mb-4">Preferences</h3>
            <div className="space-y-6">
              <div>
                <Label className="text-xs text-white/40 mb-2">Email</Label>
                <Input
                  value={user?.email || ""}
                  disabled
                  className="bg-white/[0.02] border-white/[0.08] text-white/60"
                />
              </div>
              <div>
                <Label className="text-xs text-white/40 mb-2">Full Name</Label>
                <Input
                  value={user?.full_name || ""}
                  disabled
                  className="bg-white/[0.02] border-white/[0.08] text-white/60"
                />
              </div>
              <div className="pt-4 border-t border-white/[0.06]">
                <h4 className="text-sm font-medium text-white/80 mb-3">Notification Preferences</h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded bg-white/[0.04] border-white/[0.08]" />
                    <span className="text-sm text-white/70">New episode releases</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded bg-white/[0.04] border-white/[0.08]" />
                    <span className="text-sm text-white/70">System updates</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded bg-white/[0.04] border-white/[0.08]" />
                    <span className="text-sm text-white/70">Weekly digest</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}