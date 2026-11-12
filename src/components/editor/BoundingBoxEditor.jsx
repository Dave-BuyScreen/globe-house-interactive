import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Move, Maximize2 } from "lucide-react";

export default function BoundingBoxEditor({ 
  videoRef, 
  boundingBox, 
  onBoundingBoxChange, 
  onClose,
  themeColor = "#8B5CF6" 
}) {
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Internal state for box position/size (percentage-based)
  const [box, setBox] = useState(
    boundingBox || { x: 25, y: 25, width: 50, height: 50 }
  );

  // Update container size on mount and resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Don't notify parent during drag - only on close

  const handleMouseDown = (e, action) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = containerRef.current.getBoundingClientRect();
    const startX = ((e.clientX - rect.left) / rect.width) * 100;
    const startY = ((e.clientY - rect.top) / rect.height) * 100;

    setDragStart({ x: startX, y: startY, action });
    
    if (action === 'move') {
      setIsDragging(true);
    } else if (action === 'resize') {
      setIsResizing(true);
    }
  };

  const handleMouseMove = (e) => {
    if (!dragStart || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const currentX = ((e.clientX - rect.left) / rect.width) * 100;
    const currentY = ((e.clientY - rect.top) / rect.height) * 100;

    const deltaX = currentX - dragStart.x;
    const deltaY = currentY - dragStart.y;

    if (dragStart.action === 'move') {
      setBox(prev => ({
        ...prev,
        x: Math.max(0, Math.min(100 - prev.width, prev.x + deltaX)),
        y: Math.max(0, Math.min(100 - prev.height, prev.y + deltaY))
      }));
      setDragStart({ ...dragStart, x: currentX, y: currentY });
    } else if (dragStart.action === 'resize') {
      setBox(prev => {
        const newWidth = Math.max(10, prev.width + deltaX);
        const newHeight = Math.max(10, prev.height + deltaY);
        return {
          ...prev,
          width: Math.min(100 - prev.x, newWidth),
          height: Math.min(100 - prev.y, newHeight)
        };
      });
      setDragStart({ ...dragStart, x: currentX, y: currentY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setDragStart(null);
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-30"
      ref={containerRef}
      style={{ cursor: isDragging ? 'move' : isResizing ? 'nwse-resize' : 'default' }}
    >
      {/* Overlay dimming */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-none" />

      {/* Instructions */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-2 text-xs text-white/70 flex items-center gap-2 shadow-xl">
        <Move className="w-3.5 h-3.5" />
        Drag to move · Resize from corner
      </div>

      {/* Close button */}
      <button
        onClick={() => onClose(box)}
        className="absolute top-4 right-4 z-40 p-2 rounded-lg bg-black/80 backdrop-blur-xl border border-white/10 text-white/70 hover:text-white hover:bg-black/90 transition-all"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Bounding Box */}
      <div
        className="absolute border-2 bg-transparent cursor-move group"
        style={{
          left: `${box.x}%`,
          top: `${box.y}%`,
          width: `${box.width}%`,
          height: `${box.height}%`,
          borderColor: themeColor,
          boxShadow: `0 0 0 2px rgba(0,0,0,0.3), 0 0 20px ${themeColor}60`,
        }}
        onMouseDown={(e) => handleMouseDown(e, 'move')}
      >
        {/* Corner resize handle */}
        <div
          className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-2 cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            backgroundColor: themeColor,
            borderColor: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
          }}
          onMouseDown={(e) => handleMouseDown(e, 'resize')}
        >
          <Maximize2 className="w-3 h-3 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>

        {/* Center drag handle */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          style={{
            backgroundColor: `${themeColor}40`,
            border: `2px solid ${themeColor}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
          }}
        >
          <Move className="w-4 h-4 text-white" />
        </div>

        {/* Coordinate display */}
        <div 
          className="absolute -top-8 left-0 bg-black/90 backdrop-blur-xl border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white/60 font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {Math.round(box.x)}, {Math.round(box.y)} • {Math.round(box.width)}×{Math.round(box.height)}
        </div>
      </div>
    </motion.div>
  );
}