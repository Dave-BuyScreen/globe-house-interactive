import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Save, Trash2 } from "lucide-react";

export default function BoundingBoxCanvas({ imageUrl, existingBox, onSave, onCancel }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState(null);
  const [currentBox, setCurrentBox] = useState(null);
  const [savedBox, setSavedBox] = useState(existingBox || null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (existingBox) {
      setSavedBox(existingBox);
    }
  }, [existingBox]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !imageUrl) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const containerWidth = container.clientWidth;
      const aspectRatio = img.height / img.width;
      const canvasWidth = containerWidth;
      const canvasHeight = canvasWidth * aspectRatio;

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      setImageDimensions({ width: canvasWidth, height: canvasHeight });
      setImageLoaded(true);
      redrawCanvas(img, canvasWidth, canvasHeight);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  useEffect(() => {
    if (imageLoaded && imageDimensions.width > 0) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        redrawCanvas(img, imageDimensions.width, imageDimensions.height);
      };
      img.src = imageUrl;
    }
  }, [currentBox, savedBox, imageLoaded, imageDimensions]);

  const redrawCanvas = (img, width, height) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, width, height);

    // Draw saved box
    if (savedBox) {
      drawBox(ctx, savedBox, width, height, "rgba(139, 92, 246, 0.3)", "#8B5CF6", 2);
    }

    // Draw current drawing box
    if (currentBox) {
      drawBox(ctx, currentBox, width, height, "rgba(34, 197, 94, 0.2)", "#22C55E", 2);
    }
  };

  const drawBox = (ctx, box, canvasWidth, canvasHeight, fillColor, strokeColor, lineWidth) => {
    const x = (box.x / 100) * canvasWidth;
    const y = (box.y / 100) * canvasHeight;
    const w = (box.width / 100) * canvasWidth;
    const h = (box.height / 100) * canvasHeight;

    ctx.fillStyle = fillColor;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.strokeRect(x, y, w, h);

    // Draw corner handles
    const handleSize = 8;
    ctx.fillStyle = strokeColor;
    ctx.fillRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
    ctx.fillRect(x + w - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
    ctx.fillRect(x - handleSize / 2, y + h - handleSize / 2, handleSize, handleSize);
    ctx.fillRect(x + w - handleSize / 2, y + h - handleSize / 2, handleSize, handleSize);
  };

  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setStartPos({ x, y });
    setCurrentBox(null);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !startPos) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const width = Math.abs(currentX - startPos.x);
    const height = Math.abs(currentY - startPos.y);
    const x = Math.min(startPos.x, currentX);
    const y = Math.min(startPos.y, currentY);

    // Convert to percentages
    const boxPercentages = {
      x: (x / imageDimensions.width) * 100,
      y: (y / imageDimensions.height) * 100,
      width: (width / imageDimensions.width) * 100,
      height: (height / imageDimensions.height) * 100,
    };

    setCurrentBox(boxPercentages);
  };

  const handleMouseUp = () => {
    if (currentBox) {
      setSavedBox(currentBox);
      setCurrentBox(null);
    }
    setIsDrawing(false);
    setStartPos(null);
  };

  const handleSave = () => {
    if (savedBox) {
      onSave(savedBox);
    }
  };

  const handleClear = () => {
    setSavedBox(null);
    setCurrentBox(null);
  };

  return (
    <div className="space-y-4">
      <div ref={containerRef} className="relative">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="w-full border border-white/10 rounded-lg cursor-crosshair"
        />
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#13131a] rounded-lg">
            <div className="text-white/40">Loading frame...</div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-white/60">
          {savedBox ? (
            <span>
              Box: ({savedBox.x.toFixed(1)}%, {savedBox.y.toFixed(1)}%) - {savedBox.width.toFixed(1)}% × {savedBox.height.toFixed(1)}%
            </span>
          ) : (
            <span>Click and drag to draw a bounding box</span>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            disabled={!savedBox}
            className="gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="gap-2"
          >
            <X className="w-4 h-4" />
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!savedBox}
            className="gap-2 bg-violet-600 hover:bg-violet-700"
          >
            <Save className="w-4 h-4" />
            Save Box
          </Button>
        </div>
      </div>
    </div>
  );
}