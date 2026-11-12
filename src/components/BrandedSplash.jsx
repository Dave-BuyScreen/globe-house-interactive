// Lightweight branded loading state — no heavy dependencies.
// Used as the Suspense fallback for lazy-loaded routes and chunks.
export default function BrandedSplash({ label }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#0a0a0f]">
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-12 h-12 rounded-full border-2 border-[#D4AF37]/20"
          style={{ borderTopColor: "#D4AF37", animation: "gh-spin 0.8s linear infinite" }}
        />
        <p
          className="text-[#D4AF37]/60 text-xs tracking-[0.4em] uppercase"
          style={{ fontFamily: "Georgia, serif", margin: 0 }}
        >
          {label || "GlobeHouse"}
        </p>
      </div>
    </div>
  );
}