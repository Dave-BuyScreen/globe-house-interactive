import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal } from "lucide-react";

export default function EpisodeFilters({ 
  searchQuery, 
  setSearchQuery, 
  statusFilter, 
  setStatusFilter,
  categoryFilter,
  setCategoryFilter,
  sortBy,
  setSortBy 
}) {
  return (
    <div className="bg-[#13131a] border border-white/[0.06] rounded-xl p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <SlidersHorizontal className="w-4 h-4 text-violet-400" />
        <h3 className="text-sm font-medium text-white/80">Filter & Sort</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search episodes..."
            className="pl-9 h-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30"
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-10 bg-white/[0.04] border-white/[0.08] text-white">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>

        {/* Category Filter */}
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="h-10 bg-white/[0.04] border-white/[0.08] text-white">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="red_rooster_jazz">Red Rooster Jazz</SelectItem>
            <SelectItem value="comedy_lounge">Comedy Lounge</SelectItem>
            <SelectItem value="documentaries">Documentaries</SelectItem>
            <SelectItem value="tv_shows">TV Shows</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort By */}
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="h-10 bg-white/[0.04] border-white/[0.08] text-white">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="title_asc">Title (A-Z)</SelectItem>
            <SelectItem value="title_desc">Title (Z-A)</SelectItem>
            <SelectItem value="most_triggers">Most Triggers</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}