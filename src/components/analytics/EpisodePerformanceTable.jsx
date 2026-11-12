import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

export default function EpisodePerformanceTable({ episodes, analytics }) {
  const getEpisodeMetrics = (episodeId) => {
    const episodeEvents = analytics.filter(e => e.episode_id === episodeId);
    const views = episodeEvents.filter(e => e.event_type === "portal_open").length;
    const triggerClicks = episodeEvents.filter(e => 
      e.event_type === "confessional_view" || e.event_type === "buyscreen_view"
    ).length;
    const conversions = episodeEvents.filter(e => e.event_type === "shop_click").length;
    const ctr = views > 0 ? ((triggerClicks / views) * 100).toFixed(1) : 0;
    const conversionRate = triggerClicks > 0 ? ((conversions / triggerClicks) * 100).toFixed(1) : 0;
    
    return { views, triggerClicks, conversions, ctr, conversionRate };
  };

  const sortedEpisodes = [...episodes].sort((a, b) => {
    const aMetrics = getEpisodeMetrics(a.id);
    const bMetrics = getEpisodeMetrics(b.id);
    return bMetrics.views - aMetrics.views;
  });

  return (
    <div className="bg-[#13131a] border border-white/[0.06] rounded-xl overflow-hidden">
      <div className="p-6 border-b border-white/[0.06]">
        <h3 className="text-lg font-semibold text-white">Episode Performance</h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="border-white/[0.06] hover:bg-transparent">
            <TableHead className="text-white/60">Episode</TableHead>
            <TableHead className="text-white/60">Views</TableHead>
            <TableHead className="text-white/60">Trigger Clicks</TableHead>
            <TableHead className="text-white/60">CTR</TableHead>
            <TableHead className="text-white/60">Conversions</TableHead>
            <TableHead className="text-white/60">Conv. Rate</TableHead>
            <TableHead className="text-white/60"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedEpisodes.map((episode) => {
            const metrics = getEpisodeMetrics(episode.id);
            return (
              <TableRow key={episode.id} className="border-white/[0.06] hover:bg-white/[0.02]">
                <TableCell>
                  <div className="flex items-center gap-3">
                    {episode.thumbnail_url ? (
                      <img 
                        src={episode.thumbnail_url} 
                        alt={episode.title}
                        loading="lazy"
                        className="w-12 h-8 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-8 bg-white/[0.04] rounded" />
                    )}
                    <div>
                      <p className="text-white/90 font-medium text-sm">{episode.title}</p>
                      <Badge className={`text-[10px] mt-1 ${
                        episode.status === "published" 
                          ? "bg-emerald-500/20 text-emerald-400" 
                          : "bg-amber-500/20 text-amber-400"
                      }`}>
                        {episode.status}
                      </Badge>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-white/80">{metrics.views}</TableCell>
                <TableCell className="text-white/80">{metrics.triggerClicks}</TableCell>
                <TableCell>
                  <span className={`font-medium ${
                    parseFloat(metrics.ctr) > 50 ? 'text-emerald-400' :
                    parseFloat(metrics.ctr) > 25 ? 'text-blue-400' :
                    'text-white/60'
                  }`}>
                    {metrics.ctr}%
                  </span>
                </TableCell>
                <TableCell className="text-white/80">{metrics.conversions}</TableCell>
                <TableCell>
                  <span className={`font-medium ${
                    parseFloat(metrics.conversionRate) > 20 ? 'text-emerald-400' :
                    parseFloat(metrics.conversionRate) > 10 ? 'text-blue-400' :
                    'text-white/60'
                  }`}>
                    {metrics.conversionRate}%
                  </span>
                </TableCell>
                <TableCell>
                  <Link to={createPageUrl(`Player?id=${episode.id}`)}>
                    <ArrowRight className="w-4 h-4 text-white/40 hover:text-white/80 transition-colors" />
                  </Link>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}