import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Check, Crown, Loader2, Tv, Gem } from "lucide-react";
import { base44 } from "@/api/base44Client";
import {
  activeSubscription, formatPrice, openBillingPortal, startCheckout, useCheckoutReturn,
  useCurrentUser, useMonetizationSettings, useMyEntitlements,
} from "@/lib/viewerAccess";

const fmtDateTime = (d) => (d ? new Date(d).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "");
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "");

function PlanCard({ title, price, period, features, highlight, badge = "Best value", action }) {
  return (
    <div
      className={`relative rounded-2xl p-6 flex flex-col border ${
        highlight ? "border-[#D4AF37]/60 bg-gradient-to-b from-[#2a2015] to-[#1a1410]" : "border-[#D4AF37]/15 bg-[#1a1410]"
      }`}
    >
      {highlight && (
        <span className="absolute -top-3 left-6 px-3 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-widest bg-[#D4AF37] text-[#1a1208]">
          {badge}
        </span>
      )}
      <h3 className="font-display text-xl text-[#EDE3D0]">{title}</h3>
      <p className="mt-3 mb-5">
        <span className="text-3xl font-semibold text-[#EDE3D0]">{price}</span>
        {period && <span className="text-sm text-[#EDE3D0]/50"> {period}</span>}
      </p>
      <ul className="space-y-2 mb-6 flex-1">
        {features.map((f) => (
          <li key={f} className="flex gap-2 text-sm text-[#EDE3D0]/70">
            <Check className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" /> {f}
          </li>
        ))}
      </ul>
      {action}
    </div>
  );
}

