import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, Search, X, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
];

const CATEGORY_OPTIONS = [
  { value: "all", label: "All Categories" },
  { value: "red_rooster_jazz", label: "Red Rooster Jazz" },
  { value: "comedy_lounge", label: "Comedy Lounge" },
  { value: "documentaries", label: "Documentaries" },
  { value: "tv_shows", label: "TV Shows" },
  { value: "other", label: "Other" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "title_asc", label: "Title A–Z" },
  { value: "title_desc", label: "Title Z–A" },
  { value: "most_triggers", label: "Most Triggers" },
];

export default function FilterDrawer({
  searchQuery, setSearchQuery,
  statusFilter, setStatusFilter,
  categoryFilter, setCategoryFilter,
  sortBy, setSortBy,
}) {
  const [open, setOpen] = useState(false);

  const hasActiveFilters = statusFilter !== "all" || categoryFilter !== "all" || sortBy !== "newest" || searchQuery;
  const activeCount = [
    statusFilter !== "all",
    categoryFilter !== "all",
    sortBy !== "newest",
    !!searchQuery,
  ].filter(Boolean).length;

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        {/* Search (always visible on md+) */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="pl-8 h-9 w-48 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 text-sm"
          />
        </div>

        {/* Filter toggle button */}
        <button
          onClick={() => setOpen(o => !o)}
          className={`relative flex items-center gap-2 h-9 px-3 rounded-lg border text-sm font-medium transition-all ${
            open || hasActiveFilters
              ? "bg-violet-500/15 border-violet-400/40 text-violet-300"
              : "bg-white/[0.04] border-white/[0.08] text-white/50 hover:text-white/80 hover:bg-white/[0.07]"
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Filters</span>
          {activeCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-violet-500 text-white text-[10px] flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>

        {/* Clear all (only when active) */}
        {hasActiveFilters && (
          <button
            onClick={() => { setSearchQuery(""); setStatusFilter("all"); setCategoryFilter("all"); setSortBy("newest"); }}
            className="h-9 px-2 text-white/30 hover:text-white/60 transition-colors"
            title="Clear all filters"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Drawer panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 top-full mt-2 z-50 bg-[#13131a] border border-white/[0.08] rounded-xl shadow-2xl p-4 w-72 space-y-5"
          >
            {/* Mobile search */}
            <div className="md:hidden relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search episodes..."
                className="pl-8 h-9 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 text-sm"
              />
            </div>

            {/* Status */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Status</p>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setStatusFilter(opt.value)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      statusFilter === opt.value
                        ? "bg-violet-500 text-white"
                        : "bg-white/[0.05] text-white/50 hover:bg-white/[0.09] hover:text-white/80"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Category</p>
              <div className="flex flex-col gap-1">
                {CATEGORY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setCategoryFilter(opt.value)}
                    className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-all ${
                      categoryFilter === opt.value
                        ? "bg-violet-500/15 text-violet-300"
                        : "text-white/50 hover:bg-white/[0.05] hover:text-white/80"
                    }`}
                  >
                    {opt.label}
                    {categoryFilter === opt.value && <Check className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Sort By</p>
              <div className="flex flex-col gap-1">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSortBy(opt.value)}
                    className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-all ${
                      sortBy === opt.value
                        ? "bg-violet-500/15 text-violet-300"
                        : "text-white/50 hover:bg-white/[0.05] hover:text-white/80"
                    }`}
                  >
                    {opt.label}
                    {sortBy === opt.value && <Check className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            </div>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="w-full text-white/30 hover:text-white text-xs h-8"
            >
              Done
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}