import React from "react";
import { ShoppingBag, ExternalLink } from "lucide-react";

export default function ProductCard({ product, merchantName }) {
  const price = product.display_price || (product.price ? `$${(product.price / 100).toFixed(2)}` : "");

  return (
    <div className="group relative bg-[#13131a] rounded-2xl overflow-hidden border border-white/[0.06] hover:border-emerald-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10">
      {/* Product Image */}
      <div className="aspect-square overflow-hidden bg-[#0f0f17] relative">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="w-12 h-12 text-white/10" />
          </div>
        )}

        {/* Category badge */}
        {product.category && product.category !== "other" && (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
            <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">
              {product.category}
            </span>
          </div>
        )}

        {/* Featured badge */}
        {product.is_featured && (
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-amber-500/20 backdrop-blur-md border border-amber-400/30">
            <span className="text-[10px] uppercase tracking-wider text-amber-300 font-semibold">
              Featured
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        {merchantName && (
          <p className="text-[11px] text-white/30 uppercase tracking-wider mb-1 truncate">{merchantName}</p>
        )}
        <h3 className="text-sm font-semibold text-white truncate group-hover:text-emerald-400 transition-colors">
          {product.name}
        </h3>
        {product.brand && (
          <p className="text-xs text-white/40 mt-0.5">{product.brand}</p>
        )}
        {product.short_description && (
          <p className="text-xs text-white/30 mt-2 line-clamp-2">{product.short_description}</p>
        )}

        <div className="flex items-center justify-between mt-3">
          {price && (
            <span className="text-lg font-bold text-white">{price}</span>
          )}
          {product.product_url && (
            <a
              href={product.product_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all text-xs font-medium"
            >
              Shop <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}