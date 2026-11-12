import React, { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, QrCode, Search } from "lucide-react";

const BASE_URL = `${window.location.origin}${window.location.pathname.split("/").slice(0, -1).join("/")}`;

function getVerifyUrl(serial) {
  return `${window.location.origin}/Verify?serial=${encodeURIComponent(serial)}`;
}

export default function QRCodePanel({ certs }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const qrRef = useRef(null);

  const filtered = certs.filter((c) =>
    c.founder_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.serial_number?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDownload = (cert) => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, 400, 400);
      ctx.drawImage(img, 50, 50, 300, 300);
      const link = document.createElement("a");
      link.download = `QR_${cert.serial_number}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="bg-[#0f0f0f] border border-[#c9a84c22] rounded-2xl p-6 space-y-5">
      <div className="flex items-center gap-2">
        <QrCode className="w-5 h-5 text-[#c9a84c]" />
        <h3 className="text-[#c9a84c] text-sm font-semibold uppercase tracking-widest">QR Code Generator</h3>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
        <input
          type="text"
          placeholder="Search founder or serial…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg pl-9 pr-4 py-2 text-white/70 text-sm focus:outline-none focus:border-[#c9a84c66]"
        />
      </div>

      {/* List */}
      <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
        {filtered.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelected(c)}
            className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm ${
              selected?.id === c.id
                ? "border-[#c9a84c] bg-[#c9a84c10] text-white"
                : "border-white/[0.05] bg-white/[0.02] text-white/60 hover:border-[#c9a84c44]"
            }`}
          >
            <span className="font-medium">{c.founder_name}</span>
            <span className="text-white/30 ml-2 font-mono text-xs">{c.serial_number}</span>
          </button>
        ))}
        {filtered.length === 0 && <p className="text-white/20 text-xs text-center py-4">No founders found</p>}
      </div>

      {/* QR Display */}
      {selected && (
        <div className="border border-[#c9a84c33] rounded-2xl p-6 flex flex-col items-center gap-4">
          <div ref={qrRef} className="bg-white p-4 rounded-xl">
            <QRCodeSVG
              value={getVerifyUrl(selected.serial_number)}
              size={220}
              bgColor="#ffffff"
              fgColor="#0a0a0a"
              level="H"
            />
          </div>
          <div className="text-center">
            <p className="text-white/70 text-sm font-medium">{selected.founder_name}</p>
            <p className="text-white/30 text-xs font-mono mt-0.5">{selected.serial_number}</p>
            <p className="text-white/20 text-xs mt-2 break-all">{getVerifyUrl(selected.serial_number)}</p>
          </div>
          <button
            onClick={() => handleDownload(selected)}
            className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#c9a84c] hover:bg-[#b8943e] text-black font-semibold text-sm transition-colors"
          >
            <Download className="w-4 h-4" /> Download QR
          </button>
        </div>
      )}
    </div>
  );
}