import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Check, X, Edit, AlertCircle, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function ProductDetectionPanel({ episodeId, triggers, onUpdate }) {
  const [analyzing, setAnalyzing] = useState(false);
  const queryClient = useQueryClient();

  const runDetection = useMutation({
    mutationFn: async () => {
      setAnalyzing(true);
      const response = await base44.functions.invoke('analyzeVideoForProducts', {
        episode_id: episodeId
      });
      return response.data;
    },
    onSuccess: (data) => {
      setAnalyzing(false);
      queryClient.invalidateQueries({ queryKey: ['episode', episodeId] });
    },
    onError: () => {
      setAnalyzing(false);
    }
  });

  const updateTriggerStatus = (index, updates) => {
    const updatedTriggers = [...triggers];
    updatedTriggers[index] = { ...updatedTriggers[index], ...updates };
    onUpdate(updatedTriggers);
  };

  const deleteTrigger = (index) => {
    onUpdate(triggers.filter((_, i) => i !== index));
  };

  const autoDetectedTriggers = triggers.filter(t => 
    t.detection_status && t.detection_status !== "manual"
  );

  const getConfidenceColor = (score) => {
    if (score >= 0.8) return "text-green-400 bg-green-400/10 border-green-400/30";
    if (score >= 0.5) return "text-yellow-400 bg-yellow-400/10 border-yellow-400/30";
    return "text-red-400 bg-red-400/10 border-red-400/30";
  };

  const getConfidenceLabel = (score) => {
    if (score >= 0.8) return "High";
    if (score >= 0.5) return "Medium";
    return "Low";
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-white/70 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400" />
            AI Product Detection
          </h3>
          <p className="text-xs text-white/30 mt-0.5">Auto-detect products in your video</p>
        </div>
        <Button
          size="sm"
          onClick={() => runDetection.mutate()}
          disabled={analyzing}
          className="bg-violet-500 hover:bg-violet-600 text-white"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Scan Video
            </>
          )}
        </Button>
      </div>

      {/* Auto-detected items */}
      {autoDetectedTriggers.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-white/40">
            {autoDetectedTriggers.length} auto-detected product{autoDetectedTriggers.length !== 1 ? 's' : ''}
          </p>
          
          {autoDetectedTriggers.map((trigger, globalIndex) => {
            const triggerIndex = triggers.indexOf(trigger);
            const confidence = trigger.confidence_score || 0;
            
            return (
              <motion.div
                key={triggerIndex}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-white/80 truncate">
                        {trigger.product_name || "Unnamed Product"}
                      </p>
                      <Badge className={`text-xs px-2 py-0.5 ${getConfidenceColor(confidence)}`}>
                        {getConfidenceLabel(confidence)} {Math.round(confidence * 100)}%
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-white/30">
                      @ {Math.floor(trigger.timestamp || 0)}s
                      {trigger.bounding_box && (
                        <span className="ml-2">
                          • Position: {Math.round(trigger.bounding_box.x)}%, {Math.round(trigger.bounding_box.y)}%
                        </span>
                      )}
                    </p>
                    
                    {trigger.product_description && (
                      <p className="text-xs text-white/40 mt-1 line-clamp-2">
                        {trigger.product_description}
                      </p>
                    )}

                    {(!trigger.product_price || !trigger.shop_url) && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-amber-400/80">
                        <AlertCircle className="w-3 h-3" />
                        <span>Missing price/shop URL - needs review</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => updateTriggerStatus(triggerIndex, { 
                        detection_status: "auto_matched" 
                      })}
                      className="h-7 px-2 text-green-400 hover:text-green-300 hover:bg-green-400/10"
                      title="Approve"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        // Scroll to trigger in main editor
                        const el = document.getElementById(`trigger-${triggerIndex}`);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                      className="h-7 px-2 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                      title="Edit"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteTrigger(triggerIndex)}
                      className="h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                      title="Delete"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {autoDetectedTriggers.length === 0 && !analyzing && (
        <div className="py-6 text-center border border-dashed border-white/[0.08] rounded-lg">
          <Sparkles className="w-8 h-8 text-white/10 mx-auto mb-2" />
          <p className="text-xs text-white/20">No auto-detected products yet</p>
          <p className="text-xs text-white/10 mt-1">Click "Scan Video" to analyze</p>
        </div>
      )}
    </div>
  );
}