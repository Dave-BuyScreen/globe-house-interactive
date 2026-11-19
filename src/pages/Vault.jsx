import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Gem, Play } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Skeleton } from "@/components/ui/skeleton";
import { activeTitleAccess, formatPrice, useCurrentUser, useMonetizationSettings, useMyEntitlements } from "@/lib/viewerAccess";

// The Vault: pay-per-view titles, rented or bought one by one (not part of membership).
export default function Vault() {
  const { data: user } = useCurrentUser();
  const { data: settings = {} } = useMonetizationSettings();
  const { data: entitlements = [] } = useMyEntitlements(user);
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["vaultEpisodes"],
    queryFn: () => base44.entities.Episode.filter({ access_tier: "vault", status: "published" }, "-created_date"),
  });

  return (
    <div className="min-h-screen px-4 sm:px-6 py-10 max-w-7xl mx-auto text-[#EDE3D0]">
      <div className="text-center mb-12">
        <Gem className="w-8 h-8 text-[#D4AF37] mx-auto mb-3" />
        <h1 className="font-display text-3xl sm:text-5xl mb-3">The Vault</h1>
        <p className="text-[#EDE3D0]/60 max-w-xl mx-auto">
          Pay per view. Rent or buy each title on its own. Not part of membership.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="aspect-[4/5] rounded-2xl bg-white/[0.04]" />)}
        </div>
      ) : projects.length === 0 ? (
        <p className="text-center text-[#EDE3D0]/40 py-20">The Vault opens soon.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((ep) => {
            const owned = !!activeTitleAccess(entitlements, ep.id) || ["admin", "editor"].includes(user?.role);
            return (
              <Link
                key={ep.id}
                to={`/Player?id=${ep.id}`}
                className="group rounded-2xl overflow-hidden border border-[#D4AF37]/25 bg-[#1a1410] hover:border-[#D4AF37]/60 transition-colors"
              >
                <div className="relative aspect-video bg-black">
                  {ep.thumbnail_url && (
                    <img src={ep.thumbnail_url} alt="" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="w-14 h-14 rounded-full bg-black/60 border border-[#D4AF37]/60 flex items-center justify-center">
                      <Play className="w-6 h-6 text-[#D4AF37]" />
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-display text-xl mb-1">{ep.title}</h3>
                  {ep.summary && <p className="text-sm text-[#EDE3D0]/50 line-clamp-2 mb-3">{ep.summary}</p>}
                  <p className="text-sm font-semibold text-[#D4AF37]">
                    {owned
                      ? "In your collection"
                      : ep.rental_price > 0
                        ? `Rent ${formatPrice(ep.rental_price, settings.currency)}${ep.purchase_price > 0 ? ` · Buy ${formatPrice(ep.purchase_price, settings.currency)}` : ""}`
                        : ep.purchase_price > 0
                          ? `Buy ${formatPrice(ep.purchase_price, settings.currency)}`
                          : "Coming soon"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
