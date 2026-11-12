import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle2, AlertCircle, Download, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FloatingDashboardButton from "@/components/dashboard/FloatingDashboardButton";

export default function BulkImportDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [importType, setImportType] = useState("episodes");
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return file_url;
    },
  });

  const importMutation = useMutation({
    mutationFn: async ({ fileUrl, type }) => {
      const response = await base44.functions.invoke('bulkImportCSV', {
        file_url: fileUrl,
        import_type: type
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["episodes"] });
      setPreview(data);
    },
  });

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    setPreview(null);

    // Upload and preview
    const fileUrl = await uploadMutation.mutateAsync(selectedFile);
    await importMutation.mutateAsync({ fileUrl, type: importType });
  };

  const handleDownloadTemplate = (type) => {
    let csvContent = '';
    
    if (type === 'episodes') {
      csvContent = `title,vimeo_url,thumbnail_url,summary,keywords,theme_color,status,category
Example Episode,https://vimeo.com/123456789,https://example.com/thumb.jpg,A compelling summary,"comedy,entertainment",#8B5CF6,draft,other
Another Episode,https://vimeo.com/987654321,,Short description,"music,jazz",#D946EF,published,red_rooster_jazz`;
    } else {
      csvContent = `episode_id,trigger_type,timestamp,prompt_text,product_name,product_brand,product_price,product_description,shop_url,bounding_box_x,bounding_box_y,bounding_box_width,bounding_box_height
ep_123,buyscreen_only,30,Check this out,Leather Jacket,Gucci,$2499,Premium leather jacket,https://shop.com,20,30,15,25
ep_123,full_portal,60,Find the meaning,Sunglasses,Ray-Ban,$199,Classic aviator style,https://shop.com,50,40,10,12`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-violet-600 hover:bg-violet-700 h-9 gap-2">
          <Upload className="w-4 h-4" />
          Bulk Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#13131a] border-white/10 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
        <FloatingDashboardButton onClose={() => setOpen(false)} />
        <DialogHeader>
          <DialogTitle className="text-white">Bulk Import from CSV</DialogTitle>
        </DialogHeader>

        <Tabs value={importType} onValueChange={setImportType} className="mt-4">
          <TabsList className="grid w-full grid-cols-2 bg-white/[0.04]">
            <TabsTrigger value="episodes">Episodes</TabsTrigger>
            <TabsTrigger value="triggers">Triggers</TabsTrigger>
          </TabsList>

          <TabsContent value="episodes" className="space-y-4">
            <div className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-lg">
              <h3 className="text-sm font-medium text-white/90 mb-2">Episode CSV Format</h3>
              <p className="text-xs text-white/50 mb-3">
                Upload a CSV file with episode data. Each row creates a new episode.
              </p>
              <div className="text-xs text-white/40 space-y-1 mb-3">
                <p><strong>Required columns:</strong> title, vimeo_url</p>
                <p><strong>Optional columns:</strong> thumbnail_url, summary, keywords (comma-separated), theme_color, status, category</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDownloadTemplate('episodes')}
                className="h-7 text-xs border-white/10 text-white/60"
              >
                <Download className="w-3 h-3 mr-1.5" />
                Download Template
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="triggers" className="space-y-4">
            <div className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-lg">
              <h3 className="text-sm font-medium text-white/90 mb-2">Triggers CSV Format</h3>
              <p className="text-xs text-white/50 mb-3">
                Upload a CSV file with trigger data. Each row adds a trigger to the specified episode.
              </p>
              <div className="text-xs text-white/40 space-y-1 mb-3">
                <p><strong>Required columns:</strong> episode_id, timestamp, trigger_type</p>
                <p><strong>Optional columns:</strong> prompt_text, product_name, product_brand, product_price, product_description, shop_url, bounding_box_x, bounding_box_y, bounding_box_width, bounding_box_height</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDownloadTemplate('triggers')}
                className="h-7 text-xs border-white/10 text-white/60"
              >
                <Download className="w-3 h-3 mr-1.5" />
                Download Template
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-4">
          <div>
            <Label className="text-xs text-white/40 mb-2">Select CSV File</Label>
            <label className="flex items-center justify-center gap-3 h-24 border-2 border-dashed border-white/10 rounded-lg cursor-pointer hover:border-white/20 hover:bg-white/[0.02] transition-colors">
              <FileText className="w-6 h-6 text-white/30" />
              <div className="text-center">
                <p className="text-sm text-white/60">
                  {file ? file.name : 'Click to upload CSV'}
                </p>
                <p className="text-xs text-white/30 mt-1">
                  {importType === 'episodes' ? 'Episodes' : 'Triggers'} CSV file
                </p>
              </div>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileSelect}
              />
            </label>
          </div>

          {(uploadMutation.isPending || importMutation.isPending) && (
            <div className="flex items-center justify-center gap-2 p-4 bg-violet-500/10 border border-violet-500/30 rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
              <span className="text-sm text-violet-300">
                {uploadMutation.isPending ? 'Uploading file...' : 'Processing import...'}
              </span>
            </div>
          )}

          {preview && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-sm font-medium text-green-300">Import Complete</p>
                    <p className="text-xs text-green-400/60">
                      {preview.success_count} {importType} imported successfully
                    </p>
                  </div>
                </div>
                <Badge className="bg-green-500/20 text-green-300">
                  {preview.success_count} / {preview.total_count}
                </Badge>
              </div>

              {preview.errors && preview.errors.length > 0 && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="flex items-start gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-red-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-300">
                        {preview.errors.length} errors encountered
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {preview.errors.map((error, idx) => (
                      <p key={idx} className="text-xs text-red-400/80">
                        Row {error.row}: {error.message}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {preview.imported_items && preview.imported_items.length > 0 && (
                <div className="max-h-64 overflow-y-auto">
                  <p className="text-xs font-medium text-white/60 mb-2">Imported Items:</p>
                  <div className="space-y-1">
                    {preview.imported_items.slice(0, 10).map((item, idx) => (
                      <div key={idx} className="p-2 bg-white/[0.03] border border-white/[0.06] rounded text-xs text-white/60">
                        {importType === 'episodes' ? (
                          <span>{item.title}</span>
                        ) : (
                          <span>
                            Episode: {item.episode_id} • {item.product_name || 'Trigger'} @ {item.timestamp}s
                          </span>
                        )}
                      </div>
                    ))}
                    {preview.imported_items.length > 10 && (
                      <p className="text-xs text-white/30 text-center pt-2">
                        ...and {preview.imported_items.length - 10} more
                      </p>
                    )}
                  </div>
                </div>
              )}

              <Button
                onClick={() => {
                  setOpen(false);
                  setFile(null);
                  setPreview(null);
                }}
                className="w-full bg-violet-600 hover:bg-violet-700"
              >
                Done
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}