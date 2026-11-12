import React, { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Wand2, Loader2, CheckCircle2, AlertCircle, Copy, Download, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "../utils";
import UBPLInput from "../components/ubpl/UBPLInput";
import SceneDNAPreview from "../components/ubpl/SceneDNAPreview";
import ValidationPanel from "../components/ubpl/ValidationPanel";
import { base44 } from "@/api/base44Client";

const STARTER_TEMPLATE = `BuyScreen Master Prompt
Generate video scenes in 4K (minimum 1080p), 30fps, using H.264/MP4 with high bitrate. Ensure scenes are visually clear, well-lit, and include embedded timecodes for precise object tracking.

[BuyScreen:Scene]
Title: My GlobeHouse Scene
VimeoID: 
Environment: studio
Style: minimalist white room
Lighting: soft studio lighting

[BuyScreen:Object]
Name: 
Brand: 
Category: furniture
Color: 
Placement: Center_Back
Visibility: Full
CommerceTrigger: BuyScreen
ARCompatible: True
TrackPriority: High
Timestamp: 5

[BuyScreen:Object]
Name: 
Brand: 
Category: apparel
Color: 
Placement: Worn_By_Subject
Visibility: High
CommerceTrigger: BuyScreen
ARCompatible: False
TrackPriority: Medium
Timestamp: 8`;

export default function UBPLEditor() {
  const [promptText, setPromptText] = useState("");
  const [sceneDNA, setSceneDNA] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [validationWarnings, setValidationWarnings] = useState([]);
  const [isParsing, setIsParsing] = useState(false);
  const [parseMode, setParseMode] = useState("ai"); // "ai" | "local"

  const parseWithAI = useCallback(async (text) => {
    setIsParsing(true);
    setSceneDNA(null);
    setValidationErrors([]);
    setValidationWarnings([]);
    try {
      const result = await base44.functions.invoke("parseUBPL", { prompt: text });
      const data = result.data;
      if (data.scene_dna) {
        setSceneDNA(data.scene_dna);
        setValidationErrors(data.errors || []);
        setValidationWarnings(data.warnings || []);
      } else {
        setValidationErrors(["Failed to parse UBPL. Check your prompt format."]);
      }
    } catch (err) {
      setValidationErrors([err.message || "Parse error"]);
    }
    setIsParsing(false);
  }, []);

  const parseLocally = useCallback((text) => {
    setIsParsing(true);
    setSceneDNA(null);
    setValidationErrors([]);
    setValidationWarnings([]);

    setTimeout(() => {
      const errors = [];
      const warnings = [];

      // Extract scene block
      const sceneMatch = text.match(/\[BuyScreen:Scene\]([\s\S]*?)(?=\[BuyScreen:|$)/);
      const sceneBlock = sceneMatch ? sceneMatch[1] : "";

      const getField = (block, key) => {
        const m = block.match(new RegExp(`${key}:\\s*(.+)`));
        return m ? m[1].trim() : "";
      };

      const sceneTitle = getField(sceneBlock, "Title");
      const vimeoId = getField(sceneBlock, "VimeoID");
      const environment = getField(sceneBlock, "Environment") || "studio";
      const style = getField(sceneBlock, "Style") || "";
      const lighting = getField(sceneBlock, "Lighting") || "";

      if (!sceneTitle) errors.push("Scene Title is required in [BuyScreen:Scene]");
      if (!vimeoId) warnings.push("VimeoID is missing — Scene DNA cannot be linked to a video until provided");

      // Extract object blocks
      const objectBlocks = [...text.matchAll(/\[BuyScreen:Object\]([\s\S]*?)(?=\[BuyScreen:|$)/g)];
      const objects = [];
      const seenIds = new Set();

      objectBlocks.forEach((match, idx) => {
        const block = match[1];
        const name = getField(block, "Name");
        const brand = getField(block, "Brand");
        const category = getField(block, "Category");
        const color = getField(block, "Color");
        const placement = getField(block, "Placement") || "unknown";
        const arCompatible = getField(block, "ARCompatible").toLowerCase() === "true";
        const trackPriority = getField(block, "TrackPriority") || "medium";
        const timestamp = parseFloat(getField(block, "Timestamp")) || 0;
        const visibility = getField(block, "Visibility") || "Full";

        if (!name) errors.push(`Object ${idx + 1}: Name is required`);
        if (!brand) errors.push(`Object ${idx + 1}: Brand is required`);
        if (!category) errors.push(`Object ${idx + 1}: Category is required`);

        const slug = (name || `object`).toLowerCase().replace(/\s+/g, "_");
        const categorySlug = (category || "item").toLowerCase().replace(/\s+/g, "_");
        let objectId = `${categorySlug}_${String(idx + 1).padStart(3, "0")}`;
        if (seenIds.has(objectId)) objectId += `_${idx}`;
        seenIds.add(objectId);

        objects.push({
          object_id: objectId,
          name: name || "(unnamed)",
          brand: brand || "(unknown brand)",
          category: category || "other",
          color: color || "",
          spatial_coordinates: placement.includes("Worn") ? { attached_to: "subject_head" } : { x: 0.5, y: 0.65, z: 0.2 },
          bounding_box: { width: 0.35, height: 0.25 },
          visibility_frames: {
            start: formatTime(timestamp),
            end: formatTime(timestamp + 15)
          },
          interaction_type: "tap_to_buy",
          track_priority: trackPriority.toLowerCase(),
          commerce: {
            trigger: "BuyScreen_overlay",
            ar_supported: arCompatible,
            affiliate_enabled: true
          }
        });
      });

      if (objects.length === 0) errors.push("At least one [BuyScreen:Object] block is required");

      const sceneId = `scene_${(sceneTitle || "untitled").toLowerCase().replace(/\s+/g, "_")}_${Date.now().toString(36)}`;

      const dna = {
        scene_id: sceneId,
        scene_title: sceneTitle || "Untitled Scene",
        vimeo_id: vimeoId || null,
        generated_at: new Date().toISOString(),
        video_format: { resolution: "4K", fps: 30, codec: "H264", container: "MP4" },
        environment: { type: environment, style, lighting, clutter_level: "none" },
        objects
      };

      setSceneDNA(dna);
      setValidationErrors(errors);
      setValidationWarnings(warnings);
      setIsParsing(false);
    }, 300);
  }, []);

  const handleParse = () => {
    if (!promptText.trim()) return;
    if (parseMode === "ai") {
      parseWithAI(promptText);
    } else {
      parseLocally(promptText);
    }
  };

  const handleCopyDNA = () => {
    if (sceneDNA) {
      navigator.clipboard.writeText(JSON.stringify(sceneDNA, null, 2));
    }
  };

  const handleDownloadDNA = () => {
    if (!sceneDNA) return;
    const blob = new Blob([JSON.stringify(sceneDNA, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sceneDNA.scene_id || "scene_dna"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isValid = validationErrors.length === 0 && sceneDNA !== null;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <div className="border-b border-white/[0.06] px-4 sm:px-8 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl("Dashboard")}>
              <Button variant="ghost" size="icon" className="text-white/40 hover:text-white hover:bg-white/[0.06] rounded-xl">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-fuchsia-500 inline-flex items-center justify-center text-xs font-black">U</span>
                UBPL Editor
              </h1>
              <p className="text-xs text-white/30 mt-0.5">Universal BuyScreen Prompt Language → Scene DNA</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Parse Mode Toggle */}
            <div className="flex bg-white/[0.04] border border-white/[0.08] rounded-xl p-1 gap-1">
              <button
                onClick={() => setParseMode("local")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${parseMode === "local" ? "bg-violet-500/20 text-violet-300" : "text-white/40 hover:text-white/60"}`}
              >
                Local
              </button>
              <button
                onClick={() => setParseMode("ai")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${parseMode === "ai" ? "bg-violet-500/20 text-violet-300" : "text-white/40 hover:text-white/60"}`}
              >
                AI-Powered
              </button>
            </div>

            <Button
              onClick={() => { setPromptText(STARTER_TEMPLATE); setSceneDNA(null); setValidationErrors([]); setValidationWarnings([]); }}
              variant="ghost"
              className="text-white/40 hover:text-white/70 border border-white/[0.08] rounded-xl h-9 text-xs gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Template
            </Button>

            <Button
              onClick={handleParse}
              disabled={!promptText.trim() || isParsing}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 rounded-xl h-9 gap-2 text-sm font-semibold"
            >
              {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              {isParsing ? "Parsing..." : "Parse to Scene DNA"}
            </Button>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      {(sceneDNA || validationErrors.length > 0) && (
        <div className={`border-b px-4 sm:px-8 py-2.5 flex items-center justify-between ${isValid ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"}`}>
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isValid ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400" />
              )}
              <span className={`text-xs font-medium ${isValid ? "text-emerald-400" : "text-red-400"}`}>
                {isValid
                  ? `Scene DNA valid — ${sceneDNA?.objects?.length || 0} object(s) registered`
                  : `${validationErrors.length} error(s) found`}
                {validationWarnings.length > 0 && (
                  <span className="text-amber-400 ml-2">· {validationWarnings.length} warning(s)</span>
                )}
              </span>
            </div>
            {isValid && (
              <div className="flex gap-2">
                <Button onClick={handleCopyDNA} variant="ghost" size="sm" className="text-white/40 hover:text-white h-7 text-xs gap-1.5">
                  <Copy className="w-3 h-3" /> Copy JSON
                </Button>
                <Button onClick={handleDownloadDNA} variant="ghost" size="sm" className="text-white/40 hover:text-white h-7 text-xs gap-1.5">
                  <Download className="w-3 h-3" /> Download
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Split Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[calc(100vh-200px)]">
          {/* Left: UBPL Input */}
          <UBPLInput
            value={promptText}
            onChange={setPromptText}
            onParse={handleParse}
            isParsing={isParsing}
          />

          {/* Right: Preview + Validation */}
          <div className="flex flex-col gap-4">
            <ValidationPanel errors={validationErrors} warnings={validationWarnings} />
            <SceneDNAPreview sceneDNA={sceneDNA} isParsing={isParsing} />
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `00:${m}:${s}`;
}