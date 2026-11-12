import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Eye, MousePointer, ShoppingCart, Boxes, TrendingUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { resolveFloors, floorName } from "@/components/dashboard/floors";
import FloorEngagementChart from "@/components/analytics/FloorEngagementChart";

export default function FloorAnalytics() {
  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: episodes = [] } = useQuery({
    queryKey: ["episodes"],
    queryFn: () => base44.entities.Episode.list(),
    enabled: user?.role === "admin",
  });

  const { data: events = [] } = useQuery({
    queryKey: ["portalAnalytics"],
    queryFn: () => base44.entities.PortalAnalytics.list("-created_date", 500),
    enabled: user?.role === "admin",
  });

  const { data: settings = [] } = useQuery({
    queryKey: ["siteSettings"],
    queryFn: () => base44.entities.SiteSettings.list(),
    enabled: user?.role === "admin",
  });

  const siteSettings = settings[0];
  const rowLabels = siteSettings?.row_labels || {};
  const resolvedFloors = useMemo(
    () => resolveFloors(siteSettings?.floors_config, rowLabels),
    [siteSettings?.floors_config, rowLabels]
  );

  // Build episode → floor mapping using each floor's select function
  const floorMetrics = useMemo(() => {
    return resolvedFloors.map((floor) => {
      const floorEpisodes = floor.select(episodes);
      const epIds = new Set(floorEpisodes.map((e) => e.id));
      const floorEvents = events.filter((e) => epIds.has(e.episode_id));

      const views = floorEvents.filter((e) => e.event_type === "portal_open").length;
      const triggerClicks = floorEvents.filter(
        (e) => e.event_type === "confessional_view" || e.event_type === "buyscreen_view"
      ).length;
      const conversions = floorEvents.filter((e) => e.event_type === "shop_click").length;
      const arLaunches = floorEvents.filter((e) => e.event_type === "ar_launch").length;
      const ctr = views > 0 ? ((triggerClicks / views) * 100).toFixed(1) : "0";
      const convRate = triggerClicks > 0 ? ((conversions / triggerClicks) * 100).toFixed(1) : "0";

      return {
        key: floor.key,
        tag: floor.tag,
        name: floorName(floor),
        episodeCount: floorEpisodes.length,
        views,
        triggerClicks,
        conversions,
        arLaunches,
        ctr,
        convRate,
      };
    });
  }, [resolvedFloors, episodes, events]);

  const sortedByViews = useMemo(
    () => [...floorMetrics].sort((a, b) => b.views - a.views),
    [floorMetrics]
  );

  const totalViews = floorMetrics.reduce((s, f) => s + f.views, 0);
  const totalTriggers = floorMetrics.reduce((s, f) => s + f.triggerClicks, 0);
  const totalConversions = floorMetrics.reduce((s, f) => s + f.conversions, 0);
  const totalEpisodes = floorMetrics.reduce((s, f) => s + f.episodeCount, 0);

  if (user && user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-red-500/10 flex items-center justify-center">
            <Boxes className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Access Restricted</h2>
          <p className="text-white/40 mb-6">Only administrators can view floor analytics</p>
        </div>
      </div>
    );
  }

  const summaryCards = [
    { title: "Total Views", value: totalViews, icon: Eye, color: "text-violet-400 bg-violet-500/10" },
    { title: "Trigger Interactions", value: totalTriggers, icon: MousePointer, color: "text-blue-400 bg-blue-500/10" },
    { title: "Conversions", value: totalConversions, icon: ShoppingCart, color: "text-emerald-400 bg-emerald-500/10" },
    { title: "Episodes Across Floors", value: totalEpisodes, icon: Boxes, color: "text-amber-400 bg-amber-500/10" },
  ];

  return (
    <div className="min-h-screen px-4 sm:px-6 py-10 max-w-7xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">Floor Analytics</h1>
        <p className="text-white/40">Engagement breakdown by hotel floor category — see which floors attract the most views</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-[#13131a] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-white">{card.value}</div>
              <div className="text-xs text-white/40 mt-1">{card.title}</div>
            </div>
          );
        })}
      </div>

      {/* Bar chart */}
      <div className="mb-8">
        <FloorEngagementChart data={sortedByViews} />
      </div>

      {/* Detailed table */}
      <div className="bg-[#13131a] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="p-6 border-b border-white/[0.06]">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#D4AF37]" />
            Floor Performance Breakdown
          </h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-white/[0.06] hover:bg-transparent">
              <TableHead className="text-white/60">Floor</TableHead>
              <TableHead className="text-white/60">Episodes</TableHead>
              <TableHead className="text-white/60">Views</TableHead>
              <TableHead className="text-white/60">Trigger Clicks</TableHead>
              <TableHead className="text-white/60">CTR</TableHead>
              <TableHead className="text-white/60">Conversions</TableHead>
              <TableHead className="text-white/60">Conv. Rate</TableHead>
              <TableHead className="text-white/60">AR Launches</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedByViews.map((f) => (
              <TableRow key={f.key} className="border-white/[0.06] hover:bg-white/[0.02]">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <span
                      className="flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold"
                      style={{
                        background: f.views > 0
                          ? "radial-gradient(circle at 40% 35%, #E9C97A, #D4AF37 50%, #B89045 100%)"
                          : "rgba(255,255,255,0.06)",
                        color: f.views > 0 ? "#1a1410" : "rgba(255,255,255,0.3)",
                      }}
                    >
                      {f.tag}
                    </span>
                    <span className="text-white/90 font-medium text-sm">{f.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-white/80">{f.episodeCount}</TableCell>
                <TableCell className="text-white/80 font-medium">{f.views}</TableCell>
                <TableCell className="text-white/80">{f.triggerClicks}</TableCell>
                <TableCell>
                  <span className={`font-medium ${
                    parseFloat(f.ctr) > 50 ? "text-emerald-400" :
                    parseFloat(f.ctr) > 25 ? "text-blue-400" :
                    "text-white/60"
                  }`}>
                    {f.ctr}%
                  </span>
                </TableCell>
                <TableCell className="text-white/80">{f.conversions}</TableCell>
                <TableCell>
                  <span className={`font-medium ${
                    parseFloat(f.convRate) > 20 ? "text-emerald-400" :
                    parseFloat(f.convRate) > 10 ? "text-blue-400" :
                    "text-white/60"
                  }`}>
                    {f.convRate}%
                  </span>
                </TableCell>
                <TableCell className="text-white/80">{f.arLaunches}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}