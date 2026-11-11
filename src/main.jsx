import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { isSupabaseConfigured } from "./lib/supabase";
import "./index.css";

function MissingConfig() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-lg bg-[#1a1410] border border-[#B89045]/30 rounded-2xl p-8 space-y-3">
        <h1 className="font-display text-xl text-[#D4AF37]">Supabase is not configured</h1>
        <p className="text-sm text-[#EDE3D0]/70">
          Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in
          Vercel → Project → Settings → Environment Variables, then redeploy.
        </p>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>{isSupabaseConfigured ? <App /> : <MissingConfig />}</React.StrictMode>
);
