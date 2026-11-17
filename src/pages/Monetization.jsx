import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Coins, Megaphone, Trash2, Upload, Loader2, Users, Ticket } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatPrice, useCurrentUser, useMonetizationSettings } from "@/lib/viewerAccess";

const card = "bg-[#13131a] border border-white/[0.06] rounded-2xl p-6";
const field = "h-11 bg-white/[0.04] border-white/[0.08] text-white";

function Stat({ icon: Icon, label, value }) {
  return (
    <div className={card}>
      <Icon className="w-5 h-5 text-[#D4AF37] mb-3" />
      <p className="text-2xl font-semibold text-white">{value}</p>
      <p className="text-xs text-white/40 mt-1">{label}</p>
    </div>
  );
}

function SettingsForm({ settings }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(settings);
  useEffect(() => setForm(settings), [settings]);
  const save = useMutation({
    mutationFn: () =>
      base44.entities.MonetizationSettings.update("default", {
        subscription_name: form.subscription_name,
        subscription_monthly_price: form.subscription_monthly_price === "" ? null : Number(form.subscription_monthly_price),
        subscription_yearly_price: form.subscription_yearly_price === "" ? null : Number(form.subscription_yearly_price),
        default_rental_hours: Number(form.default_rental_hours) || 48,
        ads_enabled: !!form.ads_enabled,
        ad_skip_after_seconds: Number(form.ad_skip_after_seconds) || 0,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["monetizationSettings"] }),
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <section className={card}>
      <h2 className="text-base font-semibold text-white/90 mb-1 flex items-center gap-2"><Coins className="w-4 h-4 text-[#D4AF37]" /> Prices</h2>
      <p className="text-xs text-white/30 mb-5">
        New prices apply to new sign-ups. Title prices are set per episode in the episode editor (Access & Pricing).
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Label className="text-xs text-white/40 mb-1.5">Membership name</Label>
          <Input value={form.subscription_name ?? ""} onChange={set("subscription_name")} className={field} />
        </div>
        <div>
          <Label className="text-xs text-white/40 mb-1.5">Monthly price (USD, empty = not offered)</Label>
          <Input type="number" min="0" step="0.01" value={form.subscription_monthly_price ?? ""} onChange={set("subscription_monthly_price")} className={field} />
        </div>
        <div>
          <Label className="text-xs text-white/40 mb-1.5">Yearly price (USD, empty = not offered)</Label>
          <Input type="number" min="0" step="0.01" value={form.subscription_yearly_price ?? ""} onChange={set("subscription_yearly_price")} className={field} />
        </div>
        <div>
          <Label className="text-xs text-white/40 mb-1.5">Default rental length (hours)</Label>
          <Input type="number" min="1" value={form.default_rental_hours ?? ""} onChange={set("default_rental_hours")} className={field} />
        </div>
        <div>
          <Label className="text-xs text-white/40 mb-1.5">Ads can be skipped after (seconds)</Label>
          <Input type="number" min="0" value={form.ad_skip_after_seconds ?? ""} onChange={set("ad_skip_after_seconds")} className={field} />
        </div>
        <label className="flex items-center gap-3 text-sm text-white/70">
          <Switch checked={!!form.ads_enabled} onCheckedChange={(v) => setForm((f) => ({ ...f, ads_enabled: v }))} />
          Show ads on free episodes
        </label>
      </div>
      <div className="mt-6 flex items-center gap-3">
        <button onClick={() => save.mutate()} disabled={save.isPending}
          className="px-5 py-2.5 rounded-xl bg-[#D4AF37] text-[#1a1208] text-sm font-semibold disabled:opacity-60 inline-flex items-center gap-2">
          {save.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Save prices
        </button>
        {save.isSuccess && <span className="text-xs text-emerald-400">Saved</span>}
        {save.isError && <span className="text-xs text-red-400">{save.error.message}</span>}
      </div>
    </section>
  );
}

function AdsManager() {
  const queryClient = useQueryClient();
  const { data: ads = [] } = useQuery({ queryKey: ["allAds"], queryFn: () => base44.entities.AdCreative.list("-created_date") });
  const { data: events = [] } = useQuery({ queryKey: ["adEvents"], queryFn: () => base44.entities.AdEvent.list("-created_date", 5000) });
  const [draft, setDraft] = useState({ title: "", advertiser: "", click_url: "", duration_seconds: 15 });
  const [file, setFile] = useState(null);
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["allAds"] });
    queryClient.invalidateQueries({ queryKey: ["activeAds"] });
  };

  const stats = useMemo(() => {
    const out = {};
    for (const e of events) (out[e.ad_id] ||= { impression: 0, click: 0, skip: 0, complete: 0 })[e.event] += 1;
    return out;
  }, [events]);

  const create = useMutation({
    mutationFn: async () => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const isVideo = file.type.startsWith("video/");
      return base44.entities.AdCreative.create({
        ...draft,
        duration_seconds: Number(draft.duration_seconds) || 15,
        video_url: isVideo ? file_url : null,
        image_url: isVideo ? null : file_url,
        active: true,
        weight: 1,
      });
    },
    onSuccess: () => {
      setDraft({ title: "", advertiser: "", click_url: "", duration_seconds: 15 });
      setFile(null);
      refresh();
    },
  });
  const toggle = useMutation({ mutationFn: (ad) => base44.entities.AdCreative.update(ad.id, { active: !ad.active }), onSuccess: refresh });
  const remove = useMutation({ mutationFn: (ad) => base44.entities.AdCreative.delete(ad.id), onSuccess: refresh });

  return (
    <section className={card}>
      <h2 className="text-base font-semibold text-white/90 mb-1 flex items-center gap-2"><Megaphone className="w-4 h-4 text-[#D4AF37]" /> Ads (free tier)</h2>
      <p className="text-xs text-white/30 mb-5">One random active ad plays before each free episode for viewers who aren't members.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <Input placeholder="Ad name" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className={field} />
        <Input placeholder="Advertiser (shown on the ad)" value={draft.advertiser} onChange={(e) => setDraft({ ...draft, advertiser: e.target.value })} className={field} />
        <Input placeholder="Click-through link (optional)" value={draft.click_url} onChange={(e) => setDraft({ ...draft, click_url: e.target.value })} className={field} />
        <Input type="number" min="3" placeholder="Seconds to show (image ads)" value={draft.duration_seconds} onChange={(e) => setDraft({ ...draft, duration_seconds: e.target.value })} className={field} />
      </div>
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center mb-6">
        <label className="flex-1 flex items-center gap-2 px-4 h-11 rounded-md border border-dashed border-white/15 text-sm text-white/50 cursor-pointer hover:text-white">
          <Upload className="w-4 h-4" /> {file ? file.name : "Choose a video (.mp4) or image"}
          <input type="file" accept="video/mp4,video/webm,image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </label>
        <button onClick={() => create.mutate()} disabled={!file || !draft.title || create.isPending}
          className="px-5 h-11 rounded-xl bg-[#D4AF37] text-[#1a1208] text-sm font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2">
          {create.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Add ad
        </button>
      </div>
      {create.isError && <p className="text-xs text-red-400 mb-4">{create.error.message}</p>}

      {ads.length === 0 ? (
        <p className="text-sm text-white/30">No ads yet — free episodes play straight away.</p>
      ) : (
        <div className="space-y-2">
          {ads.map((ad) => {
            const s = stats[ad.id] || {};
            const ctr = s.impression ? ((s.click || 0) / s.impression * 100).toFixed(1) : "0.0";
            return (
              <div key={ad.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="w-full sm:w-28 aspect-video bg-black rounded-lg overflow-hidden shrink-0">
                  {ad.video_url ? <video src={ad.video_url} muted className="w-full h-full object-cover" /> : <img src={ad.image_url} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{ad.title}</p>
                  <p className="text-xs text-white/40">
                    {s.impression || 0} views · {s.click || 0} clicks ({ctr}%) · {s.skip || 0} skipped
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={!!ad.active} onCheckedChange={() => toggle.mutate(ad)} />
                  <button onClick={() => window.confirm(`Delete "${ad.title}"?`) && remove.mutate(ad)} className="p-2 text-white/40 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function Monetization() {
  const { data: user, isLoading } = useCurrentUser();
  const { data: settings } = useMonetizationSettings();
  const isAdmin = user?.role === "admin";
  const { data: entitlements = [] } = useQuery({
    queryKey: ["allEntitlements"],
    queryFn: () => base44.entities.Entitlement.list("-created_date", 5000),
    enabled: isAdmin,
  });

  if (isLoading) return null;
  if (!isAdmin) return <p className="text-center text-white/40 py-20">Admins only.</p>;

  const now = new Date();
  const members = entitlements.filter((e) => e.kind === "subscription" && ["active", "trialing", "past_due"].includes(e.status) && (!e.expires_at || new Date(e.expires_at) > now));
  const sales = entitlements.filter((e) => e.kind !== "subscription");
  const salesTotal = sales.reduce((n, e) => n + (e.amount || 0), 0);
  const mrr = members.reduce((n, e) => n + (e.plan_interval === "year" ? (e.amount || 0) / 12 : e.amount || 0), 0);

  return (
    <div className="min-h-screen px-4 sm:px-6 py-10 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Monetization</h1>
        <p className="text-white/40">Membership, pay-per-view, The Vault and ads.</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat icon={Users} label="Active members" value={members.length} />
        <Stat icon={Coins} label="Monthly recurring" value={formatPrice(mrr)} />
        <Stat icon={Ticket} label="Titles sold / rented" value={sales.length} />
        <Stat icon={Coins} label="Title revenue" value={formatPrice(salesTotal)} />
      </div>
      {settings && <SettingsForm settings={settings} />}
      <AdsManager />
    </div>
  );
}
