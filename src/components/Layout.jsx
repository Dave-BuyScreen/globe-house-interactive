import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Tv, ShoppingBag, ShieldCheck, Wand2, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Layout({ children }) {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#120e0a] text-[#EDE3D0] flex flex-col font-sans">
      {/* Beaux-Arts Cornice Header */}
      <header className="border-b border-[#B89045]/20 bg-[#1a1410]/90 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo / Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl border border-[#B89045]/40 bg-gradient-to-br from-[#241c15] to-[#120e0a] flex items-center justify-center shadow-lg group-hover:border-[#D4AF37] transition-colors">
              <Tv className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <span className="font-display font-bold text-lg tracking-wider text-[#EDE3D0] group-hover:text-[#D4AF37] transition-colors">
                GLOBEHOUSE
              </span>
              <span className="block text-[10px] tracking-widest text-[#B89045] uppercase">Interactive Television</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link to="/" className="text-[#EDE3D0]/70 hover:text-[#D4AF37] transition-colors">
              Chateau Dashboard
            </Link>
            <Link to="/marketplace" className="flex items-center gap-1.5 text-[#EDE3D0]/70 hover:text-[#D4AF37] transition-colors">
              <ShoppingBag className="w-4 h-4 text-[#D4AF37]" />
              Marketplace
            </Link>
            <Link to="/mapper" className="flex items-center gap-1.5 text-[#EDE3D0]/70 hover:text-[#D4AF37] transition-colors">
              <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
              Spatial Mapper
            </Link>
            <Link to="/ubpl-editor" className="flex items-center gap-1.5 text-[#EDE3D0]/70 hover:text-[#D4AF37] transition-colors">
              <Wand2 className="w-4 h-4 text-[#D4AF37]" />
              UBPL Editor
            </Link>
          </nav>

          {/* User / Auth Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3 bg-[#241c15] border border-[#B89045]/20 rounded-xl px-3 py-1.5">
                <User className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-xs text-[#EDE3D0]/80 truncate max-w-[120px]">{user.email}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSignOut}
                  className="h-7 w-7 text-[#EDE3D0]/50 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => navigate("/")}
                className="bg-gradient-to-r from-[#D4AF37] to-[#B89045] text-[#1a1410] hover:opacity-90 font-semibold text-xs h-9 px-4 rounded-xl shadow-md"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#B89045]/15 bg-[#120e0a] py-8 px-6 text-center text-xs text-[#EDE3D0]/40">
        <p>© {new Date().getFullYear()} GlobeHouse Interactive Television. Powered by Supabase & Vercel.</p>
      </footer>
    </div>
  );
}
