import React from "react";
import { FileCode2, Wand2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const SYNTAX_HINTS = [
  { tag: "[BuyScreen:Scene]", desc: "Scene metadata block (title, vimeoID, environment)" },
  { tag: "[BuyScreen:Object]", desc: "Product/object block — one per item in scene" },
  { tag: "CommerceTrigger: BuyScreen", desc: "Attach commerce overlay to this object" },
  { tag: "ARCompatible: True/False", desc: "Enable AR viewer for this object" },
  { tag: "Timestamp: 5", desc: "Seconds into video when object first appears" },
];

export default function UBPLInput({ value, onChange, onParse, isParsing }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Editor Panel */}
      <div className="bg-[#13131a] border border-white/[0.06] rounded-2xl overflow-hidden flex flex-col" style={{ minHeight: "420px" }}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-semibold text-white/80">UBPL Prompt</span>
          </div>
          <span className="text-xs text-white/20 font-mono">{value.length} chars</span>
        </div>

        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              onParse();
            }
          }}
          placeholder={`Paste your UBPL prompt here...\n\nStart with:\n[BuyScreen:Scene]\nTitle: My Scene\nVimeoID: 123456789\n\n[BuyScreen:Object]\nName: Product Name\nBrand: Brand Name\nCategory: furniture\nTimestamp: 5\nCommerceTrigger: BuyScreen\nARCompatible: True`}
          className="flex-1 w-full bg-transparent text-white/80 placeholder:text-white/20 font-mono text-sm resize-none outline-none p-5 leading-relaxed"
          style={{ minHeight: "360px" }}
          spellCheck={false}
        />

        <div className="px-5 py-3 border-t border-white/[0.06] flex items-center justify-between">
          <span className="text-xs text-white/20">⌘ + Enter to parse</span>
          <Button
            onClick={onParse}
            disabled={!value.trim() || isParsing}
            size="sm"
            className="bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-500/30 rounded-lg h-7 text-xs gap-1.5"
          >
            {isParsing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
            {isParsing ? "Parsing..." : "Parse"}
          </Button>
        </div>
      </div>

      {/* Syntax Reference */}
      <div className="bg-[#13131a] border border-white/[0.06] rounded-2xl p-5">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">UBPL Syntax Reference</p>
        <div className="space-y-2">
          {SYNTAX_HINTS.map((hint) => (
            <div key={hint.tag} className="flex items-start gap-3">
              <code className="text-xs font-mono text-fuchsia-400 bg-fuchsia-500/10 px-2 py-0.5 rounded shrink-0">{hint.tag}</code>
              <span className="text-xs text-white/40">{hint.desc}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-white/[0.06]">
          <p className="text-xs text-white/25 leading-relaxed">
            Required object fields: <span className="text-white/40">Name, Brand, Category</span><br />
            Required scene fields: <span className="text-white/40">Title</span> · Optional but recommended: <span className="text-white/40">VimeoID</span>
          </p>
        </div>
      </div>
    </div>
  );
}