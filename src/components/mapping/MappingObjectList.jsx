import React from "react";
import { Trash2, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MappingObjectList({ mappings, onDelete, onConfirm }) {
  if (!mappings.length) {
    return (
      <div className="text-center py-8 text-white/30 text-sm">
        No objects tagged yet.<br />
        Enable tagging mode and draw on the video.
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[400px] overflow-y-auto">
      {mappings.map((obj) => (
        <div
          key={obj.id}
          className="bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.06] rounded-xl p-3 transition-colors"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-white text-sm truncate">{obj.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  obj.status === "confirmed"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-amber-500/20 text-amber-400"
                }`}>
                  {obj.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 text-xs text-white/40">
                <span className="bg-violet-500/10 text-violet-300 px-1.5 py-0.5 rounded">
                  {obj.zone_h} / {obj.zone_v}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {obj.start_time}s – {obj.end_time}s
                </span>
              </div>
              {obj.product_name && (
                <p className="text-xs text-white/50 mt-1 truncate">
                  🛍 {obj.product_name} {obj.product_price && `· ${obj.product_price}`}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              {obj.status !== "confirmed" && (
                <button
                  onClick={() => onConfirm(obj.id)}
                  title="Confirm mapping"
                  className="p-1.5 rounded-lg hover:bg-green-500/10 text-white/30 hover:text-green-400 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => onDelete(obj.id)}
                title="Delete"
                className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}