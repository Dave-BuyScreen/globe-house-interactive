// Viewer tiers: Free with ads, Subscription, pay-per-title (TVOD) and The Vault.
// Real access control lives in the database (episode_media RLS + entitlement table);
// these helpers only decide what to show.
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export const TIERS = {
  free: { label: "Free", short: "Free", description: "Free to watch, with short ads" },
  subscription: { label: "Members", short: "Members", description: "Included with membership" },
  tvod: { label: "Pay per view", short: "Rent / Buy", description: "Rent or buy this title" },
  vault: { label: "The Vault", short: "Vault", description: "Special project, bought on its own" },
};

export const tierOf = (episode) => (episode?.access_tier && TIERS[episode.access_tier] ? episode.access_tier : "free");

// The database only returns video links to viewers allowed to watch, so a locked episode is one
// that isn't free and came back without links.
export const isLocked = (episode, user) =>
  tierOf(episode) !== "free" &&
  !episode?.vimeo_url &&
  !episode?.youtube_url &&
  !["admin", "editor"].includes(user?.role);

export const formatPrice = (amount, currency = "usd") =>
  amount == null || amount === ""
    ? ""
    : new Intl.NumberFormat(undefined, { style: "currency", currency: currency.toUpperCase() }).format(Number(amount));

export function useCurrentUser() {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
    retry: false,
  });
}

export function useMonetizationSettings() {
  return useQuery({
    queryKey: ["monetizationSettings"],
    queryFn: async () => (await base44.entities.MonetizationSettings.filter({ id: "default" }))[0] || {},
    staleTime: 60_000,
  });
}

// The signed-in viewer's own entitlements (RLS returns only theirs).
export function useMyEntitlements(user) {
  return useQuery({
    queryKey: ["myEntitlements", user?.id],
    queryFn: () => base44.entities.Entitlement.filter({ user_id: user.id }, "-created_date"),
    enabled: !!user?.id,
  });
}

const notExpired = (e) => !e.expires_at || new Date(e.expires_at) > new Date();

export const activeSubscription = (entitlements = []) =>
  entitlements.find(
    (e) => e.kind === "subscription" && ["active", "trialing", "past_due"].includes(e.status) && notExpired(e),
  );

export const activeTitleAccess = (entitlements = [], episodeId) =>
  entitlements.find(
    (e) => e.episode_id === episodeId && e.status === "active" && (e.kind === "purchase" || (e.kind === "rental" && notExpired(e))),
  );

async function redirectFromFunction(name, body) {
  const { data } = await base44.functions.invoke(name, body);
  if (!data?.url) throw new Error("Stripe did not return a checkout link");
  window.location.href = data.url;
}

// kind: "subscription" (with interval "month" | "year"), "purchase" or "rental" (with episodeId)
export function startCheckout({ kind, interval, episodeId }) {
  const returnPath = window.location.pathname + window.location.search.replace(/[?&]checkout=[^&]*/g, "").replace(/[?&]session_id=[^&]*/g, "");
  return redirectFromFunction("createCheckoutSession", {
    kind,
    interval,
    episode_id: episodeId,
    return_path: returnPath || "/",
  });
}

export const openBillingPortal = () =>
  redirectFromFunction("createBillingPortalSession", { return_path: "/Subscribe" });

// After Stripe sends the viewer back, the webhook may take a few seconds to record the payment.
// Keep refreshing access until `isDone` or ~30s pass. Returns "waiting" | "done" | "timeout" | null.
export function useCheckoutReturn(isDone) {
  const queryClient = useQueryClient();
  const params = new URLSearchParams(window.location.search);
  const status = params.get("checkout");
  const [tries, setTries] = useState(0);

  useEffect(() => {
    if (status !== "success" || isDone || tries >= 15) return;
    const timer = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ["myEntitlements"] });
      queryClient.invalidateQueries({ queryKey: ["episode"] });
      setTries((t) => t + 1);
    }, 2000);
    return () => clearTimeout(timer);
  }, [status, isDone, tries, queryClient]);

  if (status === "cancel") return "cancel";
  if (status !== "success") return null;
  if (isDone) return "done";
  return tries >= 15 ? "timeout" : "waiting";
}
