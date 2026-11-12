import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ShieldCheck, Package, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import MerchantCard from "@/components/approval/MerchantCard";
import ProductApprovalCard from "@/components/approval/ProductApprovalCard";

const TABS = ["Merchants", "Products"];

const MERCHANT_FILTERS = ["all", "unverified", "under_review", "verified", "rejected"];
const PRODUCT_FILTERS  = ["all", "pending", "approved", "rejected", "needs_changes"];

export default function MerchantApproval() {
  const [tab, setTab] = useState("Merchants");
  const [search, setSearch] = useState("");
  const [merchantFilter, setMerchantFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("pending");

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: merchants = [], refetch: refetchMerchants } = useQuery({
    queryKey: ["merchants"],
    queryFn: () => base44.entities.Merchant.list("-created_date", 100),
    enabled: user?.role === "admin",
  });

  const { data: products = [], refetch: refetchProducts } = useQuery({
    queryKey: ["products"],
    queryFn: () => base44.entities.ProductRegistry.list("-created_date", 200),
    enabled: user?.role === "admin",
  });

  if (user && user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShieldCheck className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white">Admin Only</h2>
          <p className="text-white/40 mt-1">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const merchantMap = Object.fromEntries(merchants.map(m => [m.id, m.company_name]));

  const filteredMerchants = merchants.filter(m => {
    const matchFilter = merchantFilter === "all" || m.verification_status === merchantFilter;
    const matchSearch = !search || m.company_name?.toLowerCase().includes(search.toLowerCase()) || m.contact_email?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const filteredProducts = products.filter(p => {
    const matchFilter = productFilter === "all" || p.approval_status === productFilter || (!p.approval_status && productFilter === "pending");
    const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.brand?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const pendingMerchants = merchants.filter(m => !m.verification_status || m.verification_status === "unverified" || m.verification_status === "under_review").length;
  const pendingProducts  = products.filter(p => !p.approval_status || p.approval_status === "pending").length;

  return (
    <div className="min-h-screen px-4 sm:px-6 py-10 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Verification & Approval</h1>
        <p className="text-white/40">Review merchants and approve products before they go live</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setSearch(""); }}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === t
                ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
                : "bg-white/[0.04] text-white/50 border border-transparent hover:text-white/80"
            }`}
          >
            {t === "Merchants" ? <ShieldCheck className="w-4 h-4" /> : <Package className="w-4 h-4" />}
            {t}
            {t === "Merchants" && pendingMerchants > 0 && (
              <span className="bg-amber-500/20 text-amber-400 text-xs px-1.5 py-0.5 rounded-full">{pendingMerchants}</span>
            )}
            {t === "Products" && pendingProducts > 0 && (
              <span className="bg-amber-500/20 text-amber-400 text-xs px-1.5 py-0.5 rounded-full">{pendingProducts}</span>
            )}
          </button>
        ))}
      </div>

      {/* Search + Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={tab === "Merchants" ? "Search merchants..." : "Search products..."}
            className="pl-9 bg-white/[0.04] border-white/10 text-white placeholder:text-white/30"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(tab === "Merchants" ? MERCHANT_FILTERS : PRODUCT_FILTERS).map(f => (
            <button
              key={f}
              onClick={() => tab === "Merchants" ? setMerchantFilter(f) : setProductFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                (tab === "Merchants" ? merchantFilter : productFilter) === f
                  ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
                  : "bg-white/[0.04] text-white/40 border border-white/[0.06] hover:text-white/60"
              }`}
            >
              {f === "all" ? "All" : f.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {tab === "Merchants" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMerchants.length === 0
            ? <p className="text-white/30 col-span-2 text-center py-16">No merchants match this filter.</p>
            : filteredMerchants.map(m => (
              <MerchantCard key={m.id} merchant={m} user={user} onUpdated={refetchMerchants} />
            ))
          }
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProducts.length === 0
            ? <p className="text-white/30 col-span-2 text-center py-16">No products match this filter.</p>
            : filteredProducts.map(p => (
              <ProductApprovalCard key={p.id} product={p} merchantName={merchantMap[p.merchant_id]} user={user} onUpdated={refetchProducts} />
            ))
          }
        </div>
      )}
    </div>
  );
}