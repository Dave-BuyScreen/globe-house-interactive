import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ShoppingBag, ExternalLink, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Marketplace() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching marketplace products:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      {/* Header Banner */}
      <div className="border-b border-[#B89045]/20 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs tracking-widest text-[#D4AF37] uppercase font-semibold">Curated Commerce</span>
          <h1 className="text-3xl font-display font-bold text-[#EDE3D0] mt-1">
            GlobeHouse Marketplace
          </h1>
          <p className="text-[#EDE3D0]/70 text-sm mt-1">
            Discover luxury merchandise, wardrobe items, and signature products featured across our interactive broadcasts.
          </p>
        </div>
        <div className="bg-[#1a1410] border border-[#B89045]/30 rounded-xl px-4 py-2 text-xs text-[#D4AF37] self-start md:self-auto">
          {products.length} Items Available
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="text-center py-20 text-[#EDE3D0]/50 text-sm">Loading marketplace catalog from Supabase...</div>
      ) : products.length === 0 ? (
        <div className="bg-[#1a1410] border border-[#B89045]/20 rounded-2xl p-16 text-center space-y-3">
          <ShoppingBag className="w-12 h-12 text-[#B89045] mx-auto opacity-50" />
          <h3 className="text-lg font-display font-bold text-[#EDE3D0]">No Products Listed Yet</h3>
          <p className="text-xs text-[#EDE3D0]/60 max-w-md mx-auto">
            Your product catalog is currently empty. Add products via your Supabase table editor to feature them here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-[#1a1410] border border-[#B89045]/20 rounded-2xl overflow-hidden shadow-lg hover:border-[#D4AF37]/50 transition-all flex flex-col group"
            >
              {/* Product Image */}
              <div className="aspect-square bg-[#241c15] relative overflow-hidden flex items-center justify-center">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <ShoppingBag className="w-10 h-10 text-[#B89045]/40" />
                )}
                {product.category && (
                  <span className="absolute top-3 left-3 bg-[#120e0a]/80 backdrop-blur-md border border-[#B89045]/40 text-[#EDE3D0] text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-lg">
                    {product.category}
                  </span>
                )}
              </div>

              {/* Product Details */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <h3 className="font-display font-bold text-[#EDE3D0] text-base group-hover:text-[#D4AF37] transition-colors">
                    {product.name}
                  </h3>
                  {product.character_quote && (
                    <p className="text-xs italic text-[#EDE3D0]/60 line-clamp-2">
                      "{product.character_quote}"
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-[#B89045]/15 flex items-center justify-between">
                  <span className="font-display font-bold text-[#D4AF37] text-lg">
                    {product.price || "Price on Request"}
                  </span>
                  {product.shop_url ? (
                    <a
                      href={product.shop_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#D4AF37] to-[#B89045] text-[#1a1410] hover:opacity-90 font-semibold text-xs px-3.5 py-2 rounded-xl shadow-md transition-all"
                    >
                      Acquire <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <Button
                      variant="outline"
                      disabled
                      className="border-[#B89045]/20 bg-transparent text-[#EDE3D0]/40 text-xs px-3 py-1.5 h-8 rounded-xl"
                    >
                      Unavailable
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
