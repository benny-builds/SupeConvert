import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { wailsBridge } from '../services/wails';
import {
  FileImage,
  Plus,
  FolderPlus,
  X,
  LayoutGrid,
  List,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  UploadCloud,
  CheckSquare,
  Trash2
} from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';

// Helper component for loading image thumbnail previews
const FileThumbnail: React.FC<{ filePath: string; className?: string }> = ({ filePath, className = "w-full h-full object-cover" }) => {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    wailsBridge.getThumbnailPreview(filePath, -1, []).then((res) => {
      if (active) {
        if (res && res.length > 0) {
          setThumbUrl(res.startsWith('data:') ? res : `data:image/png;base64,${res}`);
        }
        setLoading(false);
      }
    }).catch(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [filePath]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/50 text-muted-foreground animate-pulse">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    );
  }

  if (!thumbUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/40 text-muted-foreground">
        <FileImage className="w-6 h-6 opacity-60" />
      </div>
    );
  }

  return <img src={thumbUrl} alt="" className={className} />;
};

export const FileList: React.FC = () => {
  const {
    files,
    selectedFiles,
    fileStatuses,
    addFiles,
    removeFile,
    removeSelectedFiles,
    clearFiles,
    setSelectedFiles,
    handleFileClickWithModifiers,
  } = useAppStore();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isDragging, setIsDragging] = useState(false);

  const handleSelectFiles = async () => {
    const selected = await wailsBridge.selectInputFiles();
    if (selected && selected.length > 0) {
      addFiles(selected);
    }
  };

  const handleSelectFolder = async () => {
    const folder = await wailsBridge.selectFolder();
    if (folder) {
      const discovered = await wailsBridge.discoverFolderImages(folder);
      if (discovered && discovered.length > 0) {
        addFiles(discovered);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedPaths: string[] = [];
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const file = e.dataTransfer.files[i] as any;
        if (file.path) {
          droppedPaths.push(file.path);
        }
      }
      if (droppedPaths.length > 0) {
        addFiles(droppedPaths);
      }
    }
  };

  const handleFileClick = (filePath: string, index: number, e: React.MouseEvent) => {
    handleFileClickWithModifiers(filePath, index, e);
  };

  const selectAll = () => {
    if (selectedFiles.length === files.length) {
      setSelectedFiles(files[0] ? [files[0]] : []);
    } else {
      setSelectedFiles([...files]);
    }
  };

  const renderStatusBadge = (filePath: string) => {
    const statusObj = fileStatuses[filePath] || { status: 'queued' };

    if (statusObj.status === 'processing') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-bold text-[10px] shadow-xs animate-pulse">
          <Loader2 className="w-3 h-3 animate-spin" /> Processing
        </span>
      );
    }

    if (statusObj.status === 'done') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold text-[10px] shadow-xs">
          <CheckCircle2 className="w-3 h-3" /> Done
        </span>
      );
    }

    if (statusObj.status === 'error') {
      return (
        <Tooltip.Provider delayDuration={200}>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground font-bold text-[10px] shadow-xs cursor-help">
                <AlertCircle className="w-3 h-3" /> Error
              </span>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                className="z-50 max-w-xs p-2 rounded bg-popover text-popover-foreground border border-destructive/40 text-xs shadow-md"
                sideOffset={4}
              >
                <p className="font-semibold text-destructive mb-0.5">Processing Error</p>
                <p className="text-muted-foreground leading-snug">{statusObj.error || 'Failed'}</p>
                <Tooltip.Arrow className="fill-popover" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted border border-border text-foreground font-bold text-[10px] shadow-xs">
        <Clock className="w-3 h-3 text-muted-foreground" /> Queued
      </span>
    );
  };

  return (
    <div className="shadcn-card flex flex-col h-full min-h-0">
      {/* Header Bar */}
      <div className="p-2.5 border-b border-border bg-muted/40 flex items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <FileImage className="w-3.5 h-3.5 text-foreground" />
          <h2 className="font-semibold text-xs text-foreground">Files</h2>
          <span className="px-2 py-0.5 rounded-md bg-primary text-primary-foreground font-mono text-[10px] font-bold">
            {files.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* View Mode Switcher: Grid First, List Second */}
          <div className="flex items-center p-0.5 rounded bg-muted border border-border">
            <button
              onClick={() => setViewMode('grid')}
              title="Grid View"
              className={`p-1 rounded text-xs transition-colors ${
                viewMode === 'grid' ? 'bg-card text-foreground font-bold shadow-xs border border-border' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              title="List View"
              className={`p-1 rounded text-xs transition-colors ${
                viewMode === 'list' ? 'bg-card text-foreground font-bold shadow-xs border border-border' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleSelectFiles}
            className="shadcn-btn-secondary h-7 px-2 text-[11px] font-semibold text-foreground"
          >
            <Plus className="w-3 h-3 mr-1" /> Add
          </button>
          <button
            onClick={handleSelectFolder}
            className="shadcn-btn-secondary h-7 px-2 text-[11px] font-semibold text-foreground"
          >
            <FolderPlus className="w-3 h-3 mr-1" /> Folder
          </button>
        </div>
      </div>

      {/* High-Contrast Bulk Toolbar */}
      {files.length > 0 && (
        <div className="px-2.5 py-1.5 border-b border-border bg-muted/40 flex items-center justify-between text-xs flex-shrink-0">
          <button onClick={selectAll} className="flex items-center gap-1.5 font-bold text-foreground hover:opacity-80 transition-opacity">
            <CheckSquare className="w-3.5 h-3.5 text-foreground stroke-[2.5]" />
            <span>Select All ({selectedFiles.length}/{files.length})</span>
          </button>

          <div className="flex items-center gap-1.5">
            {selectedFiles.length > 1 && (
              <button
                onClick={removeSelectedFiles}
                className="px-2 py-0.5 rounded-md bg-destructive/90 hover:bg-destructive text-white font-bold text-[11px] border border-destructive/80 transition-colors shadow-xs flex items-center gap-1"
                title="Remove selected files"
              >
                <Trash2 className="w-3 h-3" /> Remove ({selectedFiles.length})
              </button>
            )}
            <button
              onClick={clearFiles}
              className="px-2 py-0.5 rounded-md bg-muted/80 hover:bg-destructive hover:text-white text-foreground font-bold text-[11px] border border-border/80 transition-colors shadow-xs"
              title="Clear all files from workspace"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Body Dropzone / File List */}
      <div
        className={`flex-1 min-h-0 overflow-y-auto p-2 transition-colors ${
          isDragging ? 'bg-primary/10 border-2 border-dashed border-primary' : ''
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={(e) => {
          if (!(e.target as HTMLElement).closest('[data-file-item]')) {
            setSelectedFiles([]);
          }
        }}
      >
        {files.length === 0 ? (
          <div className="h-full min-h-[180px] flex flex-col items-center justify-center border border-dashed border-border rounded-md p-4 text-center bg-muted/20">
            <div className="w-10 h-10 rounded-full bg-muted border border-border text-foreground flex items-center justify-center mb-2 shadow-xs">
              <UploadCloud className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-xs text-foreground mb-0.5">Drag & drop images here</h3>
            <p className="text-muted-foreground text-[10px] max-w-xs mb-3">PNG, JPG, WebP, BMP, TIFF</p>
            <button
              onClick={handleSelectFiles}
              className="shadcn-btn-primary h-7 px-3 text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Select Files
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* 2 Images Per Row Grid View */
          <div className="grid grid-cols-2 gap-2">
            {files.map((filePath, idx) => {
              const isSelected = selectedFiles.includes(filePath);
              const fileName = filePath.split(/[\\/]/).pop();

              return (
                <div
                  key={filePath}
                  data-file-item="true"
                  onClick={(e) => handleFileClick(filePath, idx, e)}
                  className={`p-1.5 rounded-md border flex flex-col justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-primary/15 border-primary ring-1 ring-primary shadow-xs'
                      : 'bg-card border-border hover:bg-muted/50'
                  }`}
                >
                  {/* Thumbnail Image Preview */}
                  <div className="h-28 w-full bg-background rounded-md mb-1.5 overflow-hidden border border-border relative group">
                    <FileThumbnail filePath={filePath} />
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 text-[9px] font-mono font-bold bg-card/90 border border-border rounded text-foreground shadow-xs">
                      #{idx + 1}
                    </span>
                  </div>

                  {/* Title & Actions */}
                  <p className="text-[11px] font-semibold text-foreground truncate mb-1.5 px-0.5" title={fileName}>
                    {fileName}
                  </p>
                  <div className="flex items-center justify-between gap-1 pt-1 border-t border-border/50">
                    {renderStatusBadge(filePath)}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(filePath);
                      }}
                      className="p-1 rounded-md bg-muted border border-border/80 text-muted-foreground hover:bg-red-600 hover:text-white hover:border-red-600 transition-all shadow-xs"
                      title="Remove file"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="space-y-1">
            {files.map((filePath, idx) => {
              const isSelected = selectedFiles.includes(filePath);
              const fileName = filePath.split(/[\\/]/).pop();

              return (
                <div
                  key={filePath}
                  data-file-item="true"
                  onClick={(e) => handleFileClick(filePath, idx, e)}
                  className={`p-2 rounded-md flex items-center justify-between cursor-pointer border transition-colors ${
                    isSelected
                      ? 'bg-primary/15 border-primary ring-1 ring-primary shadow-xs'
                      : 'bg-card border-border hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                    <span className="text-[10px] font-mono text-muted-foreground w-4 text-right flex-shrink-0 font-semibold">
                      {idx + 1}
                    </span>
                    <div className="w-7 h-7 rounded border border-border overflow-hidden flex-shrink-0 bg-background">
                      <FileThumbnail filePath={filePath} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs truncate ${isSelected ? 'font-bold text-foreground' : 'font-medium text-foreground'}`}>
                        {fileName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {renderStatusBadge(filePath)}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(filePath);
                      }}
                      className="p-1 rounded-md bg-muted border border-border/80 text-muted-foreground hover:bg-red-600 hover:text-white hover:border-red-600 transition-all shadow-xs"
                      title="Remove file"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

