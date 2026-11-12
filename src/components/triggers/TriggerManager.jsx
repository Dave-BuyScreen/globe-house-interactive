import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Edit2, Save, X, Clock, Package, Video, Box } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function TriggerManager({ episodeId, isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [selectedTrigger, setSelectedTrigger] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);

  const { data: episode, isLoading } = useQuery({
    queryKey: ["episode", episodeId],
    queryFn: () => base44.entities.Episode.filter({ id: episodeId }),
    enabled: !!episodeId && isOpen,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => base44.entities.Product.list(),
    enabled: isOpen,
  });

  const currentEpisode = episode?.[0];
  const triggers = currentEpisode?.triggers || [];

  const [formData, setFormData] = useState({
    timestamp: 0,
    prompt_text: "",
    confessional_video_url: "",
    confessional_duration: 10,
    product_image_url: "",
    product_name: "",
    product_price: "",
    product_quote: "",
    shop_url: "",
    model_url: ""
  });

  const updateMutation = useMutation({
    mutationFn: (updatedTriggers) => 
      base44.entities.Episode.update(episodeId, { triggers: updatedTriggers }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["episodes"] });
      queryClient.invalidateQueries({ queryKey: ["episode", episodeId] });
      resetForm();
    }
  });

  const resetForm = () => {
    setFormData({
      timestamp: 0,
      prompt_text: "",
      confessional_video_url: "",
      confessional_duration: 10,
      product_image_url: "",
      product_name: "",
      product_price: "",
      product_quote: "",
      shop_url: "",
      model_url: ""
    });
    setEditingIndex(null);
    setSelectedTrigger(null);
  };

  const handleAddTrigger = () => {
    const newTriggers = [...triggers, formData];
    updateMutation.mutate(newTriggers);
  };

  const handleUpdateTrigger = () => {
    const newTriggers = [...triggers];
    newTriggers[editingIndex] = formData;
    updateMutation.mutate(newTriggers);
  };

  const handleDeleteTrigger = (index) => {
    const newTriggers = triggers.filter((_, i) => i !== index);
    updateMutation.mutate(newTriggers);
  };

  const handleEditTrigger = (trigger, index) => {
    setFormData(trigger);
    setEditingIndex(index);
    setSelectedTrigger(index);
  };

  const handleProductSelect = (productId) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setFormData(prev => ({
        ...prev,
        product_image_url: product.image_url || prev.product_image_url,
        product_name: product.name,
        product_price: product.price,
        product_quote: product.character_quote || prev.product_quote,
        shop_url: product.shop_url || prev.shop_url,
        model_url: product.model_url || prev.model_url
      }));
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] bg-[#0a0a0f] border-white/[0.08] text-white p-0">
        <div className="flex h-full">
          {/* Left Panel - Trigger List & Timeline */}
          <div className="w-1/3 border-r border-white/[0.06] flex flex-col">
            <DialogHeader className="p-6 border-b border-white/[0.06]">
              <DialogTitle className="text-xl">
                {currentEpisode?.title || "Manage Triggers"}
              </DialogTitle>
              <p className="text-xs text-white/40 mt-1">
                {triggers.length} trigger{triggers.length !== 1 ? 's' : ''} configured
              </p>
            </DialogHeader>

            <ScrollArea className="flex-1 p-4">
              {/* Timeline Visualization */}
              <div className="mb-6">
                <h3 className="text-xs font-medium text-white/60 mb-3">Timeline</h3>
                <div className="relative h-16 bg-white/[0.04] rounded-lg border border-white/[0.06] overflow-hidden">
                  {triggers.map((trigger, index) => {
                    const position = (trigger.timestamp / 180) * 100; // Assuming 3min max
                    return (
                      <button
                        key={index}
                        onClick={() => handleEditTrigger(trigger, index)}
                        className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full transition-all ${
                          selectedTrigger === index 
                            ? 'bg-violet-400 scale-150 ring-2 ring-violet-400/50' 
                            : 'bg-blue-400 hover:scale-125'
                        }`}
                        style={{ left: `${Math.min(position, 95)}%` }}
                        title={`${formatTime(trigger.timestamp)} - ${trigger.prompt_text}`}
                      />
                    );
                  })}
                  <div className="absolute bottom-1 left-2 text-[9px] text-white/30">0:00</div>
                  <div className="absolute bottom-1 right-2 text-[9px] text-white/30">3:00</div>
                </div>
              </div>

              {/* Trigger List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-medium text-white/60">All Triggers</h3>
                  <Button
                    size="sm"
                    onClick={resetForm}
                    className="h-7 px-3 bg-violet-500 hover:bg-violet-600 text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    New
                  </Button>
                </div>

                {triggers.length === 0 ? (
                  <div className="text-center py-8 text-white/30 text-sm">
                    No triggers yet. Create your first one!
                  </div>
                ) : (
                  triggers.map((trigger, index) => (
                    <div
                      key={index}
                      onClick={() => handleEditTrigger(trigger, index)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedTrigger === index
                          ? 'bg-violet-500/10 border-violet-500/30'
                          : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-3 h-3 text-blue-400 flex-shrink-0" />
                            <span className="text-xs font-medium text-white/80">
                              {formatTime(trigger.timestamp)}
                            </span>
                            {trigger.confessional_video_url && (
                              <Video className="w-3 h-3 text-fuchsia-400" />
                            )}
                            {trigger.product_name && (
                              <Package className="w-3 h-3 text-amber-400" />
                            )}
                            {trigger.model_url && (
                              <Box className="w-3 h-3 text-violet-400" />
                            )}
                          </div>
                          <p className="text-xs text-white/50 line-clamp-2">
                            {trigger.prompt_text || "No prompt"}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTrigger(index);
                          }}
                          className="text-white/30 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Right Panel - Editor Form */}
          <div className="flex-1 flex flex-col">
            <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
              <h3 className="font-semibold">
                {editingIndex !== null ? 'Edit Trigger' : 'New Trigger'}
              </h3>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <ScrollArea className="flex-1 p-6">
              <div className="space-y-6 max-w-2xl">
                {/* Timestamp */}
                <div>
                  <Label className="text-xs text-white/60 mb-2">Timestamp (seconds)</Label>
                  <Input
                    type="number"
                    value={formData.timestamp}
                    onChange={(e) => setFormData({ ...formData, timestamp: parseFloat(e.target.value) })}
                    className="bg-white/[0.04] border-white/[0.08] text-white"
                    placeholder="30"
                  />
                  <p className="text-[10px] text-white/30 mt-1">
                    Will appear at {formatTime(formData.timestamp)}
                  </p>
                </div>

                {/* Prompt */}
                <div>
                  <Label className="text-xs text-white/60 mb-2">Prompt Text</Label>
                  <Input
                    value={formData.prompt_text}
                    onChange={(e) => setFormData({ ...formData, prompt_text: e.target.value })}
                    className="bg-white/[0.04] border-white/[0.08] text-white"
                    placeholder="Find the deeper meaning..."
                  />
                </div>

                {/* Confessional Video */}
                <div className="space-y-3 p-4 bg-fuchsia-500/5 border border-fuchsia-500/20 rounded-lg">
                  <h4 className="text-sm font-medium text-fuchsia-300 flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    Confessional Video
                  </h4>
                  <div>
                    <Label className="text-xs text-white/60 mb-2">Video URL</Label>
                    <Input
                      value={formData.confessional_video_url}
                      onChange={(e) => setFormData({ ...formData, confessional_video_url: e.target.value })}
                      className="bg-white/[0.04] border-white/[0.08] text-white"
                      placeholder="https://vimeo.com/..."
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-white/60 mb-2">Duration (seconds)</Label>
                    <Input
                      type="number"
                      value={formData.confessional_duration}
                      onChange={(e) => setFormData({ ...formData, confessional_duration: parseInt(e.target.value) })}
                      className="bg-white/[0.04] border-white/[0.08] text-white"
                    />
                  </div>
                </div>

                {/* Product Selection */}
                <div className="space-y-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                  <h4 className="text-sm font-medium text-amber-300 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Product / BuyScreen
                  </h4>
                  
                  {products.length > 0 && (
                    <div>
                      <Label className="text-xs text-white/60 mb-2">Select from Wardrobe</Label>
                      <Select onValueChange={handleProductSelect}>
                        <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-white">
                          <SelectValue placeholder="Choose a product..." />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map(product => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} - {product.price}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label className="text-xs text-white/60 mb-2">Product Name</Label>
                    <Input
                      value={formData.product_name}
                      onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                      className="bg-white/[0.04] border-white/[0.08] text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-white/60 mb-2">Price</Label>
                      <Input
                        value={formData.product_price}
                        onChange={(e) => setFormData({ ...formData, product_price: e.target.value })}
                        className="bg-white/[0.04] border-white/[0.08] text-white"
                        placeholder="$49.99"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-white/60 mb-2">Image URL</Label>
                      <Input
                        value={formData.product_image_url}
                        onChange={(e) => setFormData({ ...formData, product_image_url: e.target.value })}
                        className="bg-white/[0.04] border-white/[0.08] text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-white/60 mb-2">Character Quote</Label>
                    <Textarea
                      value={formData.product_quote}
                      onChange={(e) => setFormData({ ...formData, product_quote: e.target.value })}
                      className="bg-white/[0.04] border-white/[0.08] text-white"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-white/60 mb-2">Shop URL</Label>
                    <Input
                      value={formData.shop_url}
                      onChange={(e) => setFormData({ ...formData, shop_url: e.target.value })}
                      className="bg-white/[0.04] border-white/[0.08] text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-white/60 mb-2">3D Model URL (.glb)</Label>
                    <Input
                      value={formData.model_url}
                      onChange={(e) => setFormData({ ...formData, model_url: e.target.value })}
                      className="bg-white/[0.04] border-white/[0.08] text-white"
                    />
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* Actions */}
            <div className="p-6 border-t border-white/[0.06] flex gap-3">
              <Button
                onClick={resetForm}
                variant="outline"
                className="border-white/[0.08] hover:bg-white/[0.04]"
              >
                Cancel
              </Button>
              <Button
                onClick={editingIndex !== null ? handleUpdateTrigger : handleAddTrigger}
                disabled={updateMutation.isPending || !formData.timestamp}
                className="bg-violet-500 hover:bg-violet-600 flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingIndex !== null ? 'Update Trigger' : 'Add Trigger'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}