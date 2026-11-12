import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ShoppingBag, Plus, Edit2, Trash2, Upload, Package, TrendingUp, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

export default function Wardrobe() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => base44.entities.Product.list("-created_date"),
    enabled: user?.role === "admin",
  });

  const { data: analytics = [] } = useQuery({
    queryKey: ["analytics"],
    queryFn: () => base44.entities.PortalAnalytics.list(),
    enabled: user?.role === "admin",
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Product.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setIsCreating(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Product.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setEditingProduct(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Product.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  // Redirect non-admins (after all hooks)
  if (user && user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-red-500/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Access Restricted</h2>
          <p className="text-white/40 mb-6">Only administrators can manage products</p>
        </div>
      </div>
    );
  }

  const getProductStats = (productName) => {
    const views = analytics.filter(e => e.event_type === "buyscreen_view" && e.metadata?.includes(productName)).length;
    const clicks = analytics.filter(e => e.event_type === "shop_click" && e.metadata?.includes(productName)).length;
    const ctr = views > 0 ? (clicks / views) * 100 : 0;
    return { views, clicks, ctr };
  };

  return (
    <div className="min-h-screen px-4 sm:px-6 py-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Wardrobe Store</h1>
          <p className="text-white/40">Manage products tied to your narrative moments</p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          className="bg-amber-500 hover:bg-amber-600 rounded-xl h-11 gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        <div className="bg-[#13131a] border border-white/[0.06] rounded-2xl p-5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center mb-3">
            <Package className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white">{products.length}</p>
          <p className="text-xs text-white/30 mt-1">Products</p>
        </div>
        <div className="bg-[#13131a] border border-white/[0.06] rounded-2xl p-5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3">
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            {analytics.filter(e => e.event_type === "shop_click").length}
          </p>
          <p className="text-xs text-white/30 mt-1">Total Clicks</p>
        </div>
        <div className="bg-[#13131a] border border-white/[0.06] rounded-2xl p-5">
          <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center mb-3">
            <TrendingUp className="w-4 h-4 text-violet-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            {products.filter(p => p.is_limited_edition).length}
          </p>
          <p className="text-xs text-white/30 mt-1">Limited Edition</p>
        </div>
      </div>

      {/* Product grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-80 bg-white/[0.04] rounded-2xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-amber-500/10 flex items-center justify-center">
            <ShoppingBag className="w-8 h-8 text-amber-400" />
          </div>
          <h3 className="text-xl font-semibold text-white/80 mb-2">No products yet</h3>
          <p className="text-white/30 mb-6">Start building your wardrobe collection</p>
          <Button onClick={() => setIsCreating(true)} className="bg-amber-500 hover:bg-amber-600 rounded-xl">
            <Plus className="w-4 h-4 mr-2" />
            Add First Product
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((product) => {
            const stats = getProductStats(product.name);
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#13131a] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-white/[0.12] transition-all"
              >
                {/* Image */}
                <div className="aspect-square bg-gradient-to-br from-[#1c1c28] to-[#0f0f17] relative">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-12 h-12 text-white/10" />
                    </div>
                  )}
                  {product.is_limited_edition && (
                    <div className="absolute top-3 right-3 bg-amber-500/90 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                      Limited
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-white truncate">{product.name}</h3>
                    <p className="text-sm text-white/40 mt-0.5">{product.price}</p>
                  </div>

                  {product.character_quote && (
                    <p className="text-xs text-white/30 italic line-clamp-2">"{product.character_quote}"</p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-3 pt-2 border-t border-white/[0.04]">
                    <div className="text-xs">
                      <span className="text-white/60">{stats.views}</span>
                      <span className="text-white/20 ml-1">views</span>
                    </div>
                    <div className="text-xs">
                      <span className="text-white/60">{stats.clicks}</span>
                      <span className="text-white/20 ml-1">clicks</span>
                    </div>
                    {stats.ctr > 0 && (
                      <div className="text-xs">
                        <span className="text-emerald-400">{stats.ctr.toFixed(0)}%</span>
                        <span className="text-white/20 ml-1">CTR</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingProduct(product)}
                      className="flex-1 h-9 border-white/10 text-white/60 hover:text-white hover:bg-white/[0.06]"
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(product.id)}
                      className="h-9 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <ProductModal
        isOpen={isCreating || !!editingProduct}
        product={editingProduct}
        onClose={() => {
          setIsCreating(false);
          setEditingProduct(null);
        }}
        onSave={(data) => {
          if (editingProduct) {
            updateMutation.mutate({ id: editingProduct.id, data });
          } else {
            createMutation.mutate(data);
          }
        }}
        isSaving={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}

function ProductModal({ isOpen, product, onClose, onSave, isSaving }) {
  const [form, setForm] = useState(
    product || {
      name: "",
      image_url: "",
      model_url: "",
      model_embed_code: "",
      price: "",
      sku: "",
      inventory: 0,
      character_quote: "",
      shop_url: "",
      character_tag: "",
      is_limited_edition: false,
      theme_color: "#8B5CF6",
    }
  );

  React.useEffect(() => {
    if (product) setForm(product);
  }, [product]);

  const handleFileUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm((prev) => ({ ...prev, [field]: file_url }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[#13131a] border border-white/[0.08] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/[0.06] sticky top-0 bg-[#13131a] z-10">
              <h2 className="text-xl font-bold text-white">
                {product ? "Edit Product" : "New Product"}
              </h2>
              <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-white/40 mb-1.5">Product Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="bg-white/[0.04] border-white/[0.08] text-white"
                    placeholder="Black Wool Fedora"
                  />
                </div>
                <div>
                  <Label className="text-xs text-white/40 mb-1.5">Price</Label>
                  <Input
                    value={form.price}
                    onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                    className="bg-white/[0.04] border-white/[0.08] text-white"
                    placeholder="$89.00"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-white/40 mb-1.5">Character Quote</Label>
                <Textarea
                  value={form.character_quote}
                  onChange={(e) => setForm((prev) => ({ ...prev, character_quote: e.target.value }))}
                  className="bg-white/[0.04] border-white/[0.08] text-white min-h-[70px]"
                  placeholder="The armor I wear when I don't feel protected."
                />
              </div>

              <div>
                <Label className="text-xs text-white/40 mb-1.5">Product Image</Label>
                <div className="flex gap-3">
                  <Input
                    value={form.image_url}
                    onChange={(e) => setForm((prev) => ({ ...prev, image_url: e.target.value }))}
                    className="flex-1 bg-white/[0.04] border-white/[0.08] text-white"
                    placeholder="https://..."
                  />
                  <label className="h-10 px-4 rounded-xl border border-white/[0.08] bg-white/[0.04] flex items-center gap-2 cursor-pointer hover:bg-white/[0.06]">
                    <Upload className="w-4 h-4 text-white/40" />
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, "image_url")} />
                  </label>
                </div>
              </div>

              <div>
                <Label className="text-xs text-white/40 mb-1.5">3D Model (.glb URL)</Label>
                <div className="flex gap-3">
                  <Input
                    value={form.model_url}
                    onChange={(e) => setForm((prev) => ({ ...prev, model_url: e.target.value }))}
                    className="flex-1 bg-white/[0.04] border-white/[0.08] text-white"
                    placeholder="https://...model.glb"
                  />
                  <label className="h-10 px-4 rounded-xl border border-white/[0.08] bg-white/[0.04] flex items-center gap-2 cursor-pointer hover:bg-white/[0.06]">
                    <Upload className="w-4 h-4 text-white/40" />
                    <input type="file" accept=".glb" className="hidden" onChange={(e) => handleFileUpload(e, "model_url")} />
                  </label>
                </div>
              </div>

              <div>
                <Label className="text-xs text-white/40 mb-1.5">Or Embed Code (iframe/script)</Label>
                <Textarea
                  value={form.model_embed_code}
                  onChange={(e) => setForm((prev) => ({ ...prev, model_embed_code: e.target.value }))}
                  className="bg-white/[0.04] border-white/[0.08] text-white min-h-[80px] font-mono text-xs"
                  placeholder="<iframe src='...' or <script>..."
                />
                <p className="text-[10px] text-white/20 mt-1">Paste iframe or script code from platforms like Sketchfab, Vectary, etc.</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-white/40 mb-1.5">SKU</Label>
                  <Input
                    value={form.sku}
                    onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value }))}
                    className="bg-white/[0.04] border-white/[0.08] text-white"
                  />
                </div>
                <div>
                  <Label className="text-xs text-white/40 mb-1.5">Inventory</Label>
                  <Input
                    type="number"
                    value={form.inventory}
                    onChange={(e) => setForm((prev) => ({ ...prev, inventory: parseInt(e.target.value) || 0 }))}
                    className="bg-white/[0.04] border-white/[0.08] text-white"
                  />
                </div>
                <div>
                  <Label className="text-xs text-white/40 mb-1.5">Character</Label>
                  <Input
                    value={form.character_tag}
                    onChange={(e) => setForm((prev) => ({ ...prev, character_tag: e.target.value }))}
                    className="bg-white/[0.04] border-white/[0.08] text-white"
                    placeholder="Marcus"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-white/40 mb-1.5">Shop URL</Label>
                <Input
                  value={form.shop_url}
                  onChange={(e) => setForm((prev) => ({ ...prev, shop_url: e.target.value }))}
                  className="bg-white/[0.04] border-white/[0.08] text-white"
                  placeholder="https://shop.example.com/product"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_limited_edition}
                  onChange={(e) => setForm((prev) => ({ ...prev, is_limited_edition: e.target.checked }))}
                  className="w-4 h-4 rounded bg-white/[0.04] border-white/[0.08]"
                />
                <span className="text-sm text-white/70">Limited Edition Drop</span>
              </label>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-white/[0.06]">
              <Button variant="outline" onClick={onClose} className="flex-1 border-white/10 text-white/60">
                Cancel
              </Button>
              <Button
                onClick={() => onSave(form)}
                disabled={isSaving || !form.name || !form.price}
                className="flex-1 bg-amber-500 hover:bg-amber-600"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Product"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}