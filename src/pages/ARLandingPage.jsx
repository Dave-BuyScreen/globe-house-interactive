import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, Trash2, Upload, Loader2, Save, X, ImageIcon, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const emptyForm = { title: "", description: "", image_url: "", link_url: "", order: 0 };

export default function ARLandingPage() {
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [editingId, setEditingId] = useState(null); // null = no edit, "new" = new slide, id = edit existing
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const autoplayRef = useRef(null);

  const { data: images = [] } = useQuery({
    queryKey: ["carouselImages"],
    queryFn: () => base44.entities.CarouselImage.list("order", 50),
  });

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const isAdmin = user?.role === "admin";
  const sorted = [...images].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const goTo = (index, dir = 1) => { setDirection(dir); setCurrentIndex(index); };
  const prev = () => goTo((currentIndex - 1 + sorted.length) % sorted.length, -1);
  const next = () => goTo((currentIndex + 1) % sorted.length, 1);

  useEffect(() => {
    if (sorted.length < 2 || editingId) return;
    autoplayRef.current = setInterval(next, 5000);
    return () => clearInterval(autoplayRef.current);
  }, [currentIndex, sorted.length, editingId]);

  const current = sorted[currentIndex];

  const saveMutation = useMutation({
    mutationFn: (data) =>
      editingId === "new"
        ? base44.entities.CarouselImage.create(data)
        : base44.entities.CarouselImage.update(editingId, data),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["carouselImages"] });
      if (editingId === "new") {
        // navigate to the new slide after creation
        setCurrentIndex(sorted.length);
      }
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CarouselImage.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["carouselImages"] });
      setCurrentIndex(0);
      setEditingId(null);
    },
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, image_url: file_url }));
    setUploading(false);
  };

  const openEdit = (slide) => {
    setForm({
      title: slide.title || "",
      description: slide.description || "",
      image_url: slide.image_url || "",
      link_url: slide.link_url || "",
      order: slide.order ?? 0,
    });
    setEditingId(slide.id);
  };

  const openNew = () => {
    setForm({ ...emptyForm, order: sorted.length });
    setEditingId("new");
  };

  const variants = {
    enter: (dir) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0, scale: 0.95 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (dir) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0, scale: 0.95 }),
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col lg:flex-row">

      {/* ── LEFT: CAROUSEL PREVIEW ── */}
      <div className={`relative overflow-hidden flex-shrink-0 transition-all duration-500 ${editingId ? "lg:w-3/5" : "w-full"}`}
           style={{ height: editingId ? "60vh" : "90vh" }}>

        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <ImageIcon className="w-16 h-16 text-white/20" />
            <p className="text-white/30 text-xl">No slides yet.</p>
            {isAdmin && (
              <Button onClick={openNew} className="bg-violet-600 hover:bg-violet-700 gap-2">
                <Plus className="w-4 h-4" /> Add First Slide
              </Button>
            )}
          </div>
        ) : (
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <img src={current?.image_url} alt={current?.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, duration: 0.6 }}>
                  <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-2 drop-shadow-2xl">{current?.title}</h1>
                  {current?.description && (
                    <p className="text-white/70 text-base md:text-lg max-w-xl leading-relaxed">{current.description}</p>
                  )}
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Arrows */}
        {sorted.length > 1 && (
          <>
            <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 backdrop-blur hover:bg-black/70 flex items-center justify-center transition-all">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 backdrop-blur hover:bg-black/70 flex items-center justify-center transition-all">
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {sorted.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {sorted.map((_, i) => (
              <button key={i} onClick={() => goTo(i, i > currentIndex ? 1 : -1)}
                className={`h-2 rounded-full transition-all duration-300 ${i === currentIndex ? "w-8 bg-violet-400" : "w-2 bg-white/30 hover:bg-white/60"}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── RIGHT / BOTTOM: ADMIN PANEL ── */}
      {isAdmin && (
        <div className={`bg-[#13131a] border-l border-white/[0.06] flex flex-col transition-all duration-500 ${editingId ? "lg:w-2/5 w-full" : "hidden"}`}>

          {editingId ? (
            /* EDIT FORM */
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                <h2 className="text-base font-semibold text-white">{editingId === "new" ? "New Slide" : "Edit Slide"}</h2>
                <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Image */}
                <div>
                  <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">Image</label>
                  {form.image_url ? (
                    <div className="relative rounded-xl overflow-hidden h-40">
                      <img src={form.image_url} alt="preview" className="w-full h-full object-cover" />
                      <button onClick={() => setForm(f => ({ ...f, image_url: "" }))}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center hover:bg-red-500/80 transition-colors">
                        <X className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed border-white/[0.12] hover:border-violet-400/50 cursor-pointer transition-colors bg-white/[0.02]">
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                        {uploading ? <Loader2 className="w-7 h-7 text-violet-400 animate-spin" /> : (
                          <><Upload className="w-7 h-7 text-white/30 mb-1" /><span className="text-white/40 text-sm">Upload image</span></>
                        )}
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-px bg-white/[0.06]" />
                        <span className="text-white/20 text-xs">or URL</span>
                        <div className="flex-1 h-px bg-white/[0.06]" />
                      </div>
                      <Input placeholder="https://..." value={form.image_url} onChange={(e) => setForm(f => ({ ...f, image_url: e.target.value }))}
                        className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20" />
                    </div>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">Title *</label>
                  <Input placeholder="Slide title" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                    className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20" />
                </div>

                {/* Tagline */}
                <div>
                  <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">Tagline</label>
                  <Input placeholder="Optional tagline / description" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                    className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20" />
                </div>

                {/* Link URL */}
                <div>
                  <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">Link URL</label>
                  <Input placeholder="https://... (optional)" value={form.link_url} onChange={(e) => setForm(f => ({ ...f, link_url: e.target.value }))}
                    className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20" />
                </div>

                {/* Order */}
                <div>
                  <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">Display Order</label>
                  <Input type="number" value={form.order} onChange={(e) => setForm(f => ({ ...f, order: Number(e.target.value) }))}
                    className="bg-white/[0.04] border-white/[0.08] text-white w-24" />
                </div>

                {/* Delete */}
                {editingId !== "new" && (
                  <button onClick={() => { if (window.confirm("Delete this slide?")) deleteMutation.mutate(editingId); }}
                    className="flex items-center gap-2 text-sm text-red-400/70 hover:text-red-400 transition-colors mt-2">
                    <Trash2 className="w-4 h-4" /> Delete this slide
                  </button>
                )}
              </div>

              {/* Save footer */}
              <div className="px-6 py-4 border-t border-white/[0.06]">
                <Button onClick={() => saveMutation.mutate(form)} disabled={!form.title || !form.image_url || saveMutation.isPending}
                  className="w-full bg-violet-600 hover:bg-violet-700 gap-2">
                  {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Slide
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ── SLIDE LIST + ADD BUTTON (below carousel when no edit panel open) ── */}
      {isAdmin && !editingId && (
        <div className="bg-[#0a0a0f] px-6 pb-8">
          {/* Thumbnail strip with edit buttons */}
          <div className="flex gap-3 py-5 overflow-x-auto scrollbar-hide justify-center flex-wrap">
            {sorted.map((img, i) => (
              <div key={img.id} className="relative flex-shrink-0 group">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  onClick={() => goTo(i, i > currentIndex ? 1 : -1)}
                  className={`w-32 h-20 rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                    i === currentIndex ? "border-violet-400 shadow-lg shadow-violet-500/30" : "border-transparent opacity-50 hover:opacity-80"
                  }`}
                >
                  <img src={img.image_url} alt={img.title} className="w-full h-full object-cover" />
                </motion.div>
                {/* Edit pencil */}
                <button
                  onClick={() => { goTo(i, i > currentIndex ? 1 : -1); openEdit(img); }}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-violet-500"
                >
                  <Pencil className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
            {/* Add slide thumbnail */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={openNew}
              className="flex-shrink-0 w-32 h-20 rounded-xl border-2 border-dashed border-white/[0.15] hover:border-violet-400/60 flex flex-col items-center justify-center gap-1 text-white/30 hover:text-violet-400 transition-all"
            >
              <Plus className="w-5 h-5" />
              <span className="text-xs">Add Slide</span>
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}