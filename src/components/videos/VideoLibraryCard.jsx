import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import FloorAssignmentControl from "./FloorAssignmentControl";

// Dedicated card for the Video Library grid. Mirrors EpisodeCard's visual
// but adds a per-card floor-assignment row (badges + "Floors" popover).
export default function VideoLibraryCard({
  episode,
  index,
  floors,
  isAdmin,
  onAssignFloors,
}) {
  const themeColor = episode.theme_color || "#8B5CF6";
  const triggerCount = episode.triggers?.length || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
    >
      <div className="bg-[#13131a] rounded-2xl overflow-hidden border border-white/[0.06] hover:border-white/[0.14] transition-colors">
        <Link to={createPageUrl(`Player?id=${episode.id}`)} className="block group">
          {/* Thumbnail */}
          <div className="aspect-video bg-gradient-to-br from-[#1c1c28] to-[#0f0f17] relative overflow-hidden">
            {episode.thumbnail_url ? (
              <img
                src={episode.thumbnail_url}
                alt={episode.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${themeColor}18` }}>
                  <Play className="w-5 h-5" style={{ color: themeColor }} />
                </div>
              </div>
            )}

            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <Play className="w-5 h-5 text-white ml-0.5" />
              </div>
            </div>

            <div className="absolute top-2 right-2">
              <div className={`w-2 h-2 rounded-full ${
                episode.status === "published" ? "bg-emerald-400" :
                episode.status === "archived" ? "bg-white/30" : "bg-amber-400"
              }`} />
            </div>

            {triggerCount > 0 && (
              <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm rounded-full text-[10px] text-white/70">
                {triggerCount} trigger{triggerCount !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        </Link>

        {/* Info footer */}
        <div className="p-3 space-y-2">
          <h3 className="text-sm font-medium text-white/90 truncate leading-tight">{episode.title}</h3>

          <FloorAssignmentControl
            episode={episode}
            floors={floors}
            onSave={onAssignFloors}
            disabled={!isAdmin}
          />
        </div>
      </div>
    </motion.div>
  );
}