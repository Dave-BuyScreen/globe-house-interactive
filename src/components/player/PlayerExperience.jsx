import React, { useState, useCallback } from "react";
import VideoSourcePlayer from "./VideoSourcePlayer";
import PortalOverlay from "../portal/PortalOverlay";
import ConfessionalPanel from "../portal/ConfessionalPanel";
import BuyScreenPanel from "../portal/BuyScreenPanel";
import ARViewer from "../portal/ARViewer";
import ShopShowroomPanel from "../portal/ShopShowroomPanel";
import EpisodeSidebar from "./EpisodeSidebar";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function PlayerExperience({ episode }) {
  const [portalState, setPortalState] = useState("idle"); // idle | choosing | confessional | buyscreen | ar | showroom
  const [activeTrigger, setActiveTrigger] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);


  const themeColor = episode?.theme_color || "#8B5CF6";

  // Fetch VideoObjectMappings for this episode
  const { data: mappings = [] } = useQuery({
    queryKey: ["videoMappings", episode?.id],
    queryFn: () => base44.entities.VideoObjectMapping.filter({ episode_id: episode?.id, status: "confirmed" }),
    enabled: !!episode?.id,
  });

  // Check if user is admin and in preview mode
  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const urlParams = new URLSearchParams(window.location.search);
  const previewAsUser = urlParams.get("preview") === "user";
  const isAdminPreview = user?.role === "admin" && !previewAsUser;
  
  // Find first trigger with product data for showroom
  const firstProductTrigger = episode?.triggers?.find(t => t.product_name && (t.model_url || t.model_embed_code || t.product_image_url));

  // Determine what content a trigger actually has configured
  const hasConfession = useCallback((t) => !!(t && (t.prompt_text || t.confessional_video_url)), []);
  const hasProduct = useCallback((t) => !!(t && (t.product_name || t.product_image_url || t.product_price || t.shop_url || t.model_url || t.model_embed_code)), []);

  const handleTrigger = useCallback((trigger) => {
    const hasConf = hasConfession(trigger);
    const hasProd = hasProduct(trigger);

    // No configured content — leave playback unobstructed
    if (!hasConf && !hasProd) return;

    setActiveTrigger(trigger);

    if (hasConf && hasProd) {
      // Both: show the choice screen
      setPortalState("choosing");
    } else if (hasProd) {
      // Product only: go straight to BuyScreen
      setPortalState("buyscreen");
    } else {
      // Confession only: show the choice screen (renders confession card alone)
      setPortalState("choosing");
    }

    base44.analytics.track({
      eventName: "portal_open",
      properties: { episode_id: episode?.id || "", timestamp: trigger?.timestamp || 0 }
    });
  }, [episode, hasConfession, hasProduct]);

  const handleTimeUpdate = useCallback((time) => {
    setCurrentTime(time);
  }, []);

  const handleSidebarProductClick = useCallback((trigger) => {
    setActiveTrigger(trigger);
    setPortalState("buyscreen");
    if (window.__portalPauseVideo) {
      window.__portalPauseVideo();
    }
    base44.analytics.track({
      eventName: "sidebar_product_click",
      properties: { episode_id: episode?.id || "", product: trigger?.product_name }
    });
  }, [episode]);

  const handleSidebarConfessionalClick = useCallback((trigger) => {
    setActiveTrigger(trigger);
    setPortalState("confessional");
    if (window.__portalPauseVideo) {
      window.__portalPauseVideo();
    }
    base44.analytics.track({
      eventName: "sidebar_confessional_click",
      properties: { episode_id: episode?.id || "" }
    });
  }, [episode]);



  const handleClose = useCallback(() => {
    setPortalState("idle");
    setActiveTrigger(null);

    // Resume video
    if (window.__portalResumeVideo) {
      window.__portalResumeVideo();
    }

    base44.analytics.track({
      eventName: "video_resume",
      properties: { episode_id: episode?.id || "" }
    });
  }, [episode]);

  const handleChooseConfessional = () => {
    setPortalState("confessional");
    base44.analytics.track({
      eventName: "confessional_view",
      properties: { episode_id: episode?.id || "" }
    });
  };

  const handleChooseBuyScreen = () => {
    setPortalState("buyscreen");
    base44.analytics.track({
      eventName: "buyscreen_view",
      properties: { episode_id: episode?.id || "" }
    });
  };

  const handleOpenShowroom = () => {
    if (firstProductTrigger) {
      // Pause main video
      if (window.__portalPauseVideo) {
        window.__portalPauseVideo();
      }
      
      setActiveTrigger(firstProductTrigger);
      setPortalState("showroom");
      base44.analytics.track({
        eventName: "showroom_open",
        properties: { episode_id: episode?.id || "" }
      });
    }
  };

  const handleShopClick = () => {
    if (activeTrigger?.shop_url) {
      window.open(activeTrigger.shop_url, '_blank');
      base44.analytics.track({
        eventName: "shop_click",
        properties: { episode_id: episode?.id || "", product: activeTrigger?.product_name }
      });
    }
  };

  if (!episode) return null;

  return (
    <div className="relative w-full">
      {/* Auto-detecting Video Player */}
      <VideoSourcePlayer
        vimeoUrl={episode.vimeo_url}
        youtubeUrl={episode.youtube_url}
        triggers={episode.triggers || []}
        onTrigger={handleTrigger}
        onTimeUpdate={handleTimeUpdate}
        themeColor={themeColor}
        mappings={mappings}
      />

      {/* Shop & Watch Button - Below video player */}
      {firstProductTrigger && (
        <div className="w-full flex justify-center mt-4 mb-6 px-4">
          <Button
            onClick={handleOpenShowroom}
            className="h-14 px-8 rounded-full gap-2 shadow-2xl border border-white/20 text-white font-semibold bg-purple-600 hover:bg-purple-700"
          >
            <ShoppingBag className="w-5 h-5" />
            <span>Shop & Watch</span>
          </Button>
        </div>
      )}

      {/* Portal Choice Overlay */}
      <PortalOverlay
        isOpen={portalState === "choosing"}
        themeColor={themeColor}
        trigger={activeTrigger}
        onChooseConfessional={handleChooseConfessional}
        onChooseBuyScreen={handleChooseBuyScreen}
        showConfession={hasConfession(activeTrigger)}
        showBuyScreen={hasProduct(activeTrigger)}
      />

      {/* Confessional */}
      <ConfessionalPanel
        isOpen={portalState === "confessional"}
        trigger={activeTrigger}
        themeColor={themeColor}
        onClose={handleClose}
        episodeId={episode?.id}
      />

      {/* BuyScreen */}
      <BuyScreenPanel
        isOpen={portalState === "buyscreen"}
        trigger={activeTrigger}
        themeColor={themeColor}
        onClose={handleClose}
        episodeId={episode?.id}
        episodeTitle={episode?.title}
      />

      {/* AR Viewer */}
      <ARViewer
        isOpen={portalState === "ar"}
        modelUrl={activeTrigger?.model_url}
        productName={activeTrigger?.product_name}
        onClose={handleClose}
      />

      {/* Shop Showroom - Split view with confessional and 3D product */}
      <ShopShowroomPanel
        isOpen={portalState === "showroom"}
        trigger={activeTrigger}
        themeColor={themeColor}
        onClose={handleClose}
        onShopClick={handleShopClick}
      />

      {/* Episode Sidebar - Always visible catalog */}
      <EpisodeSidebar
        episode={episode}
        currentTime={currentTime}
        onProductClick={handleSidebarProductClick}
        onConfessionalClick={handleSidebarConfessionalClick}
        themeColor={themeColor}
      />
    </div>
  );
}