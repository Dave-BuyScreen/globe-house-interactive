import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { isSupabaseConfigured } from '@/lib/supabase'

function MissingConfig() {
  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#EDE3D0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Georgia, serif', textAlign: 'center' }}>
      <div>
        <p style={{ color: '#D4AF37', letterSpacing: '0.4em', fontSize: 11, textTransform: 'uppercase' }}>GlobeHouse</p>
        <h1 style={{ fontSize: 24, margin: '16px 0' }}>Site configuration missing</h1>
        <p style={{ opacity: 0.6, fontSize: 14 }}>Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then redeploy.</p>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  isSupabaseConfigured ? <App /> : <MissingConfig />
)
