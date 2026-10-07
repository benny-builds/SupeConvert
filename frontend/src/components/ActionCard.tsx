import React, { useState } from 'react';
import type { ActionDTO } from '../services/wails';
import { useAppStore } from '../store/useAppStore';
import { wailsBridge } from '../services/wails';
import * as Popover from '@radix-ui/react-popover';
import {
  GripVertical,
  Eye,
  EyeOff,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sliders,
  Maximize2,
  RotateCw,
  RotateCcw,
  Crop,
  Stamp,
  Sun,
  FileType,
  ArrowDownCircle,
  Settings2,
  X,
  FolderOpen,
  Plus,
} from 'lucide-react';

// Anchor icons
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

interface ActionCardProps {
  action: ActionDTO;
  isFirst: boolean;
  isLast: boolean;
}

const ACTION_META: Record<string, { label: string; Icon: React.ElementType }> = {
  Resize:        { label: 'Resize Image',        Icon: Maximize2 },
  Rotate:        { label: 'Rotate & Flip',       Icon: RotateCw  },
  Crop:          { label: 'Crop Region',          Icon: Crop      },
  Watermark:     { label: 'Watermark Overlay',   Icon: Stamp     },
  ColorAdjust:   { label: 'Color & Tone Adjust', Icon: Sun       },
  ConvertFormat: { label: 'Convert Format',      Icon: FileType  },
};

