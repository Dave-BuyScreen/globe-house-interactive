import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut } from "lucide-react";

/**
 * A transparent "Exit" tab fixed in the bottom-left corner.
 *
 * - In a modal context: pass `onClose` — clicking calls it to close the modal.
 * - In a page context (Layout): omit `onClose` — clicking navigates to /Dashboard.
 * - Hidden on the /Dashboard route.
 */
export default function FloatingDashboardButton({ onClose, className = "" }) {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname === "/Dashboard") return null;

  const handleClick = () => {
    if (onClose) onClose();
    else navigate("/Dashboard");
  };

  return (
    <button
      onClick={handleClick}
      aria-label="Exit to Dashboard"
      className={`fixed bottom-4 left-4 z-[60] flex items-center gap-1.5 px-3 py-2 rounded-full backdrop-blur-sm border border-[#D4AF37]/25 bg-black/30 text-[#D4AF37] text-xs font-medium tracking-wide hover:bg-black/50 hover:border-[#D4AF37]/45 hover:-translate-y-0.5 transition-all shadow-lg ${className}`}
    >
      <LogOut className="w-3.5 h-3.5" />
      <span>Exit</span>
    </button>
  );
}