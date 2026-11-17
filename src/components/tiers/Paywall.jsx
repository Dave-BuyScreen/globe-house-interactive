import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Lock, Crown, Ticket, Gem, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import VideoSourcePlayer from "../player/VideoSourcePlayer";
import { TIERS, tierOf, formatPrice, startCheckout, useMonetizationSettings } from "@/lib/viewerAccess";

const ICONS = { subscription: Crown, tvod: Ticket, vault: Gem };

function GoldButton({ children, onClick, busy, variant = "solid" }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={`w-full sm:w-auto min-w-[180px] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 ${
        variant === "solid"
          ? "bg-gradient-to-b from-[#E2C15A] to-[#B89045] text-[#1a1208] hover:brightness-110 shadow-[0_6px_20px_rgba(212,175,55,0.25)]"
          : "border border-[#D4AF37]/50 text-[#EDE3D0] hover:bg-[#D4AF37]/10"
      }`}
    >
      {busy && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}

// Shown instead of the player when the viewer may not watch this episode yet.
export default function Paywall({ episode, user, checkoutState }) {
  const tier = tierOf(episode);
  const Icon = ICONS[tier] || Lock;
  const { data: settings = {} } = useMonetizationSettings();
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");
  const currency = settings.currency || "usd";
  const rentalHours = episode.rental_hours || settings.default_rental_hours || 48;

  const go = async (key, opts) => {
    if (!user) return base44.auth.redirectToLogin(window.location.href);
    setBusy(key);
    setError("");
    try {
      await startCheckout(opts);
    } catch (e) {
      setError(e.message || "Couldn't start checkout");
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      {episode.trailer_url && (
        <div className="rounded-2xl overflow-hidden border border-[#D4AF37]/20">
          <VideoSourcePlayer vimeoUrl={episode.trailer_url} youtubeUrl={episode.trailer_url} />
          <p className="px-4 py-2 text-xs text-[#EDE3D0]/50 bg-black/40">Trailer</p>
        </div>
      )}

      <div
        className="relative rounded-2xl overflow-hidden border border-[#D4AF37]/30 px-6 py-10 sm:py-14 text-center"
        style={{
          backgroundImage: episode.thumbnail_url
            ? `linear-gradient(180deg, rgba(18,14,10,0.82), rgba(18,14,10,0.96)), url(${episode.thumbnail_url})`
            : "linear-gradient(180deg, #241c15, #120e0a)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="mx-auto mb-5 w-14 h-14 rounded-full flex items-center justify-center border border-[#D4AF37]/50 bg-black/40">
          <Icon className="w-6 h-6 text-[#D4AF37]" />
        </div>
        <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] mb-2">{TIERS[tier].label}</p>
        <h2 className="font-display text-2xl sm:text-3xl text-[#EDE3D0] mb-2">{episode.title}</h2>
        <p className="text-sm text-[#EDE3D0]/60 mb-8 max-w-md mx-auto">
          {tier === "subscription" && "This episode is for members. Join to watch it and everything else in the members library, ad-free."}
          {tier === "tvod" && "Rent or buy this title to watch it."}
          {tier === "vault" && "A special project from The Vault. Buy it once and it's yours to watch any time."}
        </p>

        {checkoutState === "waiting" && (
          <p className="mb-6 text-sm text-[#D4AF37] inline-flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Payment received — unlocking…
          </p>
        )}
        {checkoutState === "timeout" && (
          <p className="mb-6 text-sm text-amber-300">
            Your payment went through but access is taking longer than usual. Refresh in a minute.
          </p>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {tier === "subscription" && (
            <>
              {settings.subscription_monthly_price > 0 && (
                <GoldButton busy={busy === "month"} onClick={() => go("month", { kind: "subscription", interval: "month" })}>
                  Join · {formatPrice(settings.subscription_monthly_price, currency)}/mo
                </GoldButton>
              )}
              {settings.subscription_yearly_price > 0 && (
                <GoldButton variant="outline" busy={busy === "year"} onClick={() => go("year", { kind: "subscription", interval: "year" })}>
                  {formatPrice(settings.subscription_yearly_price, currency)}/year
                </GoldButton>
              )}
            </>
          )}
          {tier !== "subscription" && episode.purchase_price > 0 && (
            <GoldButton busy={busy === "buy"} onClick={() => go("buy", { kind: "purchase", episodeId: episode.id })}>
              Buy · {formatPrice(episode.purchase_price, currency)}
            </GoldButton>
          )}
          {tier === "tvod" && episode.rental_price > 0 && (
            <GoldButton variant="outline" busy={busy === "rent"} onClick={() => go("rent", { kind: "rental", episodeId: episode.id })}>
              Rent {rentalHours}h · {formatPrice(episode.rental_price, currency)}
            </GoldButton>
          )}
        </div>

        {tier !== "subscription" && !(episode.purchase_price > 0) && !(tier === "tvod" && episode.rental_price > 0) && (
          <p className="text-sm text-[#EDE3D0]/50">Not on sale yet.</p>
        )}
        {!user && <p className="mt-5 text-xs text-[#EDE3D0]/40">You'll be asked to sign in first.</p>}
        {error && <p className="mt-5 text-sm text-red-400">{error}</p>}
        {tier === "subscription" && (
          <p className="mt-6 text-xs text-[#EDE3D0]/40">
            <Link to="/Subscribe" className="underline hover:text-[#EDE3D0]/70">See membership details</Link>
          </p>
        )}
      </div>
    </div>
  );
}