export const ActionCard: React.FC<ActionCardProps> = ({ action, isFirst, isLast }) => {
  const { removeAction, reorderActions, disabledActionIndices, toggleActionDisabled, updateAction } = useAppStore();
  const [editOpen, setEditOpen] = useState(false);

  const p = action.params || {};
  const isDisabled = disabledActionIndices.includes(action.index);
  const meta = ACTION_META[action.type] || { label: action.type, Icon: Sliders };
  const Icon = meta.Icon;

  const [width,          setWidth]          = useState<number>(p.width          ?? 1920);
  const [height,         setHeight]         = useState<number>(p.height         ?? 1080);
  const [maintainAspect, setMaintainAspect] = useState<boolean>(p.maintain_aspect ?? true);
  const [angle,          setAngle]          = useState<number>(p.angle          ?? 90);
  const [cropW,          setCropW]          = useState<number>(p.width          ?? 800);
  const [cropH,          setCropH]          = useState<number>(p.height         ?? 600);
  const [cropX,          setCropX]          = useState<number>(p.x              ?? 0);
  const [cropY,          setCropY]          = useState<number>(p.y              ?? 0);
  const [centerCrop,     setCenterCrop]     = useState<boolean>(p.center        ?? true);
  const [wmPath,         setWmPath]         = useState<string>(p.watermark_path ?? '');
  const [wmOp,           setWmOp]           = useState<number>(p.opacity        ?? 0.85);
  const [wmPos,          setWmPos]          = useState<string>(p.position       ?? 'bottom_right');
  const [wmScale,        setWmScale]        = useState<number>(p.scale          ?? 0.25);
  const [bright,         setBright]         = useState<number>(p.brightness     ?? 0);
  const [cont,           setCont]           = useState<number>(p.contrast       ?? 0);
  const [sat,            setSat]            = useState<number>(p.saturation     ?? 0);
  const [gray,           setGray]           = useState<boolean>(p.grayscale    ?? false);
  const [invert,         setInvert]         = useState<boolean>(p.invert        ?? false);
  const [format,         setFormat]         = useState<string>(p.target_format  ?? 'jpg');
  const [quality,        setQuality]        = useState<number>(p.quality        ?? 85);

  const renderSummary = () => {
    switch (action.type) {
      case 'Resize':        return `${p.width ?? 0} x ${p.height ?? 0} px (${p.maintain_aspect ? 'Fit' : 'Stretch'})`;
      case 'Rotate':        return `${p.angle ?? 0} degrees`;
      case 'Crop':          return p.center ? `Center ${p.width}x${p.height} px` : `[${p.x},${p.y}] ${p.width}x${p.height} px`;
      case 'Watermark':     return `${(p.position ?? 'bottom_right').replace('_', ' ')} @ ${Math.round((p.opacity ?? 1) * 100)}%`;
      case 'ColorAdjust':   return `B:${p.brightness ?? 0} C:${p.contrast ?? 0} S:${p.saturation ?? 0}${p.grayscale ? ' | Gray' : ''}`;
      case 'ConvertFormat': return `${(p.target_format ?? 'jpg').toUpperCase()} @ ${p.quality ?? 85}%`;
      default:              return JSON.stringify(p);
    }
  };

  const renderConfigSummary = () => {
    switch (action.type) {
      case 'Resize':        return `${width} x ${height} px ${maintainAspect ? '(Aspect Fit)' : '(Stretch)'}`;
      case 'Rotate':        return `${angle} degree Angle`;
      case 'Crop':          return centerCrop ? `Center Crop ${cropW}x${cropH} px` : `Crop (${cropX},${cropY}) ${cropW}x${cropH} px`;
      case 'Watermark':     return wmPath ? `${wmPos.replace('_', ' ')} @ ${Math.round(wmOp * 100)}% opacity, ${Math.round(wmScale * 100)}% size` : 'No PNG Selected';
      case 'ColorAdjust':   return `B:${bright} C:${cont} S:${sat}${gray ? ' | Grayscale' : ''}${invert ? ' | Invert' : ''}`;
      case 'ConvertFormat': return `${format.toUpperCase()} @ ${quality}% Quality`;
      default:              return '';
    }
  };

  const handleSelectWatermark = async () => {
    const files = await wailsBridge.selectInputFiles();
    if (files && files.length > 0) setWmPath(files[0]);
  };

  const handleSave = async () => {
    let params: any = {};
    switch (action.type) {
      case 'Resize':        params = { width: Number(width), height: Number(height), maintain_aspect: maintainAspect }; break;
      case 'Rotate':        params = { angle: Number(angle) }; break;
      case 'Crop':          params = { x: Number(cropX), y: Number(cropY), width: Number(cropW), height: Number(cropH), center: centerCrop }; break;
      case 'Watermark':     params = { watermark_path: wmPath, opacity: Number(wmOp), position: wmPos, scale: Number(wmScale) }; break;
      case 'ColorAdjust':   params = { brightness: Number(bright), contrast: Number(cont), saturation: Number(sat), grayscale: gray, invert }; break;
      case 'ConvertFormat': params = { target_format: format, quality: Number(quality) }; break;
    }
    await updateAction(action.index, action.type, params);
    setEditOpen(false);
  };

  const inputCls = 'w-full px-3 py-1.5 rounded-md bg-card border border-input font-mono text-xs text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all';
  const btnPos = (v: string) => `py-2 px-3 rounded-md border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${wmPos === v ? 'bg-primary text-primary-foreground border-primary shadow-xs' : 'bg-card border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted'}`;

  return (
    <div className="relative">
      <div className={`rounded-md border transition-all ${isDisabled ? 'bg-muted/40 border-border opacity-50 grayscale' : 'bg-card border-border hover:bg-muted/30'}`}>
        <div className="p-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-muted-foreground cursor-grab p-0.5"><GripVertical className="w-3.5 h-3.5" /></span>
            <span className="w-5 h-5 rounded-md bg-primary text-primary-foreground font-mono text-[10px] font-bold flex items-center justify-center flex-shrink-0 shadow-xs">{action.index + 1}</span>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div className="w-5 h-5 rounded bg-muted border border-border flex items-center justify-center text-foreground flex-shrink-0"><Icon className="w-3.5 h-3.5" /></div>
              <span className="font-bold text-xs text-foreground">{action.type}</span>
            </div>
            <span className="text-[11px] text-muted-foreground font-mono truncate pl-2 border-l border-border">{renderSummary()}</span>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <Popover.Root open={editOpen} onOpenChange={setEditOpen}>
              <Popover.Trigger asChild>
                <button className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Edit step">
                  <Settings2 className="w-3.5 h-3.5" />
                </button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content sideOffset={6} align="end"
                  className="z-50 w-[420px] h-[480px] rounded-md bg-card text-card-foreground border border-border/80 shadow-2xl overflow-hidden animate-scale-in text-xs flex flex-col backdrop-blur-md">

                  {/* Header */}
                  <div className="px-3.5 py-2.5 border-b border-border/60 flex items-center justify-between flex-shrink-0 bg-muted/20">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 shadow-2xs">
                        <Icon className="w-3.5 h-3.5 stroke-[2.5]" />
                      </div>
                      <span className="font-bold text-xs text-foreground">{meta.label}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">Step {action.index + 1}</span>
                    </div>
                    <button type="button" onClick={() => setEditOpen(false)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer">
                      <X className="w-4 h-4 text-foreground" />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-background/50">

                    {action.type === 'Resize' && (
                      <div className="space-y-4">
                        <div className="p-3.5 rounded-md bg-muted/20 border border-border/70 space-y-3">
                          <span className="text-[11px] font-bold text-muted-foreground uppercase block">Target Dimensions</span>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-muted-foreground text-[10px] font-semibold block mb-1">Width (px)</label>
                              <input type="number" min="1" value={width} onChange={(e) => setWidth(Number(e.target.value))} className={inputCls} />
                            </div>
                            <div>
                              <label className="text-muted-foreground text-[10px] font-semibold block mb-1">Height (px)</label>
                              <input type="number" min="1" value={height} onChange={(e) => setHeight(Number(e.target.value))} className={inputCls} />
                            </div>
                          </div>
                          <label className="flex items-center gap-2.5 cursor-pointer pt-2 border-t border-border/60">
                            <input type="checkbox" checked={maintainAspect} onChange={(e) => setMaintainAspect(e.target.checked)} className="w-4 h-4 rounded border-input text-primary accent-primary" />
                            <span className="text-foreground font-semibold text-xs">Maintain Aspect Ratio</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {action.type === 'Rotate' && (
                      <div className="space-y-4">
                        <div className="p-3.5 rounded-md bg-muted/20 border border-border/70 space-y-3">
                          <span className="text-[11px] font-bold text-muted-foreground uppercase block">Rotation Angle</span>
                          <div className="grid grid-cols-3 gap-2">
                            {[90, 180, 270].map((d) => (
                              <button key={d} type="button" onClick={() => setAngle(d)}
                                className={`py-2 rounded-md border font-mono text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${angle === d ? 'bg-primary text-primary-foreground border-primary shadow-xs' : 'bg-card border-input text-muted-foreground hover:text-foreground'}`}>
                                <RotateCw className="w-4 h-4" /><span>{d} deg</span>
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="p-3.5 rounded-md bg-muted/20 border border-border/70 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase">Custom Angle</span>
                            <span className="font-mono text-xs font-bold text-foreground">{angle} deg</span>
                          </div>
                          <input type="range" min="0" max="360" step="5" value={angle} onChange={(e) => setAngle(Number(e.target.value))} className="w-full cursor-pointer" />
                        </div>
                      </div>
                    )}

                    {action.type === 'Crop' && (
                      <div className="space-y-4">
                        <div className="p-3.5 rounded-md bg-muted/20 border border-border/70 space-y-3">
                          <label className="flex items-center gap-2.5 cursor-pointer pb-2 border-b border-border/60">
                            <input type="checkbox" checked={centerCrop} onChange={(e) => setCenterCrop(e.target.checked)} className="w-4 h-4 rounded border-input text-primary accent-primary" />
                            <span className="text-foreground font-semibold text-xs">Center Crop Region</span>
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-muted-foreground text-[10px] font-semibold block mb-1">Width (px)</label>
                              <input type="number" min="1" value={cropW} onChange={(e) => setCropW(Number(e.target.value))} className={inputCls} />
                            </div>
                            <div>
                              <label className="text-muted-foreground text-[10px] font-semibold block mb-1">Height (px)</label>
                              <input type="number" min="1" value={cropH} onChange={(e) => setCropH(Number(e.target.value))} className={inputCls} />
                            </div>
                          </div>
                          {!centerCrop && (
                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/60">
                              <div>
                                <label className="text-muted-foreground text-[10px] font-semibold block mb-1">Start X Offset</label>
                                <input type="number" min="0" value={cropX} onChange={(e) => setCropX(Number(e.target.value))} className={inputCls} />
                              </div>
                              <div>
                                <label className="text-muted-foreground text-[10px] font-semibold block mb-1">Start Y Offset</label>
                                <input type="number" min="0" value={cropY} onChange={(e) => setCropY(Number(e.target.value))} className={inputCls} />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {action.type === 'Watermark' && (
                      <div className="space-y-4">
                        <div className="p-3.5 rounded-md bg-muted/20 border border-border/70 space-y-3">
                          <span className="text-[11px] font-bold text-muted-foreground uppercase block">Watermark Image (PNG)</span>
                          <div className="flex gap-2">
                            <input type="text" readOnly value={wmPath} placeholder="Select PNG logo..."
                              className="flex-1 px-3 py-1.5 rounded-md bg-card border border-input font-mono text-[11px] text-foreground truncate" />
                            <button type="button" onClick={handleSelectWatermark}
                              className="px-3 py-1.5 bg-muted border border-border text-foreground font-semibold rounded-md text-xs hover:bg-muted/80 flex items-center gap-1.5 cursor-pointer shadow-2xs">
                              <FolderOpen className="w-3.5 h-3.5" /> Browse
                            </button>
                          </div>
                        </div>
                        <div className="p-3.5 rounded-md bg-muted/20 border border-border/70 space-y-3">
                          <span className="text-[11px] font-bold text-muted-foreground uppercase block">Placement Anchor</span>
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <button type="button" onClick={() => setWmPos('top_left')} className={btnPos('top_left')}><AnchorTopLeft className="w-4 h-4" /><span>Top Left</span></button>
                              <button type="button" onClick={() => setWmPos('top_right')} className={btnPos('top_right')}><AnchorTopRight className="w-4 h-4" /><span>Top Right</span></button>
                            </div>
                            <button type="button" onClick={() => setWmPos('center')} className={`w-full ${btnPos('center')}`}><AnchorCenter className="w-4 h-4" /><span>Center</span></button>
                            <div className="grid grid-cols-2 gap-2">
                              <button type="button" onClick={() => setWmPos('bottom_left')} className={btnPos('bottom_left')}><AnchorBottomLeft className="w-4 h-4" /><span>Bottom Left</span></button>
                              <button type="button" onClick={() => setWmPos('bottom_right')} className={btnPos('bottom_right')}><AnchorBottomRight className="w-4 h-4" /><span>Bottom Right</span></button>
                            </div>
                          </div>
                          <div className="pt-2 border-t border-border/60">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[11px] font-semibold text-muted-foreground">Watermark Opacity</span>
                              <span className="font-mono text-xs font-bold text-foreground">{Math.round(wmOp * 100)}%</span>
                            </div>
                            <input type="range" min="0.1" max="1.0" step="0.05" value={wmOp} onChange={(e) => setWmOp(Number(e.target.value))} className="w-full cursor-pointer" />
                          </div>
                          <div className="pt-2 border-t border-border/60">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[11px] font-semibold text-muted-foreground">Watermark Size</span>
                              <span className="font-mono text-xs font-bold text-foreground">{wmScale === 0 ? 'Original' : `${Math.round(wmScale * 100)}% of image width`}</span>
                            </div>
                            <input type="range" min="0" max="1.0" step="0.05" value={wmScale} onChange={(e) => setWmScale(Number(e.target.value))} className="w-full cursor-pointer" />
                            <div className="grid grid-cols-4 gap-1 mt-1.5">
                              {[{ label: 'Original', val: 0 }, { label: '15%', val: 0.15 }, { label: '25%', val: 0.25 }, { label: '50%', val: 0.5 }].map((s) => (
                                <button key={s.label} type="button" onClick={() => setWmScale(s.val)}
                                  className={`py-1 rounded-md text-[10px] font-semibold cursor-pointer transition-all border ${wmScale === s.val ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:text-foreground'}`}>
                                  {s.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {action.type === 'ColorAdjust' && (
                      <div className="space-y-4">
                        <div className="p-3.5 rounded-md bg-muted/20 border border-border/70 space-y-3">
                          <div className="flex justify-between items-center border-b border-border/60 pb-2">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase">Color and Light Controls</span>
                            <button type="button" onClick={() => { setBright(0); setCont(0); setSat(0); setGray(false); setInvert(false); }}
                              className="text-[10px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer">
                              <RotateCcw className="w-3 h-3" /> Reset
                            </button>
                          </div>
                          <div className="space-y-2.5">
                            {([['Brightness', bright, setBright], ['Contrast', cont, setCont], ['Saturation', sat, setSat]] as [string, number, (v: number) => void][]).map(([label, val, setter]) => (
                              <div key={label as string}>
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-foreground font-semibold">{label as string}</span>
                                  <span className="font-mono text-muted-foreground">{val as number}</span>
                                </div>
                                <input type="range" min="-100" max="100" value={val as number} onChange={(e) => (setter as (v: number) => void)(Number(e.target.value))} className="w-full cursor-pointer" />
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="p-3.5 rounded-md bg-muted/20 border border-border/70 space-y-2">
                          <span className="text-[11px] font-bold text-muted-foreground uppercase block">Special Filters</span>
                          <div className="grid grid-cols-2 gap-2">
                            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-md bg-card border border-border">
                              <input type="checkbox" checked={gray} onChange={(e) => setGray(e.target.checked)} className="w-4 h-4 rounded border-input text-primary accent-primary" />
                              <span className="text-foreground font-semibold text-xs">Grayscale</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-md bg-card border border-border">
                              <input type="checkbox" checked={invert} onChange={(e) => setInvert(e.target.checked)} className="w-4 h-4 rounded border-input text-primary accent-primary" />
                              <span className="text-foreground font-semibold text-xs">Invert Colors</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    )}

                    {action.type === 'ConvertFormat' && (
                      <div className="space-y-4">
                        <div className="p-3.5 rounded-md bg-muted/20 border border-border/70 space-y-3">
                          <span className="text-[11px] font-bold text-muted-foreground uppercase block">Target Image Format</span>
                          <div className="grid grid-cols-3 gap-2">
                            {['jpg', 'png', 'webp', 'bmp', 'gif', 'tiff'].map((fmt) => (
                              <button key={fmt} type="button" onClick={() => setFormat(fmt)}
                                className={`py-1.5 rounded-md text-xs font-mono font-bold transition-all uppercase cursor-pointer ${format === fmt ? 'bg-primary text-primary-foreground border-primary shadow-xs' : 'bg-card border border-input text-muted-foreground hover:text-foreground'}`}>
                                .{fmt}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="p-3.5 rounded-md bg-muted/20 border border-border/70 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase">Compression Quality</span>
                            <span className="font-mono text-xs font-bold text-foreground">{quality}%</span>
                          </div>
                          <input type="range" min="10" max="100" value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="w-full cursor-pointer" />
                          <div className="grid grid-cols-3 gap-1.5">
                            {[{ label: 'Web Fast (75%)', val: 75 }, { label: 'High (85%)', val: 85 }, { label: 'Max (100%)', val: 100 }].map((q) => (
                              <button key={q.label} type="button" onClick={() => setQuality(q.val)}
                                className="py-1 rounded-md bg-card border border-border text-[10px] font-semibold text-muted-foreground hover:text-foreground cursor-pointer">
                                {q.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-3.5 bg-muted/30 border-t border-border flex items-center justify-between gap-3 flex-shrink-0">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-semibold text-muted-foreground block truncate">Configuration Preview:</span>
                      <span className="font-mono text-xs font-bold text-foreground block truncate">{renderConfigSummary()}</span>
                    </div>
                    <button type="button" onClick={handleSave}
                      className="shadcn-btn-primary h-8 px-4 font-bold text-xs shadow-md flex items-center justify-center gap-2 flex-shrink-0">
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>Save Step</span>
                    </button>
                  </div>
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>

            <button onClick={() => toggleActionDisabled(action.index)}
              className={`p-1 rounded hover:bg-muted transition-colors ${isDisabled ? 'text-muted-foreground' : 'text-foreground'}`}
              title={isDisabled ? 'Enable step' : 'Disable step'}>
              {isDisabled ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
            <button disabled={isFirst} onClick={() => reorderActions(action.index, action.index - 1)}
              className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-20">
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button disabled={isLast} onClick={() => reorderActions(action.index, action.index + 1)}
              className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-20">
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => removeAction(action.index)}
              className="p-1 rounded text-muted-foreground hover:text-destructive">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {!isLast && (
        <div className="flex justify-center py-0.5">
          <ArrowDownCircle className="w-3 h-3 text-primary/60" />
        </div>
      )}
    </div>
  );
};
