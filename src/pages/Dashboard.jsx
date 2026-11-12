import React, { useState, useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Plus, Tv } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ConciergeHero from "../components/dashboard/ConciergeHero";
import FloorBand from "../components/dashboard/FloorBand";
import ElevatorIndicator from "../components/dashboard/ElevatorIndicator";
import { resolveFloors, DEFAULT_FLOORS } from "../components/dashboard/floors";
import LogoUploader from "../components/dashboard/LogoUploader";
import FloorManager from "../components/dashboard/FloorManager";
import FilterDrawer from "../components/dashboard/FilterDrawer";
import CarouselImageManager from "../components/landing/CarouselImageManager";
import BulkImportDialog from "../components/import/BulkImportDialog";
import AppearancePanel from "../components/dashboard/AppearancePanel";

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showManager, setShowManager] = useState(false);

  const { data: episodes = [], isLoading } = useQuery({
    queryKey: ["episodes"],
    queryFn: () => base44.entities.Episode.list("-created_date"),
  });

  const { data: settings = [] } = useQuery({
    queryKey: ["siteSettings"],
    queryFn: () => base44.entities.SiteSettings.list(),
  });

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: carouselImages = [] } = useQuery({
    queryKey: ["carouselImages"],
    queryFn: () => base44.entities.CarouselImage.list("order", 10),
  });

  const isAdmin = user?.role === "admin";
  const urlParams = new URLSearchParams(window.location.search);
  const previewAsUser = urlParams.get("preview") === "user";
  const effectiveIsAdmin = isAdmin && !previewAsUser;
  const siteSettings = settings[0];
  const rowLabels = siteSettings?.row_labels || {};

  const resolvedFloors = useMemo(
    () => resolveFloors(siteSettings?.floors_config, rowLabels),
    [siteSettings?.floors_config, rowLabels]
  );
  const floorKeys = resolvedFloors.map((f) => f.key).join(",");

  const filteredAndSortedEpisodes = useMemo(() => {
    let filtered = [...episodes];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((ep) => ep.title?.toLowerCase().includes(query));
    }
    if (statusFilter !== "all") filtered = filtered.filter((ep) => ep.status === statusFilter);
    if (categoryFilter !== "all") filtered = filtered.filter((ep) => ep.category === categoryFilter);
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest": return new Date(b.created_date) - new Date(a.created_date);
        case "oldest": return new Date(a.created_date) - new Date(b.created_date);
        case "title_asc": return (a.title || "").localeCompare(b.title || "");
        case "title_desc": return (b.title || "").localeCompare(a.title || "");
        case "most_triggers": return (b.triggers?.length || 0) - (a.triggers?.length || 0);
        default: return 0;
      }
    });
    return filtered;
  }, [episodes, searchQuery, statusFilter, categoryFilter, sortBy]);

  // ── Scroll spy: which floor is active ──
  const floorRefs = useRef({});
  const [activeFloor, setActiveFloor] = useState(resolvedFloors[0]?.key);

  useEffect(() => {
    if (resolvedFloors.length && !resolvedFloors.find((f) => f.key === activeFloor)) {
      setActiveFloor(resolvedFloors[0].key);
    }
  }, [floorKeys]);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const targetLine = window.innerHeight * 0.35;
        let closestKey = null;
        let closestDist = Infinity;
        for (const floor of resolvedFloors) {
          const el = floorRefs.current[floor.key];
          if (!el) continue;
          const rect = el.getBoundingClientRect();
          const dist = Math.abs(rect.top - targetLine);
          if (dist < closestDist) {
            closestDist = dist;
            closestKey = floor.key;
          }
        }
        if (closestKey) setActiveFloor(closestKey);
        ticking = false;
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // initial sync
    return () => window.removeEventListener("scroll", handleScroll);
  }, [floorKeys, isLoading]);

  const jumpToFloor = (key) => {
    setActiveFloor(key); // instant highlight before scroll settles
    floorRefs.current[key]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const activeFloorObj = resolvedFloors.find((f) => f.key === activeFloor) || resolvedFloors[0];
  const showingFloors = !isLoading && episodes.length > 0 && filteredAndSortedEpisodes.length > 0;

  return (
    <div className="min-h-screen bg-[#120e0a] text-[#EDE3D0]">
      <ConciergeHero
        images={carouselImages}
        effectiveIsAdmin={effectiveIsAdmin}
        onOpenManager={() => setShowManager(true)}
        siteSettings={siteSettings}
      />

      {/* ── Controls bar ── */}
      <div className="px-4 sm:px-6 max-w-7xl mx-auto py-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <FilterDrawer
              searchQuery={searchQuery} setSearchQuery={setSearchQuery}
              statusFilter={statusFilter} setStatusFilter={setStatusFilter}
              categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter}
              sortBy={sortBy} setSortBy={setSortBy}
            />
            {effectiveIsAdmin && <LogoUploader currentLogo={siteSettings?.logo_url} settingsId={siteSettings?.id} />}
            {effectiveIsAdmin && <FloorManager floorsConfig={siteSettings?.floors_config} rowLabels={rowLabels} settingsId={siteSettings?.id} />}
            {effectiveIsAdmin && <AppearancePanel siteSettings={siteSettings} />}
            {effectiveIsAdmin && <BulkImportDialog />}
            {effectiveIsAdmin && (
              <Link to={createPageUrl("EpisodeEditor")}>
                <Button className="bg-gradient-to-r from-[#D4AF37] to-[#B89045] hover:opacity-90 text-[#1a1410] h-9 gap-2 text-sm">
                  <Plus className="w-4 h-4" />
                  Upload
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Floor bands ── */}
      {isLoading ? (
        <div className="px-4 sm:px-6 max-w-[1800px] mx-auto space-y-10 pb-16">
          {(resolvedFloors.length ? resolvedFloors : DEFAULT_FLOORS).map((f) => (
            <div key={f.key}>
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="w-14 h-14 rounded-xl bg-[#241c15]" />
                <Skeleton className="h-7 w-48 bg-[#241c15]" />
              </div>
              <div className="flex gap-4 overflow-hidden">
                {Array(5).fill(0).map((_, j) => (
                  <Skeleton key={j} className="h-64 w-40 flex-shrink-0 bg-[#1a1410]" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : episodes.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl border border-[#B89045]/30 bg-[#1a1410] flex items-center justify-center">
            <Tv className="w-8 h-8 text-[#D4AF37]" />
          </div>
          <h3 className="font-display text-2xl text-[#EDE3D0] mb-2">No episodes yet</h3>
          <p className="text-[#EDE3D0]/40 mb-6">Create your first episode to open the floors.</p>
          {effectiveIsAdmin && (
            <Link to={createPageUrl("EpisodeEditor")}>
              <Button className="bg-gradient-to-r from-[#D4AF37] to-[#B89045] hover:opacity-90 text-[#1a1410] rounded-xl h-11 px-6 gap-2">
                <Plus className="w-4 h-4" />
                Create Episode
              </Button>
            </Link>
          )}
        </div>
      ) : filteredAndSortedEpisodes.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl border border-[#B89045]/30 bg-[#1a1410] flex items-center justify-center">
            <Tv className="w-8 h-8 text-[#D4AF37]" />
          </div>
          <h3 className="font-display text-2xl text-[#EDE3D0] mb-2">No episodes found</h3>
          <p className="text-[#EDE3D0]/40 mb-6">Try adjusting your filters</p>
          <Button
            onClick={() => { setSearchQuery(""); setStatusFilter("all"); setCategoryFilter("all"); }}
            variant="outline"
            className="border-[#B89045]/25 text-[#EDE3D0] hover:bg-[#1a1410]"
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <>
          {resolvedFloors.map((floor, i) => (
            <FloorBand
              key={floor.key}
              floor={floor}
              index={i}
              episodes={filteredAndSortedEpisodes}
              rowLabels={rowLabels}
              ref={(el) => { if (el) floorRefs.current[floor.key] = el; }}
            />
          ))}
          <div className="pb-16" />
        </>
      )}

      {/* Brass elevator indicator */}
      {showingFloors && (
        <ElevatorIndicator
          floors={resolvedFloors}
          activeKey={activeFloor}
          rowLabels={rowLabels}
          onJump={jumpToFloor}
          activeFloor={activeFloorObj}
        />
      )}

      {showManager && <CarouselImageManager onClose={() => setShowManager(false)} />}
    </div>
  );
}