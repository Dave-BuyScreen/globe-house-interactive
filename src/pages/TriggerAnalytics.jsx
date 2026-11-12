import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, MousePointer, TrendingUp, Video } from "lucide-react";

export default function TriggerAnalytics() {
  const [selectedEpisode, setSelectedEpisode] = useState("all");

  const { data: episodes = [] } = useQuery({
    queryKey: ["episodes"],
    queryFn: () => base44.entities.Episode.list(),
  });

  const { data: analytics = [] } = useQuery({
    queryKey: ["portalAnalytics"],
    queryFn: () => base44.entities.PortalAnalytics.list(),
  });

  // Calculate metrics
  const getTriggerMetrics = () => {
    const episodeFilter = selectedEpisode === "all" 
      ? episodes 
      : episodes.filter(ep => ep.id === selectedEpisode);

    const metrics = [];

    episodeFilter.forEach(episode => {
      const triggers = episode.triggers || [];
      
      triggers.forEach((trigger, index) => {
        const timestamp = trigger.timestamp;
        
        // Get analytics for this trigger
        const triggerAnalytics = analytics.filter(a => 
          a.episode_id === episode.id && 
          a.trigger_timestamp === timestamp
        );

        const portalOpens = triggerAnalytics.filter(a => a.event_type === "portal_open").length;
        const confessionalViews = triggerAnalytics.filter(a => a.event_type === "confessional_view").length;
        const confessionalCompletes = triggerAnalytics.filter(a => a.event_type === "confessional_complete").length;
        const buyscreenViews = triggerAnalytics.filter(a => a.event_type === "buyscreen_view").length;
        const shopClicks = triggerAnalytics.filter(a => a.event_type === "shop_click").length;
        const arLaunches = triggerAnalytics.filter(a => a.event_type === "ar_launch").length;

        const clickThroughRate = portalOpens > 0 ? ((shopClicks / portalOpens) * 100).toFixed(1) : 0;
        const confessionalCompletionRate = confessionalViews > 0 ? ((confessionalCompletes / confessionalViews) * 100).toFixed(1) : 0;

        metrics.push({
          episodeTitle: episode.title,
          episodeId: episode.id,
          triggerIndex: index,
          timestamp: timestamp,
          timestampLabel: formatTime(timestamp),
          productName: trigger.product_name || `Trigger ${index + 1}`,
          portalOpens,
          confessionalViews,
          buyscreenViews,
          shopClicks,
          arLaunches,
          clickThroughRate: parseFloat(clickThroughRate),
          confessionalCompletionRate: parseFloat(confessionalCompletionRate),
          totalEngagement: portalOpens + confessionalViews + buyscreenViews + shopClicks + arLaunches,
        });
      });
    });

    return metrics.sort((a, b) => b.totalEngagement - a.totalEngagement);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const triggerMetrics = getTriggerMetrics();

  // Top 10 triggers by engagement
  const topTriggers = triggerMetrics.slice(0, 10);

  // CTR data for chart
  const ctrData = topTriggers.map(t => ({
    name: `${t.productName.substring(0, 15)}... @${t.timestampLabel}`,
    ctr: t.clickThroughRate,
    engagement: t.totalEngagement,
  }));

  // Summary stats
  const totalPortalOpens = triggerMetrics.reduce((sum, t) => sum + t.portalOpens, 0);
  const totalShopClicks = triggerMetrics.reduce((sum, t) => sum + t.shopClicks, 0);
  const averageCTR = triggerMetrics.length > 0 
    ? (triggerMetrics.reduce((sum, t) => sum + t.clickThroughRate, 0) / triggerMetrics.length).toFixed(1)
    : 0;
  const totalARLaunches = triggerMetrics.reduce((sum, t) => sum + t.arLaunches, 0);

  return (
    <div className="min-h-screen px-4 sm:px-6 py-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Trigger Analytics</h1>
          <p className="text-white/50">Track click-through rates and engagement metrics per trigger timestamp</p>
        </div>

        {/* Episode Filter */}
        <div className="mb-6">
          <Select value={selectedEpisode} onValueChange={setSelectedEpisode}>
            <SelectTrigger className="w-64 bg-[#13131a] border-white/10 text-white">
              <SelectValue placeholder="All Episodes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Episodes</SelectItem>
              {episodes.map(ep => (
                <SelectItem key={ep.id} value={ep.id}>{ep.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-[#13131a] border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/60 flex items-center gap-2">
                <Video className="w-4 h-4" />
                Portal Opens
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalPortalOpens}</div>
            </CardContent>
          </Card>

          <Card className="bg-[#13131a] border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/60 flex items-center gap-2">
                <MousePointer className="w-4 h-4" />
                Shop Clicks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalShopClicks}</div>
            </CardContent>
          </Card>

          <Card className="bg-[#13131a] border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/60 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Avg CTR
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{averageCTR}%</div>
            </CardContent>
          </Card>

          <Card className="bg-[#13131a] border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/60 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                AR Launches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalARLaunches}</div>
            </CardContent>
          </Card>
        </div>

        {/* CTR Chart */}
        <Card className="bg-[#13131a] border-white/10 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Click-Through Rate by Trigger</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ctrData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="name" 
                  stroke="rgba(255,255,255,0.4)" 
                  tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fill: 'rgba(255,255,255,0.6)' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1c1c28', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="ctr" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Engagement Timeline */}
        <Card className="bg-[#13131a] border-white/10 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Total Engagement by Trigger</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={ctrData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="name" 
                  stroke="rgba(255,255,255,0.4)" 
                  tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fill: 'rgba(255,255,255,0.6)' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1c1c28', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.6)' }} />
                <Line type="monotone" dataKey="engagement" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Detailed Metrics Table */}
        <Card className="bg-[#13131a] border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Trigger Performance Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-2 text-white/60 font-medium">Episode</th>
                    <th className="text-left py-3 px-2 text-white/60 font-medium">Product</th>
                    <th className="text-left py-3 px-2 text-white/60 font-medium">Time</th>
                    <th className="text-right py-3 px-2 text-white/60 font-medium">Opens</th>
                    <th className="text-right py-3 px-2 text-white/60 font-medium">Clicks</th>
                    <th className="text-right py-3 px-2 text-white/60 font-medium">CTR</th>
                    <th className="text-right py-3 px-2 text-white/60 font-medium">AR</th>
                    <th className="text-right py-3 px-2 text-white/60 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {triggerMetrics.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-8 text-white/30">
                        No trigger analytics data available
                      </td>
                    </tr>
                  ) : (
                    triggerMetrics.map((metric, idx) => (
                      <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="py-3 px-2 text-white/80">{metric.episodeTitle}</td>
                        <td className="py-3 px-2 text-white/80">{metric.productName}</td>
                        <td className="py-3 px-2 text-white/60">{metric.timestampLabel}</td>
                        <td className="py-3 px-2 text-right text-white/80">{metric.portalOpens}</td>
                        <td className="py-3 px-2 text-right text-white/80">{metric.shopClicks}</td>
                        <td className="py-3 px-2 text-right">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            metric.clickThroughRate >= 20 ? 'bg-green-500/20 text-green-400' :
                            metric.clickThroughRate >= 10 ? 'bg-amber-500/20 text-amber-400' :
                            'bg-white/10 text-white/60'
                          }`}>
                            {metric.clickThroughRate}%
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right text-white/80">{metric.arLaunches}</td>
                        <td className="py-3 px-2 text-right text-white/80 font-medium">{metric.totalEngagement}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}