import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Upload, Trash2, ImageIcon, Loader2, Crop, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ImageCropper from "./ImageCropper";
import SlideTypographyControls from "./SlideTypographyControls";
import DeviceImageSlot, { DEVICE_SLOTS } from "./DeviceImageSlot";
import FloatingDashboardButton from "@/components/dashboard/FloatingDashboardButton";

const emptyForm = {
  title: "",
  description: "",
  image_url: "",
  image_url_mobile: "",
  image_url_tablet: "",
  link_url: "",
  order: 0,
  title_font: "",
  title_color: "",
  title_size: "",
  title_italic: false,
  title_letter_spacing: "",
  description_font: "",
  description_color: "",
  description_size: "",
  description_italic: false,
  description_letter_spacing: "",
};

export default function CarouselImageManager({ onClose }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("carousel"); // "carousel" | "favicon"
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [cropping, setCropping] = useState(null);

  // Favicon state
  const [faviconUploading, setFaviconUploading] = useState(false);

  const { data: images = [] } = useQuery({
    queryKey: ["carouselImages"],
    queryFn: () => base44.entities.CarouselImage.list("order", 50),
  });

  const { data: settings = [] } = useQuery({
    queryKey: ["siteSettings"],
    queryFn: () => base44.entities.SiteSettings.list(),
  });

  const siteSettings = settings[0];

  const sorted = [...images].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const saveMutation = useMutation({
    mutationFn: (data) =>
      editing?.id
        ? base44.entities.CarouselImage.update(editing.id, data)
        : base44.entities.CarouselImage.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["carouselImages"] });
      setEditing(null);
      setForm(emptyForm);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CarouselImage.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["carouselImages"] }),
  });

  const faviconMutation = useMutation({
    mutationFn: async (favicon_url) => {
      if (siteSettings?.id) {
        return base44.entities.SiteSettings.update(siteSettings.id, { favicon_url });
      }
      return base44.entities.SiteSettings.create({ favicon_url });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["siteSettings"] });
    },
  });

  // Apply favicon to browser tab whenever it changes
  useEffect(() => {
    if (siteSettings?.favicon_url) {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = siteSettings.favicon_url;
    }
  }, [siteSettings?.favicon_url]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCropping(reader.result);
    reader.readAsDataURL(file);
  };

  const handleFaviconUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFaviconUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await faviconMutation.mutateAsync(file_url);
    setFaviconUploading(false);
  };

  const openNew = () => {
    setForm({ ...emptyForm, order: sorted.length });
    setEditing({});
  };

  const openEdit = (img) => {
    setForm({
      title: img.title || "",
      description: img.description || "",
      image_url: img.image_url || "",
      image_url_mobile: img.image_url_mobile || "",
      image_url_tablet: img.image_url_tablet || "",
      link_url: img.link_url || "",
      order: img.order ?? 0,
      title_font: img.title_font || "",
      title_color: img.title_color || "",
      title_size: img.title_size || "",
      title_italic: img.title_italic || false,
      title_letter_spacing: img.title_letter_spacing || "",
      description_font: img.description_font || "",
      description_color: img.description_color || "",
      description_size: img.description_size || "",
      description_italic: img.description_italic || false,
      description_letter_spacing: img.description_letter_spacing || "",
    });
    setEditing(img);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
      <FloatingDashboardButton onClose={onClose} />
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="bg-[#13131a] border border-white/[0.08] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-lg font-semibold text-white">Site Settings</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/[0.06] px-6">
          <button
            onClick={() => { setActiveTab("carousel"); setEditing(null); setForm(emptyForm); }}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "carousel"
                ? "border-violet-400 text-violet-400"
                : "border-transparent text-white/40 hover:text-white/70"
            }`}
          >
            Carousel Slides
          </button>
          <button
            onClick={() => { setActiveTab("favicon"); setEditing(null); }}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "favicon"
                ? "border-violet-400 text-violet-400"
                : "border-transparent text-white/40 hover:text-white/70"
            }`}
          >
            <Globe className="w-4 h-4" />
            Favicon
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">

            {/* ── FAVICON TAB ── */}
            {activeTab === "favicon" && (
              <motion.div key="favicon" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <p className="text-white/40 text-sm">
                  Upload a square PNG or ICO image (32×32 or 64×64 px recommended). This icon appears in the browser tab.
                </p>

                {siteSettings?.favicon_url ? (
                  <div className="flex items-center gap-4 bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                    <img src={siteSettings.favicon_url} alt="Favicon" className="w-12 h-12 object-contain rounded-lg bg-white/[0.06] p-1" />
                    <div className="flex-1">
                      <p className="text-white/80 text-sm font-medium">Current Favicon</p>
                      <p className="text-white/30 text-xs truncate">{siteSettings.favicon_url}</p>
                    </div>
                    <button
                      onClick={() => faviconMutation.mutate("")}
                      className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-40 rounded-xl border-2 border-dashed border-white/[0.12] hover:border-violet-400/50 cursor-pointer transition-colors bg-white/[0.02]">
                    <input type="file" accept="image/*,.ico" className="hidden" onChange={handleFaviconUpload} />
                    {faviconUploading ? (
                      <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                    ) : (
                      <>
                        <Globe className="w-10 h-10 text-white/20 mb-3" />
                        <span className="text-white/50 text-sm font-medium">Click to upload favicon</span>
                        <span className="text-white/20 text-xs mt-1">PNG, ICO — 32×32 or 64×64 recommended</span>
                      </>
                    )}
                  </label>
                )}

                {siteSettings?.favicon_url && (
                  <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.08] hover:border-violet-400/40 cursor-pointer transition-colors bg-white/[0.02] w-fit">
                    <input type="file" accept="image/*,.ico" className="hidden" onChange={handleFaviconUpload} />
                    {faviconUploading ? <Loader2 className="w-4 h-4 text-violet-400 animate-spin" /> : <Upload className="w-4 h-4 text-white/40" />}
                    <span className="text-white/60 text-sm">Replace favicon</span>
                  </label>
                )}
              </motion.div>
            )}

            {/* ── CAROUSEL TAB ── */}
            {activeTab === "carousel" && (
              <>
                {/* FORM VIEW */}
                {editing !== null ? (
                  <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-white/40 uppercase tracking-wider">Images</label>
                        <label className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 cursor-pointer transition-colors">
                          <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                          <Crop className="w-3.5 h-3.5" />
                          Crop from one image
                        </label>
                      </div>
                      {cropping && (
                        <ImageCropper
                          imageSrc={cropping}
                          onCropComplete={(urls) => { setForm((f) => ({ ...f, ...urls })); setCropping(null); }}
                          onCancel={() => setCropping(null)}
                        />
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {DEVICE_SLOTS.map((d) => (
                          <DeviceImageSlot
                            key={d.key}
                            label={d.label}
                            ratio={d.ratio}
                            value={form[d.field]}
                            onChange={(url) => setForm((f) => ({ ...f, [d.field]: url }))}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">Title *</label>
                      <Input placeholder="Slide title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20" />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">Description</label>
                      <Input placeholder="Optional tagline" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20" />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">Link URL</label>
                      <Input placeholder="https://... (optional)" value={form.link_url} onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))} className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20" />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">Order</label>
                      <Input type="number" placeholder="0" value={form.order} onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))} className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 w-24" />
                    </div>

                    {/* Typography controls */}
                    <div className="space-y-3 pt-2">
                      <p className="text-xs text-white/40 uppercase tracking-wider">Typography</p>
                      <SlideTypographyControls label="Title" prefix="title" form={form} setForm={setForm} />
                      <SlideTypographyControls label="Description" prefix="description" form={form} setForm={setForm} />
                    </div>
                  </motion.div>
                ) : (
                  /* LIST VIEW */
                  <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                    {sorted.length === 0 && <p className="text-white/30 text-center py-8">No slides yet. Add one below.</p>}
                    {sorted.map((img) => (
                      <div key={img.id} className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 hover:bg-white/[0.05] transition-colors">
                        <div className="w-16 h-10 rounded-lg overflow-hidden bg-white/[0.04] flex-shrink-0">
                          {img.image_url ? <img src={img.image_url} alt={img.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-4 h-4 text-white/20" /></div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{img.title}</p>
                          {img.description && <p className="text-white/40 text-xs truncate">{img.description}</p>}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(img)} className="text-white/40 hover:text-white h-8 px-3">Edit</Button>
                          <button onClick={() => deleteMutation.mutate(img.id)} className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-white/[0.06] flex justify-between items-center">
          {activeTab === "carousel" && editing !== null ? (
            <>
              <Button variant="ghost" onClick={() => { setEditing(null); setForm(emptyForm); }} className="text-white/40 hover:text-white">Back</Button>
              <Button onClick={() => saveMutation.mutate(form)} disabled={!form.title || !form.image_url || saveMutation.isPending} className="bg-violet-600 hover:bg-violet-700 text-white">
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save Slide
              </Button>
            </>
          ) : activeTab === "carousel" ? (
            <Button onClick={openNew} className="ml-auto bg-violet-600 hover:bg-violet-700 text-white gap-2">
              <Plus className="w-4 h-4" />
              Add Slide
            </Button>
          ) : (
            <div />
          )}
        </div>
      </motion.div>
    </div>,
    document.body
  );
}