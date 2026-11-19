import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import BrandedSplash from "@/components/BrandedSplash";

// Back-office pages (uploads, products, triggers, analytics, approvals, pricing).
// Only admin and editor accounts may open them. The database enforces the same rule (RLS);
// this guard keeps viewers and visitors from seeing the tools at all.
export const STAFF_PAGES = [
  "Videos", "EpisodeEditor", "VideoMapper", "UBPLEditor", "Wardrobe", "ChannelScheduler",
  "Analytics", "TriggerAnalytics", "EngagementAnalytics", "FloorAnalytics",
  "MerchantApproval", "Monetization", "VerifyAdmin",
];

export const isStaff = (user) => ["admin", "editor"].includes(user?.role);

export default function StaffRoute({ children }) {
  const { data: user, isLoading, isError } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  if (isLoading) return <BrandedSplash />;

  if (isError || !user) {
    base44.auth.redirectToLogin(window.location.href);
    return null;
  }

  if (!isStaff(user)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center bg-[#120e0a] text-[#EDE3D0]">
        <h1 className="text-2xl font-display">This area is for the GlobeHouse team</h1>
        <p className="text-[#EDE3D0]/60 max-w-md">Your account doesn't have access to the admin tools.</p>
        <Link to="/Dashboard" className="text-[#D4AF37] underline">Back to GlobeHouse</Link>
      </div>
    );
  }

  return children;
}
