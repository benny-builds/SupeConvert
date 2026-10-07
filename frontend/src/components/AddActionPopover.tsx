import React, { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { useAppStore } from '../store/useAppStore';
import { wailsBridge } from '../services/wails';
import {
  Plus,
  Search,
  Maximize2,
  RotateCw,
  Crop,
  Stamp,
  Sun,
  FileType,
  ChevronRight,
  ArrowLeft,
  X,
  Sliders,
  FolderOpen,
  RotateCcw
} from 'lucide-react';

// Custom Minimal Vector Anchor Icons for Watermark Positioning
const AnchorTopLeft: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor">
    <rect x="3" y="3" width="18" height="18" rx="3.5" strokeWidth="1.75" />
    <rect x="5.5" y="5.5" width="5" height="5" rx="1" fill="currentColor" stroke="none" />
  </svg>
);

const AnchorTopRight: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor">
    <rect x="3" y="3" width="18" height="18" rx="3.5" strokeWidth="1.75" />
    <rect x="13.5" y="5.5" width="5" height="5" rx="1" fill="currentColor" stroke="none" />
  </svg>
);

const AnchorCenter: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor">
    <rect x="3" y="3" width="18" height="18" rx="3.5" strokeWidth="1.75" />
    <rect x="9.5" y="9.5" width="5" height="5" rx="1" fill="currentColor" stroke="none" />
  </svg>
);

const AnchorBottomLeft: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor">
    <rect x="3" y="3" width="18" height="18" rx="3.5" strokeWidth="1.75" />
    <rect x="5.5" y="13.5" width="5" height="5" rx="1" fill="currentColor" stroke="none" />
  </svg>
);

const AnchorBottomRight: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor">
    <rect x="3" y="3" width="18" height="18" rx="3.5" strokeWidth="1.75" />
    <rect x="13.5" y="13.5" width="5" height="5" rx="1" fill="currentColor" stroke="none" />
  </svg>
);

interface ActionDefinition {
  type: string;
  label: string;
  category: 'transform' | 'adjust' | 'format';
  categoryLabel: string;
  description: string;
  icon: React.ElementType;
}

const ACTION_DEFINITIONS: ActionDefinition[] = [
  {
    type: 'Resize',
    label: 'Resize Image',
    category: 'transform',
    categoryLabel: 'Transform',
    description: 'Scale dimensions while maintaining aspect ratio',
    icon: Maximize2,
  },
  {
    type: 'Rotate',
    label: 'Rotate & Flip',
    category: 'transform',
    categoryLabel: 'Transform',
    description: 'Rotate clockwise by 90°, 180°, 270° or custom angles',
    icon: RotateCw,
  },
  {
    type: 'Crop',
    label: 'Crop Region',
    category: 'transform',
    categoryLabel: 'Transform',
    description: 'Center crop or precise bounding box coordinates',
    icon: Crop,
  },
  {
    type: 'Watermark',
    label: 'Watermark Overlay',
    category: 'transform',
    categoryLabel: 'Transform',
    description: 'Overlay PNG watermark logo with opacity & placement',
    icon: Stamp,
  },
  {
    type: 'ColorAdjust',
    label: 'Color & Tone Adjust',
    category: 'adjust',
    categoryLabel: 'Adjustment',
    description: 'Tune brightness, contrast, saturation, grayscale & invert',
    icon: Sun,
  },
  {
    type: 'ConvertFormat',
    label: 'Convert Format',
    category: 'format',
    categoryLabel: 'Format',
    description: 'Export to JPG, PNG, WebP, BMP, GIF or TIFF with quality control',
    icon: FileType,
  },
];

export const AddActionPopover: React.FC = () => {
  const { addAction } = useAppStore();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'transform' | 'adjust' | 'format'>('all');
  const [activeType, setActiveType] = useState<string | null>(null);

  // Resize state
  const [resizeW, setResizeW] = useState(1920);
  const [resizeH, setResizeH] = useState(1080);
  const [aspect, setAspect] = useState(true);

  // Rotate state
  const [rotateDeg, setRotateDeg] = useState(90);

  // Crop state
  const [cropW, setCropW] = useState(800);
  const [cropH, setCropH] = useState(600);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [cropCenter, setCropCenter] = useState(true);

  // Watermark state
  const [watermarkFile, setWatermarkFile] = useState('');
  const [watermarkPos, setWatermarkPos] = useState('bottom_right');
  const [watermarkOp, setWatermarkOp] = useState(0.85);
  const [watermarkScale, setWatermarkScale] = useState(0.25);

  // ColorAdjust state
  const [bright, setBright] = useState(0);
  const [cont, setCont] = useState(0);
  const [sat, setSat] = useState(0);
  const [gray, setGray] = useState(false);
  const [invert, setInvert] = useState(false);

  // ConvertFormat state
  const [format, setFormat] = useState('jpg');
  const [quality, setQuality] = useState(85);

  const filteredActions = ACTION_DEFINITIONS.filter((act) => {
    const matchesCategory = selectedCategory === 'all' || act.category === selectedCategory;
    const matchesSearch =
      act.label.toLowerCase().includes(search.toLowerCase()) ||
      act.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSelectWatermark = async () => {
    const files = await wailsBridge.selectInputFiles();
    if (files && files.length > 0) {
      setWatermarkFile(files[0]);
    }
  };

  const handleAdd = async (type: string) => {
    let params: any = {};
    switch (type) {
      case 'Resize':
        params = { width: Number(resizeW), height: Number(resizeH), maintain_aspect: aspect };
        break;
      case 'Rotate':
        params = { angle: Number(rotateDeg) };
        break;
      case 'Crop':
        params = { x: Number(cropX), y: Number(cropY), width: Number(cropW), height: Number(cropH), center: cropCenter };
        break;
      case 'Watermark':
        params = { watermark_path: watermarkFile, opacity: Number(watermarkOp), position: watermarkPos, scale: Number(watermarkScale) };
        break;
      case 'ColorAdjust':
        params = { brightness: Number(bright), contrast: Number(cont), saturation: Number(sat), grayscale: gray, invert };
        break;
      case 'ConvertFormat':
        params = { target_format: format, quality: Number(quality) };
        break;
    }

    await addAction(type, params);
    setOpen(false);
    setActiveType(null);
    setSearch('');
  };

  const activeActionDef = ACTION_DEFINITIONS.find((a) => a.type === activeType);
  const ActiveIcon = activeActionDef?.icon;

  const renderConfigSummary = () => {
    if (!activeType) return '';
    switch (activeType) {
      case 'Resize':
        return `${resizeW} × ${resizeH} px ${aspect ? '(Aspect Fit)' : '(Stretch)'}`;
      case 'Rotate':
        return `${rotateDeg}° Angle`;
      case 'Crop':
        return cropCenter ? `Center Crop ${cropW}×${cropH} px` : `Crop (${cropX},${cropY}) ${cropW}×${cropH} px`;
      case 'Watermark':
        return watermarkFile ? `${watermarkPos.replace('_', ' ')} @ ${Math.round(watermarkOp * 100)}% opacity, ${Math.round(watermarkScale * 100)}% size` : 'No PNG Selected';
      case 'ColorAdjust':
        return `B:${bright} C:${cont} S:${sat}${gray ? ' | Grayscale' : ''}${invert ? ' | Invert' : ''}`;
      case 'ConvertFormat':
        return `${format.toUpperCase()} @ ${quality}% Quality`;
      default:
        return '';
    }
  };

  return (
    <Popover.Root
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        if (!val) setActiveType(null);
      }}
    >
      <Popover.Trigger asChild>
        <button className="shadcn-btn-primary w-full py-2 px-3 font-bold text-xs shadow-xs flex items-center justify-center gap-2">
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Pipeline Action...</span>
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          sideOffset={6}
          align="center"
          className="z-50 w-[420px] h-[480px] rounded-md bg-card text-card-foreground border border-border/80 shadow-2xl overflow-hidden animate-scale-in text-xs flex flex-col backdrop-blur-md"
        >
          {/* VIEW 1: DEDICATED FEATURE CONFIGURATION TAB */}
          {activeType && activeActionDef ? (
            <div className="flex flex-col h-full bg-card">
              {/* Minimal Clean Tab Header */}
              <div className="px-3.5 py-2.5 border-b border-border/60 flex items-center justify-between flex-shrink-0 bg-muted/20">
                <button
                  type="button"
                  onClick={() => setActiveType(null)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  title="Back to list"
                >
                  <ArrowLeft className="w-4 h-4 text-foreground" />
                </button>

                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 shadow-2xs">
                    {ActiveIcon && <ActiveIcon className="w-3.5 h-3.5 stroke-[2.5]" />}
                  </div>
                  <span className="font-bold text-xs text-foreground">{activeActionDef.label}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4 text-foreground" />
                </button>
              </div>

              {/* Dedicated Option Controls Body */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-background/50">
                {/* RESIZE FEATURE CONFIGURATION */}
                {activeType === 'Resize' && (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-md bg-muted/20 border border-border/70 space-y-3">
                      <span className="text-[11px] font-bold text-foreground block tracking-tight uppercase text-muted-foreground/80">
                        Target Dimensions
                      </span>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-muted-foreground text-[10px] font-semibold block mb-1">
                            Width (px)
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={resizeW}
                            onChange={(e) => setResizeW(Number(e.target.value))}
                            className="w-full px-3 py-1.5 rounded-md bg-card border border-input font-mono text-xs text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="text-muted-foreground text-[10px] font-semibold block mb-1">
                            Height (px)
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={resizeH}
                            onChange={(e) => setResizeH(Number(e.target.value))}
                            className="w-full px-3 py-1.5 rounded-md bg-card border border-input font-mono text-xs text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                          />
                        </div>
                      </div>

                      <label className="flex items-center gap-2.5 cursor-pointer pt-2 border-t border-border/60">
                        <input
                          type="checkbox"
                          checked={aspect}
                          onChange={(e) => setAspect(e.target.checked)}
                          className="w-4 h-4 rounded border-input text-primary accent-primary"
                        />
                        <span className="text-foreground font-semibold text-xs">Maintain Aspect Ratio</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* ROTATE FEATURE CONFIGURATION */}
                {activeType === 'Rotate' && (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-md bg-muted/20 border border-border/70 space-y-3">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase block">
                        Rotation Angle (° Deg)
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        {[90, 180, 270].map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setRotateDeg(d)}
                            className={`py-2 rounded-md border font-mono text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                              rotateDeg === d
                                ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                                : 'bg-card border-input text-muted-foreground hover:text-foreground hover:border-border'
                            }`}
                          >
                            <RotateCw className="w-4 h-4" />
                            <span>{d}° Angle</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-md bg-muted/20 border border-border/70 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase block">
                          Custom Angle
                        </span>
                        <span className="font-mono text-xs font-bold text-foreground">{rotateDeg}°</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        step="5"
                        value={rotateDeg}
                        onChange={(e) => setRotateDeg(Number(e.target.value))}
                        className="w-full accent-primary cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {/* CROP FEATURE CONFIGURATION */}
                {activeType === 'Crop' && (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-md bg-muted/20 border border-border/70 space-y-3">
                      <label className="flex items-center gap-2.5 cursor-pointer pb-2 border-b border-border/60">
                        <input
                          type="checkbox"
                          checked={cropCenter}
                          onChange={(e) => setCropCenter(e.target.checked)}
                          className="w-4 h-4 rounded border-input text-primary accent-primary"
                        />
                        <span className="text-foreground font-semibold text-xs">Center Crop Region</span>
                      </label>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-muted-foreground text-[10px] font-semibold block mb-1">
                            Width (px)
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={cropW}
                            onChange={(e) => setCropW(Number(e.target.value))}
                            className="w-full px-3 py-1.5 rounded-md bg-card border border-input font-mono text-xs text-foreground focus:border-primary focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-muted-foreground text-[10px] font-semibold block mb-1">
                            Height (px)
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={cropH}
                            onChange={(e) => setCropH(Number(e.target.value))}
                            className="w-full px-3 py-1.5 rounded-md bg-card border border-input font-mono text-xs text-foreground focus:border-primary focus:outline-none"
                          />
                        </div>
                      </div>

                      {!cropCenter && (
                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/60">
                          <div>
                            <label className="text-muted-foreground text-[10px] font-semibold block mb-1">
                              Start X Offset
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={cropX}
                              onChange={(e) => setCropX(Number(e.target.value))}
                              className="w-full px-3 py-1.5 rounded-md bg-card border border-input font-mono text-xs text-foreground"
                            />
                          </div>
                          <div>
                            <label className="text-muted-foreground text-[10px] font-semibold block mb-1">
                              Start Y Offset
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={cropY}
                              onChange={(e) => setCropY(Number(e.target.value))}
                              className="w-full px-3 py-1.5 rounded-md bg-card border border-input font-mono text-xs text-foreground"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* WATERMARK FEATURE CONFIGURATION */}
                {activeType === 'Watermark' && (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-md bg-muted/20 border border-border/70 space-y-3">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase block">
                        Watermark Image (PNG)
                      </span>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={watermarkFile}
                          placeholder="Select PNG logo..."
                          className="flex-1 px-3 py-1.5 rounded-md bg-card border border-input font-mono text-[11px] text-foreground truncate"
                        />
                        <button
                          type="button"
                          onClick={handleSelectWatermark}
                          className="px-3 py-1.5 bg-muted border border-border text-foreground font-semibold rounded-md text-xs hover:bg-muted/80 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <FolderOpen className="w-3.5 h-3.5 text-foreground" /> Browse
                        </button>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-md bg-muted/20 border border-border/70 space-y-3">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase block">
                        Watermark Placement Anchor
                      </span>

                      {/* Clear & Intuitive Spatial Button Layout */}
                      <div className="space-y-2">
                        {/* Top Row: Top Left & Top Right */}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setWatermarkPos('top_left')}
                            className={`py-2 px-3 rounded-md border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                              watermarkPos === 'top_left'
                                ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                                : 'bg-card border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted'
                            }`}
                          >
                            <AnchorTopLeft className="w-4 h-4" />
                            <span>Top Left</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setWatermarkPos('top_right')}
                            className={`py-2 px-3 rounded-md border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                              watermarkPos === 'top_right'
                                ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                                : 'bg-card border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted'
                            }`}
                          >
                            <AnchorTopRight className="w-4 h-4" />
                            <span>Top Right</span>
                          </button>
                        </div>

                        {/* Center Row: Center */}
                        <button
                          type="button"
                          onClick={() => setWatermarkPos('center')}
                          className={`w-full py-2 px-3 rounded-md border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                            watermarkPos === 'center'
                              ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                              : 'bg-card border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted'
                          }`}
                        >
                          <AnchorCenter className="w-4 h-4" />
                          <span>Center</span>
                        </button>

                        {/* Bottom Row: Bottom Left & Bottom Right */}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setWatermarkPos('bottom_left')}
                            className={`py-2 px-3 rounded-md border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                              watermarkPos === 'bottom_left'
                                ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                                : 'bg-card border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted'
                            }`}
                          >
                            <AnchorBottomLeft className="w-4 h-4" />
                            <span>Bottom Left</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setWatermarkPos('bottom_right')}
                            className={`py-2 px-3 rounded-md border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                              watermarkPos === 'bottom_right'
                                ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                                : 'bg-card border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted'
                            }`}
                          >
                            <AnchorBottomRight className="w-4 h-4" />
                            <span>Bottom Right</span>
                          </button>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border/60">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[11px] font-semibold text-muted-foreground">Watermark Opacity</span>
                          <span className="font-mono text-xs font-bold text-foreground">
                            {Math.round(watermarkOp * 100)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="1.0"
                          step="0.05"
                          value={watermarkOp}
                          onChange={(e) => setWatermarkOp(Number(e.target.value))}
                          className="w-full accent-primary cursor-pointer"
                        />
                      </div>

                      <div className="pt-2 border-t border-border/60">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[11px] font-semibold text-muted-foreground">Watermark Size</span>
                          <span className="font-mono text-xs font-bold text-foreground">
                            {watermarkScale === 0 ? 'Original' : `${Math.round(watermarkScale * 100)}% of image width`}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1.0"
                          step="0.05"
                          value={watermarkScale}
                          onChange={(e) => setWatermarkScale(Number(e.target.value))}
                          className="w-full accent-primary cursor-pointer"
                        />
                        <div className="grid grid-cols-4 gap-1 mt-1.5">
                          {[
                            { label: 'Original', val: 0 },
                            { label: '15%', val: 0.15 },
                            { label: '25%', val: 0.25 },
                            { label: '50%', val: 0.5 },
                          ].map((s) => (
                            <button
                              key={s.label}
                              type="button"
                              onClick={() => setWatermarkScale(s.val)}
                              className={`py-1 rounded-md text-[10px] font-semibold cursor-pointer transition-all border ${
                                watermarkScale === s.val
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : 'bg-card border-border text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* COLOR ADJUST FEATURE CONFIGURATION */}
                {activeType === 'ColorAdjust' && (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-md bg-muted/20 border border-border/70 space-y-3">
                      <div className="flex justify-between items-center border-b border-border/60 pb-2">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase">
                          Color & Light Controls
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setBright(0);
                            setCont(0);
                            setSat(0);
                            setGray(false);
                            setInvert(false);
                          }}
                          className="text-[10px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" /> Reset
                        </button>
                      </div>

                      <div className="space-y-2.5">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-foreground font-semibold">Brightness</span>
                            <span className="font-mono text-muted-foreground">{bright}</span>
                          </div>
                          <input
                            type="range"
                            min="-100"
                            max="100"
                            value={bright}
                            onChange={(e) => setBright(Number(e.target.value))}
                            className="w-full accent-primary cursor-pointer"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-foreground font-semibold">Contrast</span>
                            <span className="font-mono text-muted-foreground">{cont}</span>
                          </div>
                          <input
                            type="range"
                            min="-100"
                            max="100"
                            value={cont}
                            onChange={(e) => setCont(Number(e.target.value))}
                            className="w-full accent-primary cursor-pointer"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-foreground font-semibold">Saturation</span>
                            <span className="font-mono text-muted-foreground">{sat}</span>
                          </div>
                          <input
                            type="range"
                            min="-100"
                            max="100"
                            value={sat}
                            onChange={(e) => setSat(Number(e.target.value))}
                            className="w-full accent-primary cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-md bg-muted/20 border border-border/70 space-y-2">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase block">
                        Special Filters
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <label className="flex items-center gap-2 cursor-pointer p-2 rounded-md bg-card border border-border">
                          <input
                            type="checkbox"
                            checked={gray}
                            onChange={(e) => setGray(e.target.checked)}
                            className="w-4 h-4 rounded border-input text-primary accent-primary"
                          />
                          <span className="text-foreground font-semibold text-xs">Grayscale</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer p-2 rounded-md bg-card border border-border">
                          <input
                            type="checkbox"
                            checked={invert}
                            onChange={(e) => setInvert(e.target.checked)}
                            className="w-4 h-4 rounded border-input text-primary accent-primary"
                          />
                          <span className="text-foreground font-semibold text-xs">Invert Colors</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* CONVERT FORMAT FEATURE CONFIGURATION */}
                {activeType === 'ConvertFormat' && (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-md bg-muted/20 border border-border/70 space-y-3">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase block">
                        Target Image Format
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        {['jpg', 'png', 'webp', 'bmp', 'gif', 'tiff'].map((fmt) => (
                          <button
                            key={fmt}
                            type="button"
                            onClick={() => setFormat(fmt)}
                            className={`py-1.5 rounded-md text-xs font-mono font-bold transition-all uppercase cursor-pointer ${
                              format === fmt
                                ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                                : 'bg-card border border-input text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            .{fmt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-md bg-muted/20 border border-border/70 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase">
                          Compression Quality
                        </span>
                        <span className="font-mono text-xs font-bold text-foreground">{quality}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={quality}
                        onChange={(e) => setQuality(Number(e.target.value))}
                        className="w-full accent-primary cursor-pointer"
                      />
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { label: 'Web Fast (75%)', val: 75 },
                          { label: 'High (85%)', val: 85 },
                          { label: 'Max (100%)', val: 100 },
                        ].map((q) => (
                          <button
                            key={q.label}
                            type="button"
                            onClick={() => setQuality(q.val)}
                            className="py-1 rounded-md bg-card border border-border text-[10px] font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            {q.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Dedicated Tab Footer */}
              <div className="p-3.5 bg-muted/30 border-t border-border flex items-center justify-between gap-3 flex-shrink-0">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-semibold text-muted-foreground block truncate">
                    Configuration Preview:
                  </span>
                  <span className="font-mono text-xs font-bold text-foreground block truncate">
                    {renderConfigSummary()}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleAdd(activeType)}
                  className="shadcn-btn-primary h-8 px-4 font-bold text-xs shadow-md flex items-center justify-center gap-2 flex-shrink-0"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Add Step</span>
                </button>
              </div>
            </div>
          ) : (
            /* VIEW 2: MAIN FEATURE CATALOG (STABLE FIXED CONTAINER HEIGHT) */
            <div className="flex flex-col h-full">
              {/* Searchbar & Header */}
              <div className="p-3.5 bg-muted/40 border-b border-border space-y-2.5 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-md bg-background border border-input focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all shadow-2xs">
                    <Search className="w-4 h-4 text-foreground flex-shrink-0" />
                    <input
                      type="text"
                      autoFocus
                      placeholder="Search features... (Resize, Rotate, Format)"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-xs font-medium"
                    />
                    {search && (
                      <button
                        onClick={() => setSearch('')}
                        className="text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5 text-foreground" />
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Category Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pt-0.5 no-scrollbar">
                  {[
                    { id: 'all', label: 'All Features' },
                    { id: 'transform', label: 'Transform' },
                    { id: 'adjust', label: 'Adjustment' },
                    { id: 'format', label: 'Format' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id as any)}
                      className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer shadow-2xs ${
                        selectedCategory === cat.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background hover:bg-muted text-muted-foreground hover:text-foreground border border-border'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feature List Scroll Region - Container height is fixed at 480px! */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {filteredActions.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center h-full">
                    <Sliders className="w-8 h-8 mx-auto mb-2 text-foreground opacity-40" />
                    <p className="font-bold text-xs text-foreground">No matching features found</p>
                    <p className="text-[11px] text-muted-foreground mt-1">Try searching for "Resize" or "Convert"</p>
                  </div>
                ) : (
                  filteredActions.map((act) => {
                    const Icon = act.icon;

                    return (
                      <div
                        key={act.type}
                        onClick={() => setActiveType(act.type)}
                        className="p-3 rounded-md border border-border/70 bg-card hover:bg-muted/50 hover:border-primary/50 transition-all flex items-center justify-between cursor-pointer group shadow-2xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-md bg-muted border border-border flex items-center justify-center text-foreground flex-shrink-0 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all shadow-2xs">
                            <Icon className="w-4 h-4 stroke-[2]" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-foreground truncate group-hover:text-foreground transition-colors">
                                {act.label}
                              </span>
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-muted border border-border text-muted-foreground">
                                {act.categoryLabel}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate mt-0.5">{act.description}</p>
                          </div>
                        </div>

                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};
