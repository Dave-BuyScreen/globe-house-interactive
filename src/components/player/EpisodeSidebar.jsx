import React from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Video, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function EpisodeSidebar({ 
  episode, 
  currentTime = 0,
  onProductClick,
  onConfessionalClick,
  themeColor = "#8B5CF6" 
}) {
  if (!episode?.triggers?.length) return null;

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Separate products and confessionals
  const products = episode.triggers.filter(t => t.product_name);
  const confessionals = episode.triggers.filter(t => t.confessional_video_url);

  // Check if a trigger is currently active (within 30 seconds)
  const isActive = (timestamp) => {
    return currentTime >= timestamp && currentTime <= timestamp + 30;
  };

  return (
    <div className="w-full mt-6 px-4 max-w-5xl mx-auto">
      <div className="bg-[#13131a] border border-white/[0.06] rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <ShoppingBag className="w-5 h-5" style={{ color: themeColor }} />
          Shop This Episode
        </h2>

        {/* Products Section */}
        {products.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-white/40 mb-3">Products</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {products.map((trigger, index) => {
                const active = isActive(trigger.timestamp);
                return (
                  <motion.button
                    key={index}
                    onClick={() => onProductClick(trigger)}
                    className="relative group text-left p-4 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.12] rounded-xl transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {active && (
                      <div 
                        className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse"
                        style={{ backgroundColor: themeColor, boxShadow: `0 0 12px ${themeColor}` }}
                      />
                    )}
                    
                    {trigger.product_image_url && (
                      <div className="w-full aspect-square bg-white/[0.02] rounded-lg mb-3 overflow-hidden">
                        <img 
                          src={trigger.product_image_url} 
                          alt={trigger.product_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-medium text-white/90 line-clamp-2">
                        {trigger.product_name}
                      </p>
                      {trigger.product_price && (
                        <span className="text-sm font-semibold text-white/70 whitespace-nowrap">
                          {trigger.product_price}
                        </span>
                      )}
                    </div>
                    
                    {trigger.product_brand && (
                      <p className="text-xs text-white/40 mb-2">{trigger.product_brand}</p>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs text-white/30">
                      <Clock className="w-3 h-3" />
                      {formatTime(trigger.timestamp)}
                    </div>
                    
                    {active && (
                      <Badge 
                        className="mt-2 text-[10px] border-0"
                        style={{ backgroundColor: `${themeColor}20`, color: themeColor }}
                      >
                        Playing Now
                      </Badge>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        {/* Confessionals Section */}
        {confessionals.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-white/40 mb-3">Behind the Scenes</h3>
            <div className="space-y-2">
              {confessionals.map((trigger, index) => {
                const active = isActive(trigger.timestamp);
                return (
                  <motion.button
                    key={index}
                    onClick={() => onConfessionalClick(trigger)}
                    className="relative group w-full flex items-center gap-4 p-3 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.12] rounded-xl transition-all text-left"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    {active && (
                      <div 
                        className="absolute -top-1 -left-1 w-3 h-3 rounded-full animate-pulse"
                        style={{ backgroundColor: themeColor, boxShadow: `0 0 12px ${themeColor}` }}
                      />
                    )}
                    
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center flex-shrink-0">
                      <Video className="w-5 h-5 text-violet-400" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/80 line-clamp-1 mb-1">
                        {trigger.prompt_text || "View Confessional"}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/30 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(trigger.timestamp)}
                        </span>
                        {trigger.confessional_duration && (
                          <span className="text-xs text-white/30">
                            • {Math.floor(trigger.confessional_duration)}s
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {active && (
                      <Badge 
                        className="text-[10px] border-0 flex-shrink-0"
                        style={{ backgroundColor: `${themeColor}20`, color: themeColor }}
                      >
                        Now
                      </Badge>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}