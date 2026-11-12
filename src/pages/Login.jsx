import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Mail, Lock } from "lucide-react";

const GOLD = "#D4AF37";

// Only allow returning to pages on this site after login
const safeReturnUrl = () => {
  const from = new URLSearchParams(window.location.search).get("from_url");
  try {
    const url = new URL(from || "/Dashboard", window.location.origin);
    if (url.origin !== window.location.origin || url.pathname.startsWith("/login")) return "/Dashboard";
    return url.pathname + url.search + url.hash;
  } catch {
    return "/Dashboard";
  }
};

export default function Login() {
  const [mode, setMode] = useState("signin"); // signin | signup | magic
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    const redirectTo = window.location.origin + safeReturnUrl();
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = safeReturnUrl();
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName }, emailRedirectTo: redirectTo },
        });
        if (error) throw error;
        if (data.session) window.location.href = safeReturnUrl();
        else setMessage("Check your email to confirm your account.");
      } else {
        const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
        if (error) throw error;
        setMessage("Check your email for a sign-in link.");
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const input =
    "w-full bg-black/40 border border-[#D4AF37]/30 rounded-md pl-10 pr-3 py-3 text-[#EDE3D0] placeholder:text-[#EDE3D0]/30 focus:outline-none focus:border-[#D4AF37]";

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-[11px] tracking-[0.4em] uppercase" style={{ color: GOLD, fontFamily: "Cinzel, Georgia, serif" }}>
            GlobeHouse
          </p>
          <h1 className="font-display text-4xl text-[#EDE3D0] mt-3">
            {mode === "signup" ? "Create account" : "Welcome back"}
          </h1>
        </div>

        <form onSubmit={submit} className="space-y-4 border border-[#D4AF37]/20 rounded-xl p-6 bg-[#0d0b08]">
          {mode === "signup" && (
            <div className="relative">
              <input className={input + " pl-3"} placeholder="Full name" value={fullName}
                onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
            </div>
          )}
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#D4AF37]/60" />
            <input className={input} type="email" required placeholder="Email" value={email}
              onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>
          {mode !== "magic" && (
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#D4AF37]/60" />
              <input className={input} type="password" required minLength={6} placeholder="Password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "signup" ? "new-password" : "current-password"} />
            </div>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}
          {message && <p className="text-sm text-[#D4AF37]">{message}</p>}

          <button type="submit" disabled={busy}
            className="w-full py-3 rounded-md font-semibold tracking-wider uppercase text-sm text-black disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: `linear-gradient(135deg, ${GOLD}, #B89045)` }}>
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Email me a link"}
          </button>

          <div className="flex justify-between text-xs text-[#EDE3D0]/60 pt-2">
            {mode !== "signin" ? (
              <button type="button" onClick={() => setMode("signin")} className="hover:text-[#D4AF37]">Sign in with password</button>
            ) : (
              <button type="button" onClick={() => setMode("magic")} className="hover:text-[#D4AF37]">Email me a link instead</button>
            )}
            {mode !== "signup" && (
              <button type="button" onClick={() => setMode("signup")} className="hover:text-[#D4AF37]">Create account</button>
            )}
          </div>
        </form>

        <p className="text-center mt-6">
          <a href="/Dashboard" className="text-xs text-[#EDE3D0]/50 hover:text-[#D4AF37]">← Back to GlobeHouse</a>
        </p>
      </div>
    </div>
  );
}
