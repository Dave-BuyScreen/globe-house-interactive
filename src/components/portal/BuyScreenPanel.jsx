import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, ExternalLink, Box, Bookmark, BookmarkCheck, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import ARViewer from "./ARViewer";
import StripeCheckoutForm from "./StripeCheckoutForm";
import QRCodeLauncher from "../ar/QRCodeLauncher";

// Initialize Stripe with error handling
let stripePromise = null;
try {
  stripePromise = loadStripe('pk_live_51LlEa3D7VxANrcNIwTWcVQBT4QzJDmzhhcRtFnkmdOMPch53F4mpydGhSss4BBbHWIUtkLii5xajtJxR0rkKeTPK00uZC27APs');
} catch (error) {
  console.error('Failed to initialize Stripe:', error);
}

export default function BuyScreenPanel({ isOpen, trigger, themeColor = "#8B5CF6", onClose, episodeId, episodeTitle }) {
  const [showAR, setShowAR] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: wishlistItems = [] } = useQuery({
    queryKey: ["wishlist", user?.email],
    queryFn: () => base44.entities.WishlistItem.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const isSaved = wishlistItems.some(
    w => w.episode_id === episodeId && w.product_name === trigger?.product_name
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isSaved) {
        const item = wishlistItems.find(w => w.episode_id === episodeId && w.product_name === trigger?.product_name);
        if (item) await base44.entities.WishlistItem.delete(item.id);
      } else {
        await base44.entities.WishlistItem.create({
          user_email: user.email,
          episode_id: episodeId,
          episode_title: episodeTitle || "",
          product_name: trigger?.product_name || "",
          product_brand: trigger?.product_brand || "",
          product_price: trigger?.product_price || "",
          product_image_url: trigger?.product_image_url || "",
          product_description: trigger?.product_description || "",
          shop_url: trigger?.shop_url || "",
          trigger_timestamp: trigger?.timestamp || 0,
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wishlist"] }),
  });

  const handleShopClick = () => {
    base44.analytics.track({
      eventName: "shop_click",
      properties: { episode_id: episodeId || "", product_name: trigger?.product_name || "" }
    });

    if (trigger?.shop_url) {
      window.open(trigger.shop_url, "_blank");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* Dark backdrop */}
          <div className="absolute inset-0 bg-black/85 backdrop-blur-lg" onClick={onClose} />

          {/* Content */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 30 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full mx-auto"
            style={{ maxWidth: "min(300px, 70vh * 9/16)", width: "min(300px, 92vw)" }}
          >
            {/* BuyScreen marketplace poster card (reference design, shrunken) */}
            <div
              className="relative rounded-2xl overflow-hidden bg-black border border-[#E5B84A]/30 flex flex-col"
              style={{ aspectRatio: "3/4", boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(229,184,74,0.08)" }}
            >
              {/* ── Top: product image region ── */}
              <div className="relative flex-1 overflow-hidden"
                   style={{ background: "linear-gradient(to bottom, #6b6b66 0%, #2a2a27 55%, #000000 100%)" }}>
                {(trigger?.model_url || trigger?.model_embed_code) ? (
                  trigger?.model_embed_code ? (
                    <div className="absolute inset-0" dangerouslySetInnerHTML={{ __html: trigger.model_embed_code }} />
                  ) : (
                    <div
                      className="absolute inset-0"
                      dangerouslySetInnerHTML={{
                        __html: `
                          <model-viewer
                            src="${trigger.model_url}"
                            auto-rotate auto-rotate-delay="0" rotation-per-second="20deg"
                            camera-controls shadow-intensity="1.5" exposure="1.2" environment-image="neutral"
                            style="width:100%;height:100%;background:transparent;">
                          </model-viewer>
                        `
                      }}
                    />
                  )
                ) : trigger?.product_image_url ? (
                  <img
                    src={trigger.product_image_url}
                    alt={trigger.product_name}
                    className="absolute inset-0 w-full h-full object-contain p-5"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ShoppingBag className="w-10 h-10 text-white/25" />
                  </div>
                )}

                {/* BUYSCREEN badge */}
                <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-[#4D4D4A] text-[#FFD700] text-[10px] font-bold tracking-tight uppercase">
                  BuyScreen
                </span>

                {/* Close */}
                <button
                  onClick={onClose}
                  className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/50
                             flex items-center justify-center text-white/60 hover:text-white hover:bg-black/80
                             transition-all duration-200 z-30"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* ── Bottom: product info + CTA ── */}
              <div className="relative bg-black px-4 py-4 flex flex-col gap-2 flex-shrink-0">
                {trigger?.product_brand && (
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#E5B84A] leading-none">
                    {trigger.product_brand}
                  </p>
                )}
                <h3 className="text-[15px] font-extrabold uppercase text-white leading-tight tracking-tight">
                  {trigger?.product_name || "Item"}
                </h3>

                {showCheckout ? (
                  stripePromise ? (
                    <div className="pt-1">
                      <Elements stripe={stripePromise}>
                        <StripeCheckoutForm
                          amount={parseFloat(trigger?.product_price?.replace(/[^0-9.]/g, '') || '0')}
                          currency="usd"
                          productName={trigger?.product_name || ''}
                          productDescription={trigger?.product_description || ''}
                          episodeId={episodeId}
                          triggerTimestamp={trigger?.timestamp}
                          onSuccess={() => {
                            setShowCheckout(false);
                            base44.analytics.track({
                              eventName: "purchase_completed",
                              properties: {
                                episode_id: episodeId || "",
                                product_name: trigger?.product_name || "",
                                amount: parseFloat(trigger?.product_price?.replace(/[^0-9.]/g, '') || '0')
                              }
                            });
                          }}
                          onCancel={() => setShowCheckout(false)}
                        />
                      </Elements>
                    </div>
                  ) : (
                    <div className="pt-1">
                      <p className="text-[11px] text-red-300">Payment unavailable.</p>
                      <button
                        onClick={() => setShowCheckout(false)}
                        className="mt-1 text-[11px] text-white/60 underline"
                      >
                        Go back
                      </button>
                    </div>
                  )
                ) : (
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-[18px] font-extrabold text-[#E5B84A] leading-none">
                      {trigger?.product_price || ""}
                    </span>
                    <button
                      onClick={() => {
                        setShowCheckout(true);
                        base44.analytics.track({
                          eventName: "checkout_initiated",
                          properties: { episode_id: episodeId || "", product_name: trigger?.product_name || "" }
                        });
                      }}
                      className="px-4 py-1.5 rounded-full bg-[#E5B84A] text-black text-[11px] font-bold uppercase tracking-wide hover:bg-[#d4a83f] transition-colors"
                    >
                      Buy Now
                    </button>
                  </div>
                )}

                {/* Secondary actions row */}
                {!showCheckout && (
                  <div className="flex items-center gap-3 pt-1 border-t border-white/[0.06] mt-1">
                    {trigger?.shop_url && (
                      <button onClick={handleShopClick} className="flex items-center gap-1 text-[10px] text-white/50 hover:text-[#E5B84A] transition-colors">
                        <ExternalLink className="w-3 h-3" /> Store
                      </button>
                    )}
                    {user && (
                      <button
                        onClick={() => saveMutation.mutate()}
                        disabled={saveMutation.isPending}
                        className="flex items-center gap-1 text-[10px] text-white/50 hover:text-[#E5B84A] transition-colors"
                      >
                        {isSaved ? <BookmarkCheck className="w-3 h-3" /> : <Bookmark className="w-3 h-3" />}
                        {isSaved ? "Saved" : "Save"}
                      </button>
                    )}
                    {trigger?.model_url && (
                      <button
                        onClick={() => {
                          setShowAR(true);
                          base44.analytics.track({ eventName: "ar_viewer_opened", properties: { product: trigger.product_name } });
                        }}
                        className="flex items-center gap-1 text-[10px] text-white/50 hover:text-[#E5B84A] transition-colors"
                      >
                        <Box className="w-3 h-3" /> AR
                      </button>
                    )}
                    {trigger?.model_url && <QRCodeLauncher trigger={trigger} themeColor="#E5B84A" />}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* AR Viewer */}
      <ARViewer
        modelUrl={trigger?.model_url}
        modelEmbedCode={trigger?.model_embed_code}
        productName={trigger?.product_name}
        productPrice={trigger?.product_price}
        shopUrl={trigger?.shop_url}
        characterQuote={trigger?.product_quote}
        themeColor={themeColor}
        isOpen={showAR}
        onClose={() => {
          setShowAR(false);
          base44.analytics.track({
            eventName: "ar_viewer_closed",
            properties: { product: trigger?.product_name }
          });
        }}
        onAddToCart={() => {
          setShowAR(false);
          handleShopClick();
        }}
      />
    </AnimatePresence>
  );
}