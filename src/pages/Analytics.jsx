import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Eye, MousePointer, ShoppingCart, Clock } from "lucide-react";
import EpisodeMetricsCard from "../components/analytics/EpisodeMetricsCard";
import EngagementChart from "../components/analytics/EngagementChart";
import EpisodePerformanceTable from "../components/analytics/EpisodePerformanceTable";
import ConversionFunnelChart from "../components/analytics/ConversionFunnelChart";

export default function Analytics() {
  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: events = [] } = useQuery({
    queryKey: ["analytics"],
    queryFn: () => base44.entities.PortalAnalytics.list("-created_date", 500),
    enabled: user?.role === "admin",
  });

  const { data: episodes = [] } = useQuery({
    queryKey: ["episodes"],
    queryFn: () => base44.entities.Episode.list(),
    enabled: user?.role === "admin",
  });

  // Calculate comprehensive metrics
  const metrics = useMemo(() => {
    const totalViews = events.filter(e => e.event_type === "portal_open").length;
    const triggerClicks = events.filter(e => 
      e.event_type === "confessional_view" || e.event_type === "buyscreen_view"
    ).length;
    const conversions = events.filter(e => e.event_type === "shop_click").length;
    const avgEngagementTime = events.filter(e => e.event_type === "video_resume").length;

    const clickThroughRate = totalViews > 0 ? ((triggerClicks / totalViews) * 100).toFixed(1) : 0;
    const conversionRate = triggerClicks > 0 ? ((conversions / triggerClicks) * 100).toFixed(1) : 0;

    return {
      totalViews,
      triggerClicks,
      conversions,
      clickThroughRate,
      conversionRate,
      avgEngagementTime
    };
  }, [events]);

  // Time-series data for engagement chart
  const engagementOverTime = useMemo(() => {
    const dailyData = {};
    
    events.forEach(event => {
      if (!event.created_date) return;
      const date = new Date(event.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      if (!dailyData[date]) {
        dailyData[date] = { date, views: 0, triggers: 0, conversions: 0 };
      }
      
      if (event.event_type === "portal_open") dailyData[date].views++;
      if (event.event_type === "confessional_view" || event.event_type === "buyscreen_view") dailyData[date].triggers++;
      if (event.event_type === "shop_click") dailyData[date].conversions++;
    });

    return Object.values(dailyData).slice(-14); // Last 14 days
  }, [events]);

  // Redirect non-admins
  if (user && user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-red-500/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Access Restricted</h2>
          <p className="text-white/40 mb-6">Only administrators can view analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 py-10 max-w-7xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
        <p className="text-white/40">Track views, engagement, and conversion metrics across all episodes</p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <EpisodeMetricsCard
          title="Total Views"
          value={metrics.totalViews}
          subtitle="Portal interactions"
          icon={Eye}
          color="bg-violet-500/10 text-violet-400"
          trend={12}
        />
        <EpisodeMetricsCard
          title="Click-Through Rate"
          value={`${metrics.clickThroughRate}%`}
          subtitle={`${metrics.triggerClicks} trigger clicks`}
          icon={MousePointer}
          color="bg-blue-500/10 text-blue-400"
          trend={8}
        />
        <EpisodeMetricsCard
          title="Conversions"
          value={metrics.conversions}
          subtitle="Shop clicks"
          icon={ShoppingCart}
          color="bg-emerald-500/10 text-emerald-400"
          trend={15}
        />
        <EpisodeMetricsCard
          title="Conversion Rate"
          value={`${metrics.conversionRate}%`}
          subtitle="From triggers to shops"
          icon={Clock}
          color="bg-amber-500/10 text-amber-400"
          trend={-3}
        />
      </div>

      {/* Engagement Over Time */}
      <div className="mb-8">
        <EngagementChart data={engagementOverTime} />
      </div>

      {/* Conversion Funnel */}
      <div className="mb-8">
        <ConversionFunnelChart analytics={events} />
      </div>

      {/* Episode Performance Table */}
      <EpisodePerformanceTable episodes={episodes} analytics={events} />
    </div>
  );
}