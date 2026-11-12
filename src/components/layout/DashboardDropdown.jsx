import React from "react";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  ShoppingBag,
  BarChart3,
  Flame,
  ShieldCheck,
  ChevronDown,
  Tv,
  User,
  Layers,
} from "lucide-react";
import { createPageUrl } from "@/utils";

const ADMIN_TOOLS = [
  { name: "Dashboard", page: "Dashboard", icon: LayoutDashboard },
  { name: "Wardrobe", page: "Wardrobe", icon: ShoppingBag },
  { name: "Analytics", page: "Analytics", icon: BarChart3 },
  { name: "Triggers", page: "TriggerAnalytics", icon: BarChart3 },
  { name: "Heatmaps", page: "EngagementAnalytics", icon: Flame },
  { name: "Floors", page: "FloorAnalytics", icon: Layers },
  { name: "Approvals", page: "MerchantApproval", icon: ShieldCheck },
];

// Primary nav tabs folded into the dropdown on mobile only
const MOBILE_NAV = [
  { name: "Videos", page: "Videos", icon: Tv },
  { name: "Orders", page: "Orders", icon: ShoppingBag },
  { name: "Invites", page: "CollaborationInvites", icon: User },
];

export default function DashboardDropdown({ isActive }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`relative flex items-center gap-2 px-2 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            isActive
              ? "text-[#F5E6C8]"
              : "text-[#E8D5AC]/60 hover:text-[#F5E6C8] hover:bg-black/20"
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
          <LayoutDashboard className="w-4 h-4" />
          <span className="hidden lg:inline">Dashboard</span>
          <ChevronDown className="w-3.5 h-3.5 opacity-70" />
          <span className="lg:hidden absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1 bg-[#2A1C12] border border-[#B89045]/40 text-[#F5E6C8] text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50 shadow-lg">
            Dashboard
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48 border-[#B89045]/40 text-[#E8D5AC]"
        style={{
          backgroundColor: "#1E1209",
          backgroundImage:
            "linear-gradient(180deg, #2A1C12 0%, #1E1209 100%)",
          boxShadow: "0 12px 30px rgba(0,0,0,0.6), 0 0 0 1px rgba(184,144,69,0.30)",
        }}
      >
        {MOBILE_NAV.map((item) => {
          const Icon = item.icon;
          return (
            <DropdownMenuItem key={item.page} asChild className="sm:hidden">
              <Link
                to={createPageUrl(item.page)}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-sm cursor-pointer focus:bg-[#B89045]/15 hover:bg-[#B89045]/15"
              >
                <Icon className="w-4 h-4 text-[#E9C97A]" />
                <span>{item.name}</span>
              </Link>
            </DropdownMenuItem>
          );
        })}
        <div className="sm:hidden h-px my-1 bg-[#B89045]/25 mx-1" />
        {ADMIN_TOOLS.map((item) => {
          const Icon = item.icon;
          return (
            <DropdownMenuItem key={item.page} asChild>
              <Link
                to={createPageUrl(item.page)}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-sm cursor-pointer focus:bg-[#B89045]/15 hover:bg-[#B89045]/15"
              >
                <Icon className="w-4 h-4 text-[#E9C97A]" />
                <span>{item.name}</span>
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}