export default function Subscribe() {
  const { data: user } = useCurrentUser();
  const { data: settings = {} } = useMonetizationSettings();
  const { data: entitlements = [], isLoading } = useMyEntitlements(user);
  const sub = activeSubscription(entitlements);
  const checkoutState = useCheckoutReturn(!!sub);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");
  const currency = settings.currency || "usd";

  const titles = entitlements.filter((e) => e.kind !== "subscription" && e.status === "active");
  const { data: titleEpisodes = [] } = useQuery({
    queryKey: ["entitledEpisodes", titles.map((t) => t.episode_id).join(",")],
    queryFn: () => base44.entities.Episode.filter({ id: titles.map((t) => t.episode_id) }),
    enabled: titles.length > 0,
  });

  const run = async (key, fn) => {
    if (!user) return base44.auth.redirectToLogin(window.location.href);
    setBusy(key);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e.message || "Something went wrong");
      setBusy(null);
    }
  };

  const joinButton = (interval, label, solid) => (
    <button
      onClick={() => run(interval, () => startCheckout({ kind: "subscription", interval }))}
      disabled={!!busy || !!sub}
      className={`w-full py-3 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50 ${
        solid
          ? "bg-gradient-to-b from-[#E2C15A] to-[#B89045] text-[#1a1208] hover:brightness-110"
          : "border border-[#D4AF37]/50 text-[#EDE3D0] hover:bg-[#D4AF37]/10"
      }`}
    >
      {busy === interval && <Loader2 className="w-4 h-4 animate-spin" />}
      {sub ? "You're a member" : label}
    </button>
  );

  const memberFeatures = ["Every members-only episode", "No ads on free episodes", "Cancel any time"];
  // e.g. $4.99/month vs $50/year -> "2 months free"
  const monthly = Number(settings.subscription_monthly_price) || 0;
  const yearly = Number(settings.subscription_yearly_price) || 0;
  const monthsFree = monthly > 0 && yearly > 0 ? Math.round(12 - yearly / monthly) : 0;
  const yearlyBadge = monthsFree >= 1 ? `${monthsFree} month${monthsFree > 1 ? "s" : ""} free` : "Best value";

  return (
    <div className="min-h-screen px-4 sm:px-6 py-10 max-w-5xl mx-auto text-[#EDE3D0]">
      <div className="text-center mb-10">
        <Crown className="w-8 h-8 text-[#D4AF37] mx-auto mb-3" />
        <h1 className="font-display text-3xl sm:text-4xl mb-2">{settings.subscription_name || "GlobeHouse Membership"}</h1>
        <p className="text-[#EDE3D0]/60">Watch free with ads, become a member, or rent and buy individual titles.</p>
      </div>

      {checkoutState === "waiting" && (
        <p className="mb-6 text-center text-sm text-[#D4AF37] flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Payment received — activating your membership…
        </p>
      )}
      {checkoutState === "done" && <p className="mb-6 text-center text-sm text-emerald-400">Welcome! Your membership is active.</p>}
      {checkoutState === "timeout" && (
        <p className="mb-6 text-center text-sm text-amber-300">Payment received. Activation is taking longer than usual — refresh in a minute.</p>
      )}
      {checkoutState === "cancel" && <p className="mb-6 text-center text-sm text-[#EDE3D0]/50">Checkout cancelled. You weren't charged.</p>}

      {sub && (
        <div className="mb-10 rounded-2xl border border-[#D4AF37]/40 bg-[#1a1410] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#D4AF37] mb-1">Your membership</p>
            <p className="text-lg">
              {sub.plan_interval === "year" ? "Yearly" : "Monthly"} · {formatPrice(sub.amount, sub.currency)}
              {sub.status === "past_due" && <span className="ml-2 text-sm text-amber-300">Payment overdue</span>}
            </p>
            {sub.expires_at && <p className="text-sm text-[#EDE3D0]/50">Current period ends {fmtDate(sub.expires_at)}</p>}
          </div>
          <button
            onClick={() => run("portal", openBillingPortal)}
            className="px-5 py-3 rounded-xl border border-[#D4AF37]/50 text-sm hover:bg-[#D4AF37]/10 inline-flex items-center gap-2"
          >
            {busy === "portal" && <Loader2 className="w-4 h-4 animate-spin" />}
            Manage billing / cancel
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <PlanCard
          title="Free"
          price={formatPrice(0, currency)}
          features={["All free episodes", "Short ads before episodes", "Rent or buy Vault titles"]}
          action={
            <Link to="/Dashboard" className="w-full py-3 rounded-xl text-sm text-center border border-white/10 text-[#EDE3D0]/70 hover:bg-white/5 inline-flex items-center justify-center gap-2">
              <Tv className="w-4 h-4" /> Start watching
            </Link>
          }
        />
        {settings.subscription_monthly_price > 0 && (
          <PlanCard
            title="Monthly"
            price={formatPrice(settings.subscription_monthly_price, currency)}
            period="/ month"
            features={memberFeatures}
            action={joinButton("month", "Join monthly", false)}
          />
        )}
        {settings.subscription_yearly_price > 0 && (
          <PlanCard
            title="Yearly"
            price={formatPrice(settings.subscription_yearly_price, currency)}
            period="/ year"
            highlight
            badge={yearlyBadge}
            features={memberFeatures}
            action={joinButton("year", "Join yearly", true)}
          />
        )}
      </div>

      <p className="mt-6 text-center text-xs text-[#EDE3D0]/40">
        Pay-per-view titles and <Link to="/Vault" className="underline">The Vault</Link> are sold separately and aren't included in membership.
      </p>
      {!user && <p className="mt-2 text-center text-xs text-[#EDE3D0]/40">You'll be asked to sign in before checkout.</p>}
      {error && <p className="mt-4 text-center text-sm text-red-400">{error}</p>}

      {user && !isLoading && titles.length > 0 && (
        <div className="mt-14">
          <h2 className="font-display text-2xl mb-4 flex items-center gap-2"><Gem className="w-5 h-5 text-[#D4AF37]" /> My titles</h2>
          <div className="space-y-2">
            {titles.map((t) => {
              const ep = titleEpisodes.find((e) => e.id === t.episode_id);
              const expired = t.kind === "rental" && t.expires_at && new Date(t.expires_at) <= new Date();
              return (
                <Link
                  key={t.id}
                  to={`/Player?id=${t.episode_id}`}
                  className="flex items-center justify-between gap-4 p-4 rounded-xl bg-[#1a1410] border border-[#D4AF37]/15 hover:border-[#D4AF37]/40"
                >
                  <span className="truncate">{ep?.title || "Title"}</span>
                  <span className={`text-xs shrink-0 ${expired ? "text-[#EDE3D0]/40" : "text-[#D4AF37]"}`}>
                    {t.kind === "purchase" ? "Owned" : expired ? "Rental ended" : `Rented · until ${fmtDateTime(t.expires_at)}`}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
