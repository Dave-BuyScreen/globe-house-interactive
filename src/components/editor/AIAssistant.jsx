import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { Sparkles, Loader2, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AIAssistant({ vimeoUrl, currentTitle, currentSummary, currentKeywords, onApplySuggestions }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [copiedField, setCopiedField] = useState(null);

  const generateSuggestions = async () => {
    if (!vimeoUrl && !transcript) return;
    
    setIsGenerating(true);
    try {
      const context = transcript || `Video URL: ${vimeoUrl}`;
      const prompt = `Analyze this video content and provide:
1. A compelling 2-3 sentence summary that captures the essence
2. 5-7 relevant SEO keywords/tags
3. 3 alternative title suggestions optimized for engagement and SEO

Current title: "${currentTitle || 'Untitled'}"

Context: ${context}

Return as JSON with keys: summary, keywords (array), titles (array of 3 strings)`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            keywords: { type: "array", items: { type: "string" } },
            titles: { type: "array", items: { type: "string" } }
          }
        }
      });

      setSuggestions(result);
    } catch (error) {
      console.error("AI generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* AI Generation Section */}
      <div className="bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 rounded-2xl p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-violet-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-white mb-1">AI Content Assistant</h3>
            <p className="text-xs text-white/40">Generate summaries, keywords, and title suggestions</p>
          </div>
        </div>

        <div className="space-y-3">
          <Textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Optional: Paste video transcript for better results..."
            className="bg-white/[0.04] border-white/[0.08] text-white min-h-[80px] text-sm"
          />
          
          <Button
            onClick={generateSuggestions}
            disabled={isGenerating || (!vimeoUrl && !transcript)}
            className="w-full bg-violet-500 hover:bg-violet-600 h-10 gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate AI Suggestions
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Suggestions Display */}
      <AnimatePresence>
        {suggestions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Title Suggestions */}
            <div className="bg-[#13131a] border border-white/[0.06] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-white/90">Title Suggestions</h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onApplySuggestions({ titles: suggestions.titles })}
                  className="text-xs h-7 text-violet-400 hover:text-violet-300"
                >
                  Apply All
                </Button>
              </div>
              <div className="space-y-2">
                {suggestions.titles?.map((title, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-3 bg-white/[0.02] rounded-lg hover:bg-white/[0.04] transition-colors"
                  >
                    <span className="flex-1 text-sm text-white/70">{title}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(title, `title-${idx}`)}
                      className="h-7 w-7 p-0"
                    >
                      {copiedField === `title-${idx}` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-white/40" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-[#13131a] border border-white/[0.06] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-white/90">Episode Summary</h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onApplySuggestions({ summary: suggestions.summary })}
                  className="text-xs h-7 text-violet-400 hover:text-violet-300"
                >
                  Apply
                </Button>
              </div>
              <p className="text-sm text-white/60 leading-relaxed">{suggestions.summary}</p>
            </div>

            {/* Keywords */}
            <div className="bg-[#13131a] border border-white/[0.06] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-white/90">SEO Keywords</h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onApplySuggestions({ keywords: suggestions.keywords })}
                  className="text-xs h-7 text-violet-400 hover:text-violet-300"
                >
                  Apply
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestions.keywords?.map((keyword, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-violet-500/10 text-violet-400 text-xs rounded-full border border-violet-500/20"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}