import React from "react";
import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function ValidationPanel({ errors, warnings }) {
  if (errors.length === 0 && warnings.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="bg-[#13131a] border border-white/[0.06] rounded-2xl overflow-hidden"
      >
        {errors.length > 0 && (
          <div className="p-4 border-b border-red-500/10">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">
                {errors.length} Registry Error{errors.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="space-y-1.5">
              {errors.map((err, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-red-500/60 text-xs mt-0.5 shrink-0">✗</span>
                  <p className="text-xs text-red-300/80">{err}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {warnings.length > 0 && (
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                {warnings.length} Warning{warnings.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="space-y-1.5">
              {warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-amber-500/60 text-xs mt-0.5 shrink-0">⚠</span>
                  <p className="text-xs text-amber-300/80">{w}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {errors.length === 0 && warnings.length === 0 && (
          <div className="p-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-emerald-400">All registry requirements satisfied</span>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}