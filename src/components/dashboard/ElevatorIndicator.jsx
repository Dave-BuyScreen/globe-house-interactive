import React from "react";
import { motion } from "framer-motion";
import { floorName } from "./floors";

export default function ElevatorIndicator({ floors, activeKey, rowLabels, onJump, activeFloor }) {
  return (
    <>
      {/* Desktop / Tablet — brass rail with floor tag buttons */}
      <div className="hidden sm:flex fixed right-3 top-1/2 -translate-y-1/2 z-40 flex-col items-center gap-1.5 py-3 px-2 rounded-2xl"
        style={{
          background: "linear-gradient(180deg, #1d150e 0%, #120c07 100%)",
          border: "1px solid rgba(184,144,69,0.25)",
          boxShadow: "0 8px 28px rgba(0,0,0,0.5), inset 0 1px 0 rgba(230,200,150,0.06)",
        }}
      >
        {floors.map((f) => {
          const active = f.key === activeKey;
          return (
            <button
              key={f.key}
              onClick={() => onJump(f.key)}
              className="group relative flex items-center justify-center"
              title={floorName(f)}
            >
              <span
                className="flex items-center justify-center w-9 h-9 rounded-full text-xs font-semibold transition-all duration-300"
                style={{
                  background: active
                    ? "radial-gradient(circle at 40% 35%, #E9C97A, #D4AF37 50%, #B89045 100%)"
                    : "radial-gradient(circle at 40% 35%, #2a1f15, #1a1410)",
                  color: active ? "#1a1410" : "rgba(237,227,208,0.35)",
                  border: active
                    ? "1px solid rgba(212,175,55,0.8)"
                    : "1px solid rgba(184,144,69,0.2)",
                  boxShadow: active
                    ? "0 0 14px rgba(212,175,55,0.45), inset 0 1px 2px rgba(255,230,180,0.3)"
                    : "inset 0 1px 1px rgba(0,0,0,0.4)",
                }}
              >
                {f.tag}
              </span>
              <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap text-[10px] opacity-0 group-hover:opacity-70 transition-opacity duration-200 text-[#EDE3D0]/60">
                {floorName(f)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mobile — glowing gold floor circle, placed right of the profile icon in the nav */}
      <button
        onClick={() => activeFloor && onJump(activeFloor.key)}
        className="sm:hidden fixed top-[44px] right-10 z-50 flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold"
        style={{
          background: "radial-gradient(circle at 40% 35%, #E9C97A, #D4AF37 50%, #B89045 100%)",
          color: "#1a1410",
          border: "1px solid rgba(212,175,55,0.8)",
          boxShadow: "0 0 10px rgba(212,175,55,0.4), inset 0 1px 2px rgba(255,230,180,0.3)",
        }}
        title={floorName(activeFloor)}
      >
        {activeFloor?.tag || "—"}
      </button>
    </>
  );
}