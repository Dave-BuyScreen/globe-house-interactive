import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "../utils";
import { Link } from "react-router-dom";
import { Bookmark, ExternalLink, Trash2, ShoppingBag, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

export default function Wishlist() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["wishlist", user?.email],
    queryFn: () => base44.entities.WishlistItem.filter({ user_email: user.email }, "-created_date"),
    enabled: !!user?.email,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.WishlistItem.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wishlist"] }),
  });

  const formatTime = (seconds) => {
    if (!seconds) return null;
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen px-4 sm:px-6 py-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center">
          <Bookmark className="w-6 h-6 text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Saved Items</h1>
          <p className="text-white/30 text-sm">Products you saved while watching</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-[#13131a] rounded-2xl overflow-hidden border border-white/[0.06]">
              <Skeleton className="aspect-square bg-white/[0.04]" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-2/3 bg-white/[0.04]" />
                <Skeleton className="h-3 w-1/2 bg-white/[0.04]" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-violet-500/10 flex items-center justify-center">
            <ShoppingBag className="w-8 h-8 text-violet-400/50" />
          </div>
          <h3 className="text-xl font-semibold text-white/50 mb-2">No saved items yet</h3>
          <p className="text-white/20 text-sm mb-6">Tap the bookmark icon on any product while watching to save it here</p>
          <Link to={createPageUrl("Dashboard")}>
            <Button className="bg-violet-500 hover:bg-violet-600 rounded-xl">
              <Play className="w-4 h-4 mr-2" />
              Start Watching
            </Button>
          </Link>
        </div>
      ) : (
        <AnimatePresence>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.04 }}
                className="bg-[#13131a] border border-white/[0.06] rounded-2xl overflow-hidden group hover:border-white/[0.12] transition-all duration-300"
              >
                {/* Product Image */}
                <div className="aspect-square bg-gradient-to-br from-[#1c1c28] to-[#13131a] relative overflow-hidden flex items-center justify-center">
                  {item.product_image_url ? (
                    <img
                      src={item.product_image_url}
                      alt={item.product_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <ShoppingBag className="w-10 h-10 text-white/10" />
                  )}

                  {/* Episode link badge */}
                  {item.episode_id && (
                    <Link
                      to={createPageUrl(`Player?id=${item.episode_id}`)}
                      className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2.5 py-1.5 rounded-full text-xs text-white/60 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Play className="w-3 h-3" />
                      <span className="truncate max-w-[120px]">{item.episode_title || "Watch"}</span>
                      {item.trigger_timestamp && (
                        <span className="text-white/30">@ {formatTime(item.trigger_timestamp)}</span>
                      )}
                    </Link>
                  )}

                  {/* Remove button */}
                  <button
                    onClick={() => deleteMutation.mutate(item.id)}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white/30 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Info */}
                <div className="p-4 space-y-3">
                  <div>
                    {item.product_brand && (
                      <p className="text-xs font-medium uppercase tracking-widest text-violet-400 mb-0.5">
                        {item.product_brand}
                      </p>
                    )}
                    <h3 className="font-medium text-white/90 text-sm leading-tight">{item.product_name}</h3>
                    {item.product_description && (
                      <p className="text-white/30 text-xs mt-1 leading-relaxed line-clamp-2">{item.product_description}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    {item.product_price && (
                      <p className="text-lg font-bold text-white">{item.product_price}</p>
                    )}
                    {item.shop_url && (
                      <Button
                        size="sm"
                        onClick={() => window.open(item.shop_url, "_blank")}
                        className="h-8 px-3 rounded-lg text-xs gap-1.5 bg-violet-500 hover:bg-violet-600"
                      >
                        <ShoppingBag className="w-3 h-3" />
                        Shop
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}