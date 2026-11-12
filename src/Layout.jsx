import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "./utils";
import { Tv, ShoppingBag, User, Eye, EyeOff } from "lucide-react";

import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import NotificationBell from "./components/profile/NotificationBell";
import NavEmblem from "@/components/layout/cabinet/NavEmblem";
import DashboardDropdown from "@/components/layout/DashboardDropdown";
import CavettoCrestCrown from "@/components/layout/cabinet/CavettoCrestCrown";
import FleurDeLisCenterpiece from "@/components/layout/cabinet/FleurDeLisCenterpiece";
import GreekKeyCorner from "@/components/layout/cabinet/GreekKeyCorner";
import FloatingDashboardButton from "@/components/dashboard/FloatingDashboardButton";

function NavLink({ item, isActive }) {
  const Icon = item.icon;
  return (
    <Link
      to={createPageUrl(item.page)}
      className={`relative flex items-center gap-2 px-2 sm:px-4 py-2 rounded-lg text-sm font-display tracking-wide transition-all duration-200 group ${
        isActive
          ? "text-[#E6D3B6]"
          : "text-[#E6D3B6]/60 hover:text-[#E6D3B6] hover:bg-black/20"
      }`}
      style={
        isActive
          ? {
              backgroundImage:
                "repeating-linear-gradient(90deg, rgba(230,200,150,0.04) 0px, rgba(230,200,150,0.04) 1px, transparent 1px, transparent 4px), linear-gradient(180deg, rgba(184,144,69,0.18) 0%, rgba(120,85,40,0.10) 100%)",
              boxShadow:
                "inset 0 1px 0 rgba(245,230,200,0.18), inset 0 -1px 0 rgba(0,0,0,0.35), inset 0 0 0 1px rgba(184,144,69,0.45)",
            }
          : undefined
      }
    >
      <Icon className="w-4 h-4" />
      <span className="hidden lg:inline">{item.name}</span>
      <span className="lg:hidden absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1 bg-[#2A1F17] border border-[#B8934D]/40 text-[#E6D3B6] text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50 shadow-lg">
        {item.name}
      </span>
    </Link>
  );
}

export default function Layout({ children, currentPageName }) {
  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: settings = [] } = useQuery({
    queryKey: ["siteSettings"],
    queryFn: () => base44.entities.SiteSettings.list(),
  });

  const siteSettings = settings[0];

  // Favicon + CSS color variables are now applied globally by the
  // SiteBranding hook mounted at the app root (see src/App.jsx).

  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  const searchParams = new URLSearchParams(location.search);
  const previewAsUser = searchParams.get("preview") === "user";

  const togglePreview = () => {
    const params = new URLSearchParams(location.search);
    if (previewAsUser) {
      params.delete("preview");
    } else {
      params.set("preview", "user");
    }
    navigate({ search: params.toString() }, { replace: true });
  };

  const primaryNav = [
    { name: "Videos", page: "Videos", icon: Tv },
    { name: "Orders", page: "Orders", icon: ShoppingBag },
    { name: "Invites", page: "CollaborationInvites", icon: User },
  ];

  const adminToolPages = ["Dashboard", "Wardrobe", "Analytics", "TriggerAnalytics", "EngagementAnalytics", "FloorAnalytics", "MerchantApproval"];

  const mid = Math.floor(primaryNav.length / 2);
  const leftNav = primaryNav.slice(0, mid);
  const rightNav = primaryNav.slice(mid);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <style>{`
        :root {
          --accent: #8B5CF6;
          --accent-glow: rgba(139, 92, 246, 0.3);
          --surface: #13131a;
          --surface-light: #1c1c28;
          --border: rgba(255,255,255,0.06);
          --text-muted: rgba(255,255,255,0.5);
        }
        * { scrollbar-width: thin; scrollbar-color: var(--surface-light) transparent; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--surface-light); border-radius: 3px; }
      `}</style>

      {/* Top Nav — Beaux-Arts cornice over smooth walnut panel */}
      <nav
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          backgroundColor: "#120a04",
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(230,200,150,0.012) 0px, rgba(230,200,150,0.012) 1px, transparent 1px, transparent 3px), linear-gradient(180deg, #1d1208 0%, #120a04 100%)",
          boxShadow: "0 10px 28px rgba(0,0,0,0.55)",
        }}
      >
        {/* Cavetto crest crown tier */}
        <CavettoCrestCrown />

        {/* Smooth walnut panel framed by gold hairlines */}
        <div className="relative">
          {/* Double gold border with Greek-key corners */}
          <div className="relative">
            <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.55) 12%, rgba(212,175,55,0.8) 50%, rgba(212,175,55,0.55) 88%, transparent)" }} />
            <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.3) 12%, rgba(212,175,55,0.45) 50%, rgba(212,175,55,0.3) 88%, transparent)" }} />
            <GreekKeyCorner className="absolute left-1 sm:left-2 -top-0.5 h-4 w-4 sm:h-5 sm:w-5 opacity-90" />
            <GreekKeyCorner className="absolute right-1 sm:right-2 -top-0.5 h-4 w-4 sm:h-5 sm:w-5 opacity-90" flip="scaleX(-1)" />
          </div>

          <div className="max-w-7xl mx-auto px-2 sm:px-6">
            <div className="relative flex items-center h-16 sm:h-[68px]">
              {/* Left zone */}
              <div className="flex-1 flex items-center justify-start gap-2 sm:gap-3 pl-1">
                <NavEmblem logoUrl={siteSettings?.logo_url} size="sm" />
                {isAdmin && (
                  <DashboardDropdown isActive={adminToolPages.includes(currentPageName)} />
                )}
                <div className="hidden sm:flex items-center gap-1 sm:gap-2">
                  {leftNav.map((item) => (
                    <NavLink key={item.page} item={item} isActive={currentPageName === item.page} />
                  ))}
                </div>
              </div>

              {/* Central laurel-wreath monogram centerpiece */}
              <div className="absolute left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                <FleurDeLisCenterpiece className="w-[96px] h-[96px] sm:w-[116px] sm:h-[116px]" />
              </div>

              {/* Right zone */}
              <div className="flex-1 flex items-center justify-center sm:justify-end gap-1 sm:gap-2">
                <Link to={createPageUrl("UserProfile")} className="sm:hidden">
                  <button className="p-2 rounded-lg hover:bg-black/20 transition-colors">
                    <User className="w-5 h-5 text-[#E6D3B6]/70" />
                  </button>
                </Link>
                <div className="hidden sm:flex items-center gap-1 sm:gap-2">
                  {rightNav.map((item) => (
                    <NavLink key={item.page} item={item} isActive={currentPageName === item.page} />
                  ))}
                </div>
              </div>

              {/* Right controls — desktop only */}
              <div className="hidden sm:flex items-center gap-1 sm:gap-2">
                {isAdmin && (
                  <button
                    onClick={togglePreview}
                    title={previewAsUser ? "Exit User Preview" : "Preview as User"}
                    className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      previewAsUser
                        ? "border-[#B8934D]/60 text-[#E6D3B6] hover:bg-black/20"
                        : "border-[#B8934D]/25 text-[#E6D3B6]/50 hover:text-[#E6D3B6] hover:bg-black/20"
                    }`}
                    style={
                      previewAsUser
                        ? {
                            backgroundImage: "linear-gradient(180deg, rgba(184,147,77,0.22) 0%, rgba(120,85,40,0.12) 100%)",
                            boxShadow: "inset 0 1px 0 rgba(230,211,182,0.2)",
                          }
                        : undefined
                    }
                  >
                    {previewAsUser ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span className="hidden lg:inline">{previewAsUser ? "Exit Preview" : "User View"}</span>
                  </button>
                )}
                <NotificationBell />
                <Link to={createPageUrl("UserProfile")}>
                  <button className="p-2 rounded-lg hover:bg-black/20 transition-colors">
                    <User className="w-5 h-5 text-[#E6D3B6]/70" />
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Double gold border with Greek-key corners */}
          <div className="relative">
            <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.3) 12%, rgba(212,175,55,0.45) 50%, rgba(212,175,55,0.3) 88%, transparent)" }} />
            <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.55) 12%, rgba(212,175,55,0.8) 50%, rgba(212,175,55,0.55) 88%, transparent)", boxShadow: "0 2px 6px rgba(0,0,0,0.4)" }} />
            <GreekKeyCorner className="absolute left-1 sm:left-2 -bottom-0.5 h-4 w-4 sm:h-5 sm:w-5 opacity-90" flip="scaleY(-1)" />
            <GreekKeyCorner className="absolute right-1 sm:right-2 -bottom-0.5 h-4 w-4 sm:h-5 sm:w-5 opacity-90" flip="scale(-1,-1)" />
          </div>
        </div>
      </nav>

      <main className="pt-[96px] sm:pt-[100px]">{children}</main>

      {isAdmin && currentPageName !== "Dashboard" && <FloatingDashboardButton />}
    </div>
  );
}