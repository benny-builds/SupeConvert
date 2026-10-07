import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  Eye,
  Info,
  Sparkles,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sliders,
  X
} from 'lucide-react';

export const PreviewPane: React.FC = () => {
  const { selectedFile, beforePreview, afterPreview, metadata, actions } = useAppStore();

  const [showMetadata, setShowMetadata] = useState(false);
  const [sliderPos, setSliderPos] = useState(50);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [containerWidth, setContainerWidth] = useState(800);
  const [fullContainerWidth, setFullContainerWidth] = useState(1200);
  const isDraggingSlider = useRef(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const fullScreenContainerRef = useRef<HTMLDivElement | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Wheel handler with responsive zoom speed
  const handleWheel = useCallback((e: WheelEvent) => {
    // 1. Pinch gesture on trackpad (or Ctrl + wheel)
    if (e.ctrlKey) {
      e.preventDefault();
      const zoomFactor = -e.deltaY * 0.008;
      setZoomLevel((prev) => {
        const next = prev * Math.exp(zoomFactor);
        return Math.min(5, Math.max(0.25, parseFloat(next.toFixed(2))));
      });
      return;
    }

    // 2. Mouse wheel notch zoom (abs(deltaY) >= 40, no horizontal scroll)
    if (Math.abs(e.deltaY) >= 40 && e.deltaX === 0) {
      e.preventDefault();
      // Fast & responsive mouse wheel zoom step
      const step = e.deltaY < 0 ? 0.20 : -0.20;
      setZoomLevel((prev) => Math.min(5, Math.max(0.25, parseFloat((prev + step).toFixed(2)))));
    }
  }, []);

  // Initialize ResizeObserver
  useEffect(() => {
    resizeObserverRef.current = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === containerRef.current && entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        } else if (entry.target === fullScreenContainerRef.current && entry.contentRect.width > 0) {
          setFullContainerWidth(entry.contentRect.width);
        }
      }
    });

    return () => {
      resizeObserverRef.current?.disconnect();
    };
  }, []);

  // Callback ref for normal preview container
  const setContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (containerRef.current) {
      containerRef.current.removeEventListener('wheel', handleWheel);
      resizeObserverRef.current?.unobserve(containerRef.current);
    }
    containerRef.current = node;
    if (node) {
      node.addEventListener('wheel', handleWheel, { passive: false });
      resizeObserverRef.current?.observe(node);
      if (node.clientWidth > 0) setContainerWidth(node.clientWidth);
    }
  }, [handleWheel]);

  // Callback ref for fullscreen preview container
  const setFullScreenContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (fullScreenContainerRef.current) {
      fullScreenContainerRef.current.removeEventListener('wheel', handleWheel);
      resizeObserverRef.current?.unobserve(fullScreenContainerRef.current);
    }
    fullScreenContainerRef.current = node;
    if (node) {
      node.addEventListener('wheel', handleWheel, { passive: false });
      resizeObserverRef.current?.observe(node);
      if (node.clientWidth > 0) setFullContainerWidth(node.clientWidth);
    }
  }, [handleWheel]);

  if (!selectedFile) {
    return (
      <div className="shadcn-card flex flex-col h-full min-h-0 items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-muted text-foreground flex items-center justify-center mb-3">
          <Eye className="w-6 h-6" />
        </div>
        <h3 className="font-semibold text-xs text-foreground mb-0.5">No Image Selected</h3>
        <p className="text-muted-foreground text-[11px] max-w-xs">
          Select an image from the left panel to preview pipeline transformations.
        </p>
      </div>
    );
  }

  const fileName = selectedFile.split(/[\\/]/).pop();

  const handleMouseDown = () => {
    isDraggingSlider.current = true;
  };

  const handleMouseUp = () => {
    isDraggingSlider.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, targetRef: React.RefObject<HTMLDivElement | null>) => {
    if (!isDraggingSlider.current || !targetRef.current) return;
    const rect = targetRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pct);
  };

  const zoomIn = () => setZoomLevel((z) => Math.min(5, parseFloat((z + 0.25).toFixed(2))));
  const zoomOut = () => setZoomLevel((z) => Math.max(0.25, parseFloat((z - 0.25).toFixed(2))));
  const resetZoom = () => setZoomLevel(1);

  const renderContent = (
    targetRef: React.RefObject<HTMLDivElement | null>,
    refCallback: (node: HTMLDivElement | null) => void
  ) => {
    const activeWidth = (targetRef === fullScreenContainerRef ? fullContainerWidth : containerWidth) || 800;

    return (
      <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
        <div
          ref={refCallback}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onMouseMove={(e) => handleMouseMove(e, targetRef)}
          className="relative w-full h-full overflow-hidden rounded border border-border shadow-xs select-none cursor-ew-resize flex items-center justify-center bg-background/50"
        >
          {afterPreview || beforePreview ? (
            <img
              src={afterPreview || beforePreview || ''}
              alt="Processed"
              style={{ transform: `scale(${zoomLevel})` }}
              className="absolute inset-0 w-full h-full object-contain pointer-events-none transition-transform duration-75"
            />
          ) : (
            <div className="text-muted-foreground text-xs animate-pulse">Rendering preview...</div>
          )}

          {beforePreview && (
            <div
              className="absolute inset-0 overflow-hidden z-10"
              style={{ width: `${sliderPos}%` }}
            >
              <div
                className="absolute top-0 bottom-0 left-0 h-full flex items-center justify-center"
                style={{ width: `${activeWidth}px` }}
              >
                <img
                  src={beforePreview}
                  alt="Original"
                  style={{ transform: `scale(${zoomLevel})` }}
                  className="w-full h-full object-contain pointer-events-none transition-transform duration-75"
                />
              </div>
              <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-popover/80 text-foreground font-semibold text-[9px] border border-border z-20">
                ORIGINAL
              </span>
            </div>
          )}

          <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-primary text-primary-foreground font-semibold text-[9px]">
            RESULT
          </span>

          {/* Slider Divider */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-primary z-20"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-primary text-primary-foreground border border-background shadow-md flex items-center justify-center">
              <Sliders className="w-2.5 h-2.5" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="shadcn-card flex flex-col h-full min-h-0">
        {/* Header Bar */}
        <div className="p-2.5 border-b border-border bg-muted/40 flex items-center justify-between gap-2 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Sparkles className="w-3.5 h-3.5 text-foreground flex-shrink-0" />
            <h2 className="font-semibold text-xs text-foreground truncate">
              {fileName}
            </h2>
            <span className="px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground font-mono text-[10px] flex-shrink-0">
              {actions.length} {actions.length === 1 ? 'action' : 'actions'}
            </span>
          </div>

          {/* Controls Toolbar */}
          <div className="flex items-center gap-1.5 flex-shrink-0">

            {/* Zoom controls */}
            <div className="flex items-center p-0.5 rounded bg-muted border border-border text-xs">
              <button onClick={zoomOut} className="shadcn-btn-icon h-5 w-5" title="Zoom out">
                <ZoomOut className="w-3 h-3" />
              </button>
              <span className="px-1 text-[10px] font-mono text-muted-foreground w-8 text-center">{Math.round(zoomLevel * 100)}%</span>
              <button onClick={zoomIn} className="shadcn-btn-icon h-5 w-5" title="Zoom in">
                <ZoomIn className="w-3 h-3" />
              </button>
              <button onClick={resetZoom} className="shadcn-btn-icon h-5 w-5 border-l border-border rounded-none" title="Reset zoom">
                <RotateCcw className="w-3 h-3" />
              </button>
              <button
                onClick={() => setIsFullScreen(true)}
                className="shadcn-btn-icon h-5 w-5 border-l border-border rounded-none"
                title="Fullscreen preview"
              >
                <Maximize2 className="w-3 h-3" />
              </button>
            </div>

            <button
              onClick={() => setShowMetadata(!showMetadata)}
              className={`shadcn-btn-secondary h-7 px-2 text-[11px] ${showMetadata ? 'bg-primary text-primary-foreground border-primary font-bold' : ''}`}
            >
              <Info className="w-3 h-3 mr-1" /> EXIF
            </button>
          </div>
        </div>

        {/* Main Preview Container */}
        <div className="flex-1 min-h-0 relative overflow-hidden bg-checkerboard flex items-center justify-center p-3">
          {/* EXIF Metadata Drawer Overlay */}
          {showMetadata && (
            <div className="absolute top-2 right-2 z-30 w-64 rounded-md bg-popover/95 backdrop-blur-md border border-border shadow-md p-3 text-xs animate-scale-in">
              <div className="flex items-center justify-between border-b border-border pb-1.5 mb-2">
                <span className="font-semibold text-foreground flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-foreground" /> EXIF Tags
                </span>
                <button onClick={() => setShowMetadata(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              {metadata ? (
                <div className="space-y-1 font-mono text-[10px]">
                  <div className="flex justify-between"><span className="text-muted-foreground">Make:</span> <span className="text-foreground">{metadata.make || 'N/A'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Model:</span> <span className="text-foreground">{metadata.model || 'N/A'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Date:</span> <span className="text-foreground">{metadata.date_time || 'N/A'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">ISO:</span> <span className="text-foreground">{metadata.iso_speed || 'N/A'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Shutter:</span> <span className="text-foreground">{metadata.exposure_time || 'N/A'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Aperture:</span> <span className="text-foreground">{metadata.f_number || 'N/A'}</span></div>
                </div>
              ) : (
                <p className="text-muted-foreground italic text-center py-1 text-[11px]">No EXIF metadata</p>
              )}
            </div>
          )}

          {renderContent(containerRef, setContainerRef)}
        </div>
      </div>

      {/* Fullscreen Modal Overlay */}
      {isFullScreen && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col p-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-foreground" />
              <h2 className="font-semibold text-sm text-foreground">{fileName}</h2>
              <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono text-xs">
                Fullscreen Preview
              </span>
            </div>

            <div className="flex items-center gap-2">

              <div className="flex items-center p-0.5 rounded bg-muted border border-border text-xs">
                <button onClick={zoomOut} className="shadcn-btn-icon h-6 w-6" title="Zoom out">
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 text-xs font-mono text-muted-foreground w-10 text-center">{Math.round(zoomLevel * 100)}%</span>
                <button onClick={zoomIn} className="shadcn-btn-icon h-6 w-6" title="Zoom in">
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button onClick={resetZoom} className="shadcn-btn-icon h-6 w-6 border-l border-border rounded-none" title="Reset zoom">
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={() => setIsFullScreen(false)}
                className="shadcn-btn-secondary h-8 px-3 text-xs"
              >
                <Minimize2 className="w-3.5 h-3.5 mr-1" /> Exit Fullscreen
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 relative overflow-hidden bg-checkerboard flex items-center justify-center p-4 mt-3 rounded-lg border border-border">
            {renderContent(fullScreenContainerRef, setFullScreenContainerRef)}
          </div>
        </div>
      )}
    </>
  );
};
