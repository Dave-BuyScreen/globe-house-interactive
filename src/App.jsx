import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#120e0a] text-[#EDE3D0] flex items-center justify-center font-serif text-xl tracking-widest">
        LOADING GLOBEHOUSE INTERACTIVE...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#120e0a] text-[#EDE3D0] flex flex-col font-serif">
      <header className="border-b border-[#3d2c1d] p-6 bg-[#18110b] flex justify-between items-center shadow-2xl">
        <div>
          <h1 className="text-2xl font-bold tracking-wider text-[#d4af37]">GLOBEHOUSE INTERACTIVE TV</h1>
          <p className="text-xs text-[#a38a6f] tracking-widest uppercase">Transformation Chateau & BuyScreen SDK</p>
        </div>
        <div className="text-sm bg-[#241910] px-4 py-2 rounded border border-[#3d2c1d]">
          {session ? `Logged in: ${session.user.email}` : 'Concierge Mode (Public)'}
        </div>
      </header>

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-[#18110b] border border-[#3d2c1d] p-6 rounded-lg shadow-xl">
          <h2 className="text-lg font-semibold text-[#d4af37] mb-2">Chateau Dashboard</h2>
          <p className="text-sm text-[#b8a38c] leading-relaxed">
            Manage your spatial mapping studio, video upload processors, and autonomous preview players seamlessly.
          </p>
        </div>
        <div className="bg-[#18110b] border border-[#3d2c1d] p-6 rounded-lg shadow-xl">
          <h2 className="text-lg font-semibold text-[#d4af37] mb-2">BuyScreen Marketplace</h2>
          <p className="text-sm text-[#b8a38c] leading-relaxed">
            Interactive video technology enabling viewers to discover, select, and purchase items directly from video screens.
          </p>
        </div>
        <div className="bg-[#18110b] border border-[#3d2c1d] p-6 rounded-lg shadow-xl">
          <h2 className="text-lg font-semibold text-[#d4af37] mb-2">Supabase Sync</h2>
          <p className="text-sm text-[#b8a38c] leading-relaxed">
            Database connection established securely with live authentication and real-time triggers.
          </p>
        </div>
      </main>

      <footer className="border-t border-[#3d2c1d] p-4 text-center text-xs text-[#8c735b] bg-[#18110b]">
        GlobeHouse Interactive & BuyScreen SDK © 2026 — All Rights Reserved.
      </footer>
    </div>
  );
}
