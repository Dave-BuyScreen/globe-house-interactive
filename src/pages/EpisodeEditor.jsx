import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "../utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Loader2, Upload, Film, Palette, X, Eye, Trash2, Building2, Check } from "lucide-react";
import { resolveFloors } from "../components/dashboard/floors";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Link } from "react-router-dom";
import TriggerEditor from "../components/editor/TriggerEditor";
import TimelineVisualizer from "../components/editor/TimelineVisualizer";
import AIAssistant from "../components/editor/AIAssistant";
import ProductDetectionPanel from "../components/editor/ProductDetectionPanel";
import AutoScanPanel from "../components/editor/AutoScanPanel";
import CollaboratorPanel from "../components/collaboration/CollaboratorPanel";
import VideoUploadProcessor from "../components/video/VideoUploadProcessor";

export default function EpisodeEditor() {
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get("id");
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  // Check if user is a collaborator (not the owner)
  const { data: collaborators = [] } = useQuery({
    queryKey: ["userCollaboration", editId],
    queryFn: () => base44.entities.EpisodeCollaborator.filter({
      episode_id: editId,
      collaborator_email: user?.email,
      status: "accepted"
    }),
    enabled: !!editId && !!user,
  });

  const userCollaboration = collaborators[0];
  const isCollaborator = !!userCollaboration;
  const userPermissions = userCollaboration?.permissions;

  const [form, setForm] = useState({
    title: "",
    vimeo_url: "",
    youtube_url: "",
    thumbnail_url: "",
    summary: "",
    keywords: [],
    theme_color: "#8B5CF6",
    status: "draft",
    category: "other",
    assigned_floors: [],
    triggers: []
  });

  const [keywordInput, setKeywordInput] = useState("");

  // Load existing episode if editing
  const { data: existingEpisode } = useQuery({
    queryKey: ["episode", editId],
    queryFn: () => base44.entities.Episode.filter({ id: editId }),
    enabled: !!editId,
  });

  // Site settings → resolved floors (for multi-floor assignment)
  const { data: settings = [] } = useQuery({
    queryKey: ["siteSettings"],
    queryFn: () => base44.entities.SiteSettings.list(),
  });
  const siteSettings = settings[0];
  const floors = resolveFloors(siteSettings?.floors_config, siteSettings?.row_labels);

  // Load the episode ONCE on open. A ref guard prevents background query
  // refetches (window focus, re-mount) from overwriting in-progress edits —
  // especially floor assignments — before the admin clicks Save.
  const initializedRef = useRef(false);
  useEffect(() => {
    if (existingEpisode && existingEpisode.length > 0 && !initializedRef.current) {
      const ep = existingEpisode[0];
      setForm({
        title: ep.title || "",
        vimeo_url: ep.vimeo_url || "",
        youtube_url: ep.youtube_url || "",
        thumbnail_url: ep.thumbnail_url || "",
        summary: ep.summary || "",
        keywords: ep.keywords || [],
        theme_color: ep.theme_color || "#8B5CF6",
        status: ep.status || "draft",
        category: ep.category || "other",
        assigned_floors: ep.assigned_floors || [],
        triggers: ep.triggers || []
      });
      initializedRef.current = true;
    }
  }, [existingEpisode]);

  const handleApplyAISuggestions = (suggestions) => {
    setForm(prev => ({
      ...prev,
      ...(suggestions.summary && { summary: suggestions.summary }),
      ...(suggestions.keywords && { keywords: suggestions.keywords }),
    }));
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !form.keywords.includes(keywordInput.trim())) {
      setForm(prev => ({ ...prev, keywords: [...prev.keywords, keywordInput.trim()] }));
      setKeywordInput("");
    }
  };

  const removeKeyword = (keyword) => {
    setForm(prev => ({ ...prev, keywords: prev.keywords.filter(k => k !== keyword) }));
  };

  const toggleFloor = (key) => {
    setForm(prev => {
      const current = prev.assigned_floors || [];
      return {
        ...prev,
        assigned_floors: current.includes(key)
          ? current.filter(k => k !== key)
          : [...current, key],
      };
    });
  };

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Episode.delete(editId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["episodes"] });
      window.location.href = createPageUrl("Dashboard");
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editId) {
        return base44.entities.Episode.update(editId, data);
      }
      return base44.entities.Episode.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["episodes"] });
      window.location.href = createPageUrl("Dashboard");
    }
  });

  const handleSave = () => {
    saveMutation.mutate(form);
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(prev => ({ ...prev, [field]: file_url }));
  };

  const themeColors = [
    { label: "Violet", value: "#8B5CF6" },
    { label: "Fuchsia", value: "#D946EF" },
    { label: "Blue", value: "#3B82F6" },
    { label: "Emerald", value: "#10B981" },
    { label: "Amber", value: "#F59E0B" },
    { label: "Red", value: "#EF4444" },
    { label: "Neon Purple", value: "#A855F7" },
  ];

  return (
    <div className="min-h-screen px-4 sm:px-6 py-10 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <Link to={createPageUrl("Dashboard")}>
          <Button variant="ghost" size="icon" className="text-white/40 hover:text-white hover:bg-white/[0.06] rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">
            {editId ? "Edit Episode" : "New Episode"}
          </h1>
          <p className="text-sm text-white/30 mt-1">Configure your video and interactive triggers</p>
        </div>
        <div className="flex gap-2">
          {editId && (
            <Link to={`${createPageUrl("EpisodePreview")}?id=${editId}`}>
              <Button
                variant="outline"
                className="border-white/10 bg-white/[0.04] hover:bg-white/[0.08] rounded-xl h-10 gap-2"
              >
                <Eye className="w-4 h-4" />
                Preview
              </Button>
            </Link>
          )}
          {editId && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl h-10 gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-[#13131a] border-white/[0.08]">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">Delete Episode?</AlertDialogTitle>
                  <AlertDialogDescription className="text-white/50">
                    This will permanently delete <span className="text-white font-medium">"{form.title}"</span> and all its triggers. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-white/[0.04] border-white/[0.08] text-white hover:bg-white/[0.08]">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMutation.mutate()}
                    disabled={deleteMutation.isPending}
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete Episode"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending || !form.title || (!form.vimeo_url && !form.youtube_url)}
            className="bg-violet-500 hover:bg-violet-600 rounded-xl h-10 gap-2"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save
          </Button>
        </div>
      </div>

      <div className="space-y-8">
        {/* AI Assistant */}
        <AIAssistant
          vimeoUrl={form.vimeo_url}
          currentTitle={form.title}
          currentSummary={form.summary}
          currentKeywords={form.keywords}
          onApplySuggestions={handleApplyAISuggestions}
        />

        {/* Video Processing & Transcoding */}
        <VideoUploadProcessor
          episodeId={editId}
          onProcessingComplete={(outputs) => {
            if (outputs.mp4_1080p) {
              setForm(prev => ({ ...prev, vimeo_url: outputs.mp4_1080p }));
            }
          }}
        />

        {/* Main Video Upload */}
        <section className="bg-[#13131a] border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <Film className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white/90">Main Video</h2>
              <p className="text-xs text-white/30">Your Vimeo video that serves as the main player</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-xs text-white/40 mb-1.5">Episode Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Episode 1: The Beginning"
                className="h-11 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20"
              />
            </div>
            <div>
              <Label className="text-xs text-white/40 mb-1.5">Vimeo URL</Label>
              <Input
                value={form.vimeo_url}
                onChange={(e) => setForm(prev => ({ ...prev, vimeo_url: e.target.value }))}
                placeholder="https://vimeo.com/123456789"
                className="h-11 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20"
              />
            </div>
            <div>
              <Label className="text-xs text-white/40 mb-1.5">YouTube URL</Label>
              <Input
                value={form.youtube_url}
                onChange={(e) => setForm(prev => ({ ...prev, youtube_url: e.target.value }))}
                placeholder="https://www.youtube.com/watch?v=..."
                className="h-11 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20"
              />
            </div>
            <div>
              <Label className="text-xs text-white/40 mb-1.5">Thumbnail (optional)</Label>
              <div className="flex gap-3">
                <Input
                  value={form.thumbnail_url}
                  onChange={(e) => setForm(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                  placeholder="Image URL or upload"
                  className="h-11 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 flex-1"
                />
                <label className="h-11 px-4 rounded-xl border border-white/[0.08] bg-white/[0.04] flex items-center gap-2 cursor-pointer hover:bg-white/[0.06] transition-colors">
                  <Upload className="w-4 h-4 text-white/40" />
                  <span className="text-xs text-white/40">Upload</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, "thumbnail_url")} />
                </label>
              </div>
            </div>
            <div>
              <Label className="text-xs text-white/40 mb-1.5">Episode Summary</Label>
              <Textarea
                value={form.summary}
                onChange={(e) => setForm(prev => ({ ...prev, summary: e.target.value }))}
                placeholder="Compelling summary of the episode..."
                className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 min-h-[80px]"
              />
            </div>
            <div>
              <Label className="text-xs text-white/40 mb-1.5">Keywords & Tags</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                    placeholder="Add keyword..."
                    className="h-9 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 flex-1"
                  />
                  <Button
                    type="button"
                    onClick={addKeyword}
                    className="h-9 bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.08]"
                  >
                    Add
                  </Button>
                </div>
                {form.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {form.keywords.map((keyword, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-violet-500/10 text-violet-400 text-xs rounded-full border border-violet-500/20 flex items-center gap-2"
                      >
                        {keyword}
                        <button
                          onClick={() => removeKeyword(keyword)}
                          className="hover:text-violet-300"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            </div>
            </section>

        {/* Theme */}
        <section className="bg-[#13131a] border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-fuchsia-500/10 flex items-center justify-center">
              <Palette className="w-5 h-5 text-fuchsia-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white/90">Theme & Style</h2>
              <p className="text-xs text-white/30">Character accent color and publish status</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-white/40 mb-1.5">Accent Color</Label>
              <div className="flex gap-2 flex-wrap">
                {themeColors.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setForm(prev => ({ ...prev, theme_color: c.value }))}
                    className={`w-8 h-8 rounded-lg border-2 transition-all ${
                      form.theme_color === c.value ? "border-white scale-110" : "border-transparent"
                    }`}
                    style={{ background: c.value }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs text-white/40 mb-1.5">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm(prev => ({ ...prev, status: v }))}>
                <SelectTrigger className="h-11 bg-white/[0.04] border-white/[0.08] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            </div>
            <div className="mt-4">
            <Label className="text-xs text-white/40 mb-1.5">Category</Label>
            <Select value={form.category} onValueChange={(v) => setForm(prev => ({ ...prev, category: v }))}>
              <SelectTrigger className="h-11 bg-white/[0.04] border-white/[0.08] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="red_rooster_jazz">Red Rooster & Harlem Live Jazz</SelectItem>
                <SelectItem value="comedy_lounge">Talent's it's Just Comedy lounge</SelectItem>
                <SelectItem value="documentaries">Documentaries</SelectItem>
                <SelectItem value="tv_shows">TV Shows</SelectItem>
              </SelectContent>
            </Select>
            </div>
            </section>

        {/* Floor Assignment */}
        <section className="bg-[#13131a] border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white/90">Floor Assignment</h2>
              <p className="text-xs text-white/30">Place this episode on one or more dashboard floors</p>
            </div>
          </div>
          {floors.length === 0 ? (
            <p className="text-xs text-white/30">No floors configured. Use the Floor Manager on the Dashboard to create floors.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {floors.map((floor) => {
                const selected = (form.assigned_floors || []).includes(floor.key);
                return (
                  <button
                    key={floor.key}
                    type="button"
                    onClick={() => toggleFloor(floor.key)}
                    className={`px-3 py-2 rounded-xl border text-sm transition-all flex items-center gap-2 ${
                      selected
                        ? "border-amber-500/50 bg-amber-500/15 text-amber-300"
                        : "border-white/[0.08] bg-white/[0.04] text-white/50 hover:text-white hover:bg-white/[0.06]"
                    }`}
                  >
                    <span className="w-6 h-6 rounded-md bg-[#2A1C12] border border-[#B89045]/30 text-[#E9C97A] text-xs flex items-center justify-center font-semibold">{floor.tag}</span>
                    {floor.name}
                    {selected && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          )}
          <p className="text-xs text-white/30 mt-3">Select every floor where this episode should appear. An episode shows <span className="text-amber-400">only</span> on the floors you pick — leave it unchecked and it won't appear on the dashboard until you place it.</p>
        </section>

        {/* Augmented Experience — Triggers */}
        <section className="bg-[#13131a] border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-amber-400">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-white/90">Augmented Experience</h2>
              <p className="text-xs text-white/30">Confessional overlays, BuyScreen, and AR triggers</p>
            </div>
          </div>

          {/* Timeline Visualization */}
          <TimelineVisualizer
            triggers={form.triggers}
            duration={180}
            onAddTrigger={(timestamp) => {
              const newTrigger = {
                timestamp,
                prompt_text: "Find the deeper meaning.",
                confessional_video_url: "",
                confessional_duration: 10,
                product_image_url: "",
                product_name: "",
                product_price: "",
                product_quote: "",
                shop_url: "",
                model_url: ""
              };
              setForm(prev => ({ ...prev, triggers: [...(prev.triggers || []), newTrigger] }));
            }}
            onSelectTrigger={(index) => {
              // Auto-scroll to trigger in editor below
              const element = document.getElementById(`trigger-${index}`);
              if (element) element.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
          />

          <div className="pt-6 space-y-6">
            {/* Collaboration Management - only for owners */}
            {editId && !isCollaborator && (
              <CollaboratorPanel
                episodeId={editId}
                episodeTitle={form.title}
                triggerCount={(form.triggers || []).length}
              />
            )}

            {/* Auto Video Scanner */}
            {!isCollaborator && (
              <AutoScanPanel
                episodeId={editId}
                vimeoUrl={form.vimeo_url}
                onTriggersDetected={(triggers) => setForm(prev => ({ ...prev, triggers: [...(prev.triggers || []), ...triggers] }))}
              />
            )}

            {/* AI Product Detection */}
            {!isCollaborator && (
              <ProductDetectionPanel
                episodeId={editId}
                triggers={form.triggers}
                onUpdate={(triggers) => setForm(prev => ({ ...prev, triggers }))}
              />
            )}

            {/* Manual Trigger Editor */}
            <TriggerEditor
              triggers={form.triggers}
              videoUrl={form.vimeo_url}
              episodeId={editId}
              userPermissions={userPermissions}
              onChange={(triggers) => setForm(prev => ({ ...prev, triggers }))}
            />
          </div>
        </section>
      </div>
    </div>
  );
}