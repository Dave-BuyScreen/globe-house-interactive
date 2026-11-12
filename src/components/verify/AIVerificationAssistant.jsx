import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Upload, CheckCircle, AlertTriangle, XCircle, Sparkles, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AIVerificationAssistant({ existingRecords = [] }) {
  const [file, setFile] = useState(null);
  const [stage, setStage] = useState("idle"); // idle | uploading | analyzing | done | error
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setStage("uploading");
    setResult(null);

    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    setStage("analyzing");

    // Build a quick lookup of existing records for discrepancy checking
    const existingSummary = existingRecords.slice(0, 50).map(r =>
      `Serial: ${r.serial_number}, Name: ${r.founder_name}, Tier: ${r.tier}, Status: ${r.status}`
    ).join("\n");

    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an official document verification AI for GlobeHouse Founders Registry.

Analyze the uploaded document and extract all relevant founder certificate information.

Then cross-reference against these existing registry records:
${existingSummary || "(No existing records provided)"}

Return a structured JSON response with:
1. extracted_fields: { founder_name, serial_number, tier, issue_date, ar_bonus_percentage, founders_royalty, status } — values extracted from the document (null if not found)
2. discrepancies: array of { field, document_value, registry_value, severity } — compare extracted fields against any matching existing record (severity: "low"|"medium"|"high"). Empty array if no match or no issues.
3. confidence_score: number 0-100 representing overall confidence in the document's authenticity and completeness
4. confidence_breakdown: { document_clarity, data_completeness, registry_match } — each 0-100
5. flags: array of strings describing any concerns or anomalies
6. recommendation: "approve" | "review" | "reject" with a brief reason string

Be thorough and precise.`,
      file_urls: [file_url],
      response_json_schema: {
        type: "object",
        properties: {
          extracted_fields: { type: "object" },
          discrepancies: { type: "array", items: { type: "object" } },
          confidence_score: { type: "number" },
          confidence_breakdown: { type: "object" },
          flags: { type: "array", items: { type: "string" } },
          recommendation: { type: "object", properties: { verdict: { type: "string" }, reason: { type: "string" } } }
        }
      }
    });

    setResult(analysis);
    setStage("done");
  };

  const verdictConfig = {
    approve: { color: "text-emerald-400", border: "border-emerald-500/40", bg: "bg-emerald-500/10", icon: CheckCircle },
    review: { color: "text-yellow-400", border: "border-yellow-500/40", bg: "bg-yellow-500/10", icon: AlertTriangle },
    reject: { color: "text-red-400", border: "border-red-500/40", bg: "bg-red-500/10", icon: XCircle },
  };

  const severityColor = { low: "text-yellow-300", medium: "text-orange-400", high: "text-red-400" };

  const vc = result?.recommendation?.verdict ? verdictConfig[result.recommendation.verdict] : null;

  return (
    <div className="bg-[#0f0f0f] border border-[#c9a84c22] rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#c9a84c15] border border-[#c9a84c33] flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-[#c9a84c]" />
        </div>
        <div>
          <h2 className="text-white font-semibold text-sm">AI Verification Assistant</h2>
          <p className="text-white/30 text-xs">Scan documents · Flag discrepancies · Score confidence</p>
        </div>
      </div>

      {/* Upload */}
      <div className="border-2 border-dashed border-[#c9a84c22] rounded-xl p-6 text-center hover:border-[#c9a84c44] transition-colors">
        <label className="cursor-pointer flex flex-col items-center gap-2">
          <FileText className="w-8 h-8 text-[#c9a84c66]" />
          <span className="text-white/50 text-sm">{file ? file.name : "Upload document (PDF, image, etc.)"}</span>
          <span className="text-white/20 text-xs">Click to select file</span>
          <input type="file" className="hidden" accept="image/*,.pdf,.docx,.xlsx,.csv" onChange={handleFileChange} />
        </label>
      </div>

      <Button
        onClick={handleAnalyze}
        disabled={!file || stage === "uploading" || stage === "analyzing"}
        className="w-full bg-[#c9a84c] hover:bg-[#b8943e] text-black font-semibold"
      >
        {stage === "uploading" && <><Loader2 className="w-4 h-4 animate-spin mr-2" />Uploading…</>}
        {stage === "analyzing" && <><Loader2 className="w-4 h-4 animate-spin mr-2" />Analyzing with AI…</>}
        {(stage === "idle" || stage === "done") && <><Sparkles className="w-4 h-4 mr-2" />Analyze Document</>}
      </Button>

      {/* Results */}
      {stage === "done" && result && (
        <div className="space-y-4">
          {/* Verdict */}
          {vc && (
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${vc.border} ${vc.bg}`}>
              <vc.icon className={`w-5 h-5 ${vc.color} flex-shrink-0`} />
              <div>
                <p className={`text-sm font-semibold uppercase tracking-wider ${vc.color}`}>
                  {result.recommendation.verdict}
                </p>
                <p className="text-white/50 text-xs mt-0.5">{result.recommendation.reason}</p>
              </div>
            </div>
          )}

          {/* Confidence Score */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-white/40 text-xs uppercase tracking-widest">Confidence Score</p>
              <p className="text-[#c9a84c] font-bold text-lg">{result.confidence_score ?? "—"}%</p>
            </div>
            <div className="w-full h-2 bg-white/[0.05] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${result.confidence_score ?? 0}%`,
                  background: result.confidence_score >= 75 ? "#22c55e" : result.confidence_score >= 50 ? "#f59e0b" : "#ef4444"
                }}
              />
            </div>
            {result.confidence_breakdown && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {Object.entries(result.confidence_breakdown).map(([k, v]) => (
                  <div key={k} className="text-center">
                    <p className="text-white/60 text-sm font-semibold">{v}%</p>
                    <p className="text-white/20 text-xs capitalize">{k.replace(/_/g, " ")}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Extracted Fields */}
          {result.extracted_fields && (
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-4">
              <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Extracted Fields</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(result.extracted_fields).map(([k, v]) => (
                  <div key={k}>
                    <p className="text-white/25 text-xs capitalize">{k.replace(/_/g, " ")}</p>
                    <p className="text-white/70 text-sm font-mono truncate">{v ?? <span className="text-white/20">—</span>}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Discrepancies */}
          {result.discrepancies?.length > 0 && (
            <div className="bg-white/[0.03] border border-orange-500/20 rounded-xl px-4 py-4">
              <p className="text-orange-400 text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5" /> Discrepancies Found
              </p>
              <div className="space-y-2">
                {result.discrepancies.map((d, i) => (
                  <div key={i} className="flex flex-col text-xs border-b border-white/[0.05] pb-2 last:border-0 last:pb-0">
                    <div className="flex justify-between items-center">
                      <span className="text-white/60 capitalize">{String(d.field).replace(/_/g, " ")}</span>
                      <span className={`uppercase font-semibold text-[10px] ${severityColor[d.severity] || "text-white/40"}`}>
                        {d.severity}
                      </span>
                    </div>
                    <div className="flex gap-4 mt-1">
                      <span className="text-white/30">Doc: <span className="text-white/60">{String(d.document_value)}</span></span>
                      <span className="text-white/30">Registry: <span className="text-orange-300">{String(d.registry_value)}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Flags */}
          {result.flags?.length > 0 && (
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-4">
              <p className="text-white/40 text-xs uppercase tracking-widest mb-3">AI Flags</p>
              <ul className="space-y-1">
                {result.flags.map((flag, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-white/50">
                    <span className="text-[#c9a84c] mt-0.5">·</span> {flag}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}