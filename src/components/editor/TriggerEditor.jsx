import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, ChevronDown, ChevronUp, Clock, MessageSquare, ShoppingBag, Box, Zap, Upload, Image as ImageIcon, ScanLine } from "lucide-react";
import { base44 } from "@/api/base44Client";
import BoundingBoxCanvas from "./BoundingBoxCanvas";
import VideoSpatialEditor from "./VideoSpatialEditor";
import TriggerComments from "../collaboration/TriggerComments";
import TriggerApprovalStatus from "../collaboration/TriggerApprovalStatus";


export default function TriggerEditor({ triggers, onChange, videoUrl, episodeId, userPermissions }) {
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(null);
  const [extractingFrame, setExtractingFrame] = useState(null);
  const [showCanvas, setShowCanvas] = useState(null);
  const [frameUrl, setFrameUrl] = useState(null);
  const [spatialEditorIndex, setSpatialEditorIndex] = useState(null);

  const canEditTrigger = (index) => {
    if (!userPermissions) return true; // Owner has full access
    if (!userPermissions.can_edit_triggers) return false;
    if (!userPermissions.specific_trigger_indices || userPermissions.specific_trigger_indices.length === 0) return true;
    return userPermissions.specific_trigger_indices.includes(index);
  };

  const canComment = userPermissions?.can_comment !== false;
  const canApprove = userPermissions?.can_approve || false;

  const addTrigger = () => {
    const newTrigger = {
      trigger_type: "full_portal",
      timestamp: 0,
      prompt_text: "Find the deeper meaning.",
      confessional_video_url: "",
      confessional_embed_code: "",
      confessional_duration: 10,
      product_image_url: "",
      product_name: "",
      product_brand: "",
      product_price: "",
      product_description: "",
      product_quote: "",
      shop_url: "",
      model_url: "",
      model_embed_code: ""
    };
    onChange([...(triggers || []), newTrigger]);
    setExpandedIndex((triggers || []).length);
  };

  const updateTrigger = (index, field, value) => {
    const updated = [...triggers];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeTrigger = (index) => {
    onChange(triggers.filter((_, i) => i !== index));
    setExpandedIndex(null);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleImageUpload = async (e, index) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(index);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      updateTrigger(index, "product_image_url", file_url);
    } finally {
      setUploadingImage(null);
    }
  };

  const handleExtractFrame = async (index) => {
    const trigger = triggers[index];
    if (!videoUrl || !trigger.timestamp) return;
    
    setExtractingFrame(index);
    try {
      const response = await base44.functions.invoke('extractVideoFrame', {
        video_url: videoUrl,
        timestamp: trigger.timestamp
      });
      setFrameUrl(response.data.frame_url);
      setShowCanvas(index);
    } catch (error) {
      console.error('Frame extraction failed:', error);
    } finally {
      setExtractingFrame(null);
    }
  };

  const handleSaveBoundingBox = (index, box) => {
    updateTrigger(index, 'bounding_box', box);
    setShowCanvas(null);
    setFrameUrl(null);
  };

  const handleSaveSpatialBox = (index, { bounding_box, spatial_coordinates }) => {
    const updated = [...triggers];
    updated[index] = { ...updated[index], bounding_box, spatial_coordinates };
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white/70">Triggers</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={addTrigger}
          className="h-8 text-xs border-white/10 bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08]"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Add Trigger
        </Button>
      </div>

      <AnimatePresence>
        {(triggers || []).map((trigger, index) => (
          <motion.div
            key={index}
            id={`trigger-${index}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden"
          >
            {/* Header */}
            <button
              onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">
                    Trigger at {formatTime(trigger.timestamp || 0)}
                  </p>
                  <p className="text-xs text-white/30 truncate max-w-[200px]">
                    {trigger.prompt_text || "No prompt set"}
                  </p>
                </div>
              </div>
              {expandedIndex === index ? (
                <ChevronUp className="w-4 h-4 text-white/30" />
              ) : (
                <ChevronDown className="w-4 h-4 text-white/30" />
              )}
            </button>

            {/* Expanded editor */}
            <AnimatePresence>
              {expandedIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-4 border-t border-white/[0.04] pt-4">
                   {/* Read-only notice */}
                   {!canEditTrigger(index) && (
                     <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                       <p className="text-xs text-amber-300">
                         You have view-only access to this trigger. You can comment and review but cannot edit.
                       </p>
                     </div>
                   )}

                   {/* Trigger Type Toggle */}
                   <div>
                      <Label className="text-xs text-white/40 mb-1.5">Trigger Type</Label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => canEditTrigger(index) && updateTrigger(index, "trigger_type", "full_portal")}
                          disabled={!canEditTrigger(index)}
                          className={`flex-1 flex items-center justify-center gap-2 h-9 rounded-lg text-xs font-medium border transition-all ${
                            (trigger.trigger_type || "full_portal") === "full_portal"
                              ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
                              : "bg-white/[0.03] border-white/[0.06] text-white/30 hover:text-white/50"
                          } ${!canEditTrigger(index) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Full Portal
                        </button>
                        <button
                          onClick={() => canEditTrigger(index) && updateTrigger(index, "trigger_type", "buyscreen_only")}
                          disabled={!canEditTrigger(index)}
                          className={`flex-1 flex items-center justify-center gap-2 h-9 rounded-lg text-xs font-medium border transition-all ${
                            trigger.trigger_type === "buyscreen_only"
                              ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                              : "bg-white/[0.03] border-white/[0.06] text-white/30 hover:text-white/50"
                          } ${!canEditTrigger(index) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          BuyScreen Only
                        </button>
                      </div>
                      <p className="text-white/20 text-xs mt-1">
                        {(trigger.trigger_type || "full_portal") === "full_portal"
                          ? "Shows confessional + buy screen choice"
                          : "Goes directly to product overlay"}
                      </p>
                    </div>

                    {/* Basic */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-white/40 mb-1.5">Timestamp (seconds)</Label>
                        <Input
                          type="number"
                          value={trigger.timestamp || ""}
                          onChange={(e) => canEditTrigger(index) && updateTrigger(index, "timestamp", parseFloat(e.target.value) || 0)}
                          disabled={!canEditTrigger(index)}
                          className="h-9 bg-white/[0.04] border-white/[0.08] text-white text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-white/40 mb-1.5">Duration (seconds)</Label>
                        <Input
                          type="number"
                          value={trigger.confessional_duration || ""}
                          onChange={(e) => updateTrigger(index, "confessional_duration", parseFloat(e.target.value) || 0)}
                          className="h-9 bg-white/[0.04] border-white/[0.08] text-white text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-white/40 mb-1.5 flex items-center gap-1.5">
                        <MessageSquare className="w-3 h-3" /> Prompt Text
                      </Label>
                      <Input
                        value={trigger.prompt_text || ""}
                        onChange={(e) => updateTrigger(index, "prompt_text", e.target.value)}
                        placeholder="Find the deeper meaning."
                        className="h-9 bg-white/[0.04] border-white/[0.08] text-white text-sm"
                      />
                    </div>

                    {/* Confessional - only shown for full_portal */}
                    {(trigger.trigger_type || "full_portal") === "full_portal" && (<div className="pt-2 border-t border-white/[0.04]">
                      <p className="text-xs font-medium text-violet-400 mb-3">Confessional</p>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs text-white/40 mb-1.5">Video URL</Label>
                          <Input
                            value={trigger.confessional_video_url || ""}
                            onChange={(e) => updateTrigger(index, "confessional_video_url", e.target.value)}
                            placeholder="https://vimeo.com/..."
                            className="h-9 bg-white/[0.04] border-white/[0.08] text-white text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-white/40 mb-1.5 flex items-center gap-1.5">
                            <svg viewBox="0 0 24 24" className="w-3 h-3 fill-[#1AB7EA]" xmlns="http://www.w3.org/2000/svg"><path d="M23.977 6.416c-.105 2.338-1.739 5.543-4.894 9.609-3.268 4.247-6.026 6.37-8.29 6.37-1.409 0-2.578-1.294-3.553-3.881L5.322 12.5C4.603 9.913 3.83 8.618 3 8.618c-.179 0-.806.378-1.881 1.132L0 8.25c1.185-1.044 2.351-2.087 3.501-3.132C5.08 3.829 6.266 3.098 7.055 3.02c1.868-.18 3.019 1.1 3.45 3.836.465 2.953.789 4.789.971 5.507.539 2.45 1.131 3.674 1.776 3.674.502 0 1.256-.796 2.265-2.385 1.004-1.589 1.54-2.797 1.612-3.628.144-1.371-.395-2.061-1.614-2.061-.574 0-1.167.121-1.777.391 1.186-3.868 3.434-5.757 6.762-5.637 2.473.06 3.628 1.664 3.477 4.699z"/></svg>
                            Vimeo Embed Code (recommended)
                          </Label>
                          <Textarea
                            value={trigger.confessional_embed_code || ""}
                            onChange={(e) => updateTrigger(index, "confessional_embed_code", e.target.value)}
                            placeholder={'<div style="padding:56.25% 0 0 0;position:relative;"><iframe src="https://player.vimeo.com/video/..." ...></iframe></div>'}
                            className="bg-white/[0.04] border-white/[0.08] text-white text-xs min-h-[80px] font-mono"
                          />
                          <p className="text-white/20 text-xs mt-1">Paste the Vimeo embed code here. This takes priority over the URL above.</p>
                        </div>
                      </div>
                    </div>)}

                    {/* BuyScreen */}
                    <div className="pt-2 border-t border-white/[0.04]">
                      <p className="text-xs font-medium text-amber-400 mb-3 flex items-center gap-1.5">
                        <ShoppingBag className="w-3 h-3" /> BuyScreen
                      </p>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                           <div>
                             <Label className="text-xs text-white/40 mb-1.5">Product Name</Label>
                             <Input
                               value={trigger.product_name || ""}
                               onChange={(e) => updateTrigger(index, "product_name", e.target.value)}
                               className="h-9 bg-white/[0.04] border-white/[0.08] text-white text-sm"
                             />
                           </div>
                           <div>
                             <Label className="text-xs text-white/40 mb-1.5">Brand</Label>
                             <Input
                               value={trigger.product_brand || ""}
                               onChange={(e) => updateTrigger(index, "product_brand", e.target.value)}
                               placeholder="Nike, Gucci..."
                               className="h-9 bg-white/[0.04] border-white/[0.08] text-white text-sm"
                             />
                           </div>
                         </div>
                         <div className="grid grid-cols-2 gap-3">
                           <div>
                             <Label className="text-xs text-white/40 mb-1.5">Price</Label>
                             <Input
                               value={trigger.product_price || ""}
                               onChange={(e) => updateTrigger(index, "product_price", e.target.value)}
                               placeholder="$49.99"
                               className="h-9 bg-white/[0.04] border-white/[0.08] text-white text-sm"
                             />
                           </div>
                         </div>
                         <div>
                           <Label className="text-xs text-white/40 mb-1.5">Description</Label>
                           <Textarea
                             value={trigger.product_description || ""}
                             onChange={(e) => updateTrigger(index, "product_description", e.target.value)}
                             placeholder="Short product description..."
                             className="bg-white/[0.04] border-white/[0.08] text-white text-sm min-h-[60px]"
                           />
                         </div>
                        <div>
                          <Label className="text-xs text-white/40 mb-1.5">Product Image URL</Label>
                          <div className="flex gap-2">
                            <Input
                              value={trigger.product_image_url || ""}
                              onChange={(e) => updateTrigger(index, "product_image_url", e.target.value)}
                              placeholder="Image URL or upload"
                              className="h-9 bg-white/[0.04] border-white/[0.08] text-white text-sm flex-1"
                            />
                            <label className="h-9 px-3 rounded-lg border border-white/[0.08] bg-white/[0.04] flex items-center gap-2 cursor-pointer hover:bg-white/[0.06] transition-colors">
                              {uploadingImage === index ? (
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                              ) : (
                                <Upload className="w-4 h-4 text-white/40" />
                              )}
                              <span className="text-xs text-white/40">Upload</span>
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, index)} />
                            </label>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-white/40 mb-1.5">Character Quote</Label>
                          <Textarea
                            value={trigger.product_quote || ""}
                            onChange={(e) => updateTrigger(index, "product_quote", e.target.value)}
                            placeholder="The armor I wear when..."
                            className="bg-white/[0.04] border-white/[0.08] text-white text-sm min-h-[60px]"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-white/40 mb-1.5">Shop URL</Label>
                          <Input
                            value={trigger.shop_url || ""}
                            onChange={(e) => updateTrigger(index, "shop_url", e.target.value)}
                            className="h-9 bg-white/[0.04] border-white/[0.08] text-white text-sm"
                          />
                        </div>
                        </div>
                        </div>

                        {/* Bounding Box */}
                        <div className="pt-2 border-t border-white/[0.04]">
                        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                          <p className="text-xs font-medium text-purple-400 flex items-center gap-1.5">
                            <Zap className="w-3 h-3" /> Bounding Box → Scene DNA Spatial
                          </p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => videoUrl && setSpatialEditorIndex(index)}
                              disabled={!videoUrl}
                              className="h-7 text-xs border-violet-500/40 bg-violet-500/15 text-violet-300 hover:bg-violet-500/25 gap-1.5"
                              title={!videoUrl ? "Add a Vimeo URL first" : "Open live video spatial editor"}
                            >
                              <ScanLine className="w-3 h-3" />
                              Live Draw
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleExtractFrame(index)}
                              disabled={!videoUrl || !trigger.timestamp || extractingFrame === index}
                              className="h-7 text-xs border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20"
                            >
                              {extractingFrame === index ? (
                                <div className="w-3 h-3 border-2 border-purple-400/20 border-t-purple-400 rounded-full animate-spin mr-1.5" />
                              ) : (
                                <ImageIcon className="w-3 h-3 mr-1.5" />
                              )}
                              Extracted Frame
                            </Button>
                          </div>
                        </div>
                        {trigger.spatial_coordinates && (
                          <div className="mb-3 p-2 bg-emerald-500/[0.05] border border-emerald-500/20 rounded-lg">
                            <p className="text-[10px] text-emerald-400 font-mono">
                              spatial_coordinates · x:{trigger.spatial_coordinates.x?.toFixed(3)} y:{trigger.spatial_coordinates.y?.toFixed(3)} z:{trigger.spatial_coordinates.z?.toFixed(3)} · {trigger.spatial_coordinates.width?.toFixed(3)}×{trigger.spatial_coordinates.height?.toFixed(3)}
                            </p>
                          </div>
                        )}

                        {showCanvas === index && frameUrl && (
                          <div className="mb-4">
                            <BoundingBoxCanvas
                              imageUrl={frameUrl}
                              existingBox={trigger.bounding_box}
                              onSave={(box) => handleSaveBoundingBox(index, box)}
                              onCancel={() => {
                                setShowCanvas(null);
                                setFrameUrl(null);
                              }}
                            />
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-white/40 mb-1.5">X Position (%)</Label>
                          <Input
                            type="number"
                            value={trigger.bounding_box?.x ?? ""}
                            onChange={(e) => updateTrigger(index, 'bounding_box', { ...(trigger.bounding_box || {}), x: parseFloat(e.target.value) || 0 })}
                            placeholder="0-100"
                            className="h-9 bg-white/[0.04] border-white/[0.08] text-white text-sm"
                            min="0" 
                            max="100"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-white/40 mb-1.5">Y Position (%)</Label>
                          <Input
                            type="number"
                            value={trigger.bounding_box?.y ?? ""}
                            onChange={(e) => updateTrigger(index, 'bounding_box', { ...(trigger.bounding_box || {}), y: parseFloat(e.target.value) || 0 })}
                            placeholder="0-100"
                            className="h-9 bg-white/[0.04] border-white/[0.08] text-white text-sm"
                            min="0" 
                            max="100"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-white/40 mb-1.5">Width (%)</Label>
                          <Input
                            type="number"
                            value={trigger.bounding_box?.width ?? ""}
                            onChange={(e) => updateTrigger(index, 'bounding_box', { ...(trigger.bounding_box || {}), width: parseFloat(e.target.value) || 0 })}
                            placeholder="0-100"
                            className="h-9 bg-white/[0.04] border-white/[0.08] text-white text-sm"
                            min="0" 
                            max="100"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-white/40 mb-1.5">Height (%)</Label>
                          <Input
                            type="number"
                            value={trigger.bounding_box?.height ?? ""}
                            onChange={(e) => updateTrigger(index, 'bounding_box', { ...(trigger.bounding_box || {}), height: parseFloat(e.target.value) || 0 })}
                            placeholder="0-100"
                            className="h-9 bg-white/[0.04] border-white/[0.08] text-white text-sm"
                            min="0" 
                            max="100"
                          />
                        </div>
                        </div>
                        <p className="text-white/20 text-xs mt-2">Define the exact position and size of the product highlight box on screen</p>
                        </div>

                    {/* AR / 3D */}
                    <div className="pt-2 border-t border-white/[0.04]">
                      <p className="text-xs font-medium text-emerald-400 mb-3 flex items-center gap-1.5">
                        <Box className="w-3 h-3" /> 3D / AR Model
                      </p>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs text-white/40 mb-1.5">Model URL (.glb)</Label>
                          <Input
                            value={trigger.model_url || ""}
                            onChange={(e) => updateTrigger(index, "model_url", e.target.value)}
                            placeholder="https://...model.glb"
                            className="h-9 bg-white/[0.04] border-white/[0.08] text-white text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-white/40 mb-1.5">Or Embed Code (iframe/script)</Label>
                          <Textarea
                            value={trigger.model_embed_code || ""}
                            onChange={(e) => updateTrigger(index, "model_embed_code", e.target.value)}
                            placeholder="<iframe src=... or <script>..."
                            className="bg-white/[0.04] border-white/[0.08] text-white text-sm min-h-[80px] font-mono text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Collaboration - Comments & Approvals */}
                    {episodeId && (
                      <div className="pt-4 border-t border-white/[0.04] space-y-4">
                        {canComment && (
                          <TriggerComments episodeId={episodeId} triggerIndex={index} />
                        )}
                        {(canApprove || canComment) && (
                          <TriggerApprovalStatus
                            episodeId={episodeId}
                            triggerIndex={index}
                            canApprove={canApprove}
                          />
                        )}
                      </div>
                    )}

                    {/* Delete */}
                    {canEditTrigger(index) && (
                      <div className="pt-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeTrigger(index)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-400/10 text-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                          Remove Trigger
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </AnimatePresence>

      {(!triggers || triggers.length === 0) && (
        <div className="py-8 text-center">
          <p className="text-white/20 text-sm">No triggers yet</p>
          <p className="text-white/10 text-xs mt-1">Add timestamp-based triggers for confessionals & commerce</p>
        </div>
      )}

      {/* VideoSpatialEditor Modal */}
      <AnimatePresence>
        {spatialEditorIndex !== null && (
          <VideoSpatialEditor
            key={spatialEditorIndex}
            vimeoUrl={videoUrl}
            trigger={triggers?.[spatialEditorIndex]}
            triggerIndex={spatialEditorIndex}
            onSave={(coords) => handleSaveSpatialBox(spatialEditorIndex, coords)}
            onClose={() => setSpatialEditorIndex(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}