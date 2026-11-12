import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scan, Loader2, CheckCircle2, AlertCircle, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function AutoScanPanel({ episodeId, vimeoUrl, onTriggersDetected }) {
  const [scanning, setScanning] = useState(false);
  const [productTypes, setProductTypes] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const queryClient = useQueryClient();

  const scanMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke('autoScanVideo', data);
      return response.data;
    },
    onSuccess: (data) => {
      setScanResult(data);
      if (data.triggers && data.triggers.length > 0) {
        onTriggersDetected(data.triggers);
        queryClient.invalidateQueries({ queryKey: ["episode", episodeId] });
      }
    },
  });

  const handleScan = async () => {
    if (!episodeId || !vimeoUrl) {
      alert("Please save the episode with a Vimeo URL first");
      return;
    }

    setScanning(true);
    setScanResult(null);

    const types = productTypes
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    await scanMutation.mutateAsync({
      episode_id: episodeId,
      vimeo_url: vimeoUrl,
      product_types: types
    });

    setScanning(false);
  };

  return (
    <Card className="bg-[#13131a] border-white/10">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-white/90 flex items-center gap-2">
          <Scan className="w-4 h-4 text-cyan-400" />
          Auto-Scan Video for Products
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-xs text-white/40 mb-1.5">
            Product Types (optional, comma-separated)
          </Label>
          <Input
            value={productTypes}
            onChange={(e) => setProductTypes(e.target.value)}
            placeholder="e.g., watches, jackets, sunglasses"
            className="h-9 bg-white/[0.04] border-white/[0.08] text-white text-sm"
            disabled={scanning}
          />
          <p className="text-xs text-white/30 mt-1">
            Leave empty to detect all products
          </p>
        </div>

        <Button
          onClick={handleScan}
          disabled={scanning || !episodeId || !vimeoUrl}
          className="w-full bg-cyan-600 hover:bg-cyan-700 h-9"
        >
          {scanning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Scanning video frames...
            </>
          ) : (
            <>
              <Scan className="w-4 h-4 mr-2" />
              Start Auto-Scan
            </>
          )}
        </Button>

        {scanResult && (
          <div className={`p-3 rounded-lg border ${
            scanResult.detected_count > 0
              ? 'bg-green-500/10 border-green-500/30'
              : 'bg-amber-500/10 border-amber-500/30'
          }`}>
            <div className="flex items-start gap-2">
              {scanResult.detected_count > 0 ? (
                <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  scanResult.detected_count > 0 ? 'text-green-400' : 'text-amber-400'
                }`}>
                  {scanResult.detected_count > 0
                    ? `Found ${scanResult.detected_count} product${scanResult.detected_count > 1 ? 's' : ''}`
                    : 'No products detected'}
                </p>
                {scanResult.scanned_timestamps && (
                  <p className="text-xs text-white/40 mt-1">
                    Scanned {scanResult.scanned_timestamps.length} timestamps
                  </p>
                )}
              </div>
              <button
                onClick={() => setScanResult(null)}
                className="text-white/40 hover:text-white/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {scanResult.triggers && scanResult.triggers.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-white/50 font-medium">Detected Products:</p>
                <div className="flex flex-wrap gap-2">
                  {scanResult.triggers.map((trigger, idx) => (
                    <Badge
                      key={idx}
                      className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                    >
                      {trigger.product_name} @ {Math.floor(trigger.timestamp)}s
                      <span className="ml-1 text-xs opacity-60">
                        ({Math.round(trigger.confidence_score * 100)}%)
                      </span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-white/30 space-y-1">
          <p>• Scans video at multiple intervals</p>
          <p>• Detects products and creates trigger timestamps</p>
          <p>• Auto-generates bounding boxes for highlighting</p>
          <p>• Review and refine detected triggers below</p>
        </div>
      </CardContent>
    </Card>
  );
}