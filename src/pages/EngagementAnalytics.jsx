import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MousePointer, ShoppingCart, TrendingUp, AlertTriangle, Flame } from "lucide-react";
import HeatmapTimeline from "@/components/analytics/HeatmapTimeline";

const INTEREST_TYPES = ["buyscreen_view", "confessional_view", "ar_launch", "confessional_complete"];

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function EngagementAnalytics() {
  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: episodes = [] } = useQuery({
    queryKey: ["episodes"],
    queryFn: () => base44.entities.Episode.list(),
    enabled: user?.role === "admin",
  });

  const { data: analytics = [] } = useQuery({
    queryKey: ["portalAnalytics"],
    queryFn: () => base44.entities.PortalAnalytics.list(),
    enabled: user?.role === "admin",
  });

  const [selectedEpisodeId, setSelectedEpisodeId] = useState("");

  const selectedEpisode = episodes.find(e => e.id === selectedEpisodeId);

  const episodeAnalytics = useMemo(() => {
    if (!selectedEpisodeId) return [];
    return analytics.filter(a => a.episode_id === selectedEpisodeId);
  }, [analytics, selectedEpisodeId]);

  const stats = useMemo(() => {
    const interest = episodeAnalytics.filter(e => INTEREST_TYPES.includes(e.event_type));
    const conversions = episodeAnalytics.filter(e => e.event_type === "shop_click");
    const convRate = interest.length > 0 ? ((conversions.length / interest.length) * 100).toFixed(1) : "0";

    const timestampCounts = {};
    episodeAnalytics.forEach(e => {
      if (e.trigger_timestamp != null) {
        const bucket = Math.floor(e.trigger_timestamp / 5) * 5;
        timestampCounts[bucket] = (timestampCounts[bucket] || 0) + 1;
      }
    });
    const peak = Object.entries(timestampCounts).sort((a, b) => b[1] - a[1])[0];

    return {
      totalInteractions: interest.length + conversions.length,
      interestCount: interest.length,
      conversionCount: conversions.length,
      conversionRate: convRate,
      peakTimestamp: peak ? parseInt(peak[0]) : null,
      peakCount: peak ? peak[1] : 0,
    };
  }, [episodeAnalytics]);

  if (user && user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-red-500/10 flex items-center justify-center">
            <Flame className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Access Restricted</h2>
          <p className="text-white/40">Only administrators can view engagement analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 py-10 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Engagement Heatmaps</h1>
        <p className="text-white/50">Track viewer interaction intensity across video timelines to refine AR triggers</p>
      </div>

      <div className="mb-6">
        <Select value={selectedEpisodeId} onValueChange={setSelectedEpisodeId}>
          <SelectTrigger className="w-64 bg-[#13131a] border-white/10 text-white">
            <SelectValue placeholder="Select an episode" />
          </SelectTrigger>
          <SelectContent>
            {episodes.map(ep => (
              <SelectItem key={ep.id} value={ep.id}>{ep.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedEpisodeId ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="bg-[#13131a] border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-white/60 flex items-center gap-2">
                  <MousePointer className="w-4 h-4" /> Total Interactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.totalInteractions}</div>
              </CardContent>
            </Card>
            <Card className="bg-[#13131a] border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-white/60 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> Peak Timestamp
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {stats.peakTimestamp != null ? formatTime(stats.peakTimestamp) : "—"}
                </div>
                <div className="text-xs text-white/40">{stats.peakCount} events</div>
              </CardContent>
            </Card>
            <Card className="bg-[#13131a] border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-white/60 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" /> Conversions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.conversionCount}</div>
              </CardContent>
            </Card>
            <Card className="bg-[#13131a] border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-white/60 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Conversion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.conversionRate}%</div>
              </CardContent>
            </Card>
          </div>

          <HeatmapTimeline episode={selectedEpisode} events={episodeAnalytics} />
        </>
      ) : (
        <div className="rounded-xl border border-white/10 bg-[#13131a] p-12 text-center">
          <Flame className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/40 text-sm">Select an episode to view its engagement heatmap</p>
        </div>
      )}
    </div>
  );
}