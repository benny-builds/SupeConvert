import React, { useEffect, useState } from 'react';
import { useAppStore } from './store/useAppStore';
import { FileList } from './components/FileList';
import { ActionQueue } from './components/ActionQueue';
import { PreviewPane } from './components/PreviewPane';
import { OutputSettings } from './components/OutputSettings';
import { ProgressBar } from './components/ProgressBar';
import { ToastContainer } from './components/ToastContainer';
import { wailsBridge } from './services/wails';
import {
  Play,
  Sun,
  Moon,
  Loader2,
  Minus,
  Square,
  Copy,
  X,
} from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';

export const App: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false);
  const {
    theme,
    toggleTheme,
    refreshActions,
    refreshPresets,
    files,
    outputDir,
    isProcessing,
    progress,
    runBatch,
  } = useAppStore();

  useEffect(() => {
    refreshActions();
    refreshPresets();
  }, []);

  const handleToggleMaximise = async () => {
    wailsBridge.windowToggleMaximise();
    setTimeout(async () => {
      const maxed = await wailsBridge.windowIsMaximised();
      setIsMaximized(maxed);
    }, 60);
  };

  const canRunBatch = files.length > 0 && Boolean(outputDir) && !isProcessing;
  const progressPct = progress && progress.total > 0 ? Math.round((progress.index / progress.total) * 100) : 0;

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground font-sans overflow-hidden select-none">
      {/* Custom Integrated App Header & Titlebar */}
      <header
        onDoubleClick={handleToggleMaximise}
        className="h-10 bg-card border-b border-border pl-5 pr-0 flex items-center justify-between flex-shrink-0 z-30 shadow-xs select-none"
        style={{ "--wails-draggable": "drag" } as React.CSSProperties}
      >
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-2 flex-shrink-0" style={{ "--wails-draggable": "no-drag" } as React.CSSProperties}>
          <img src="/SupeConvert Logo Transparent.svg" alt="SupeConvert Logo" className="h-[16px] w-auto object-contain flex-shrink-0 select-none" />
          <span className="text-xs font-semibold tracking-tight text-foreground">
            SupeConvert
          </span>
          <span className="px-1.5 py-0.5 rounded-md bg-muted/80 text-[10px] font-mono text-muted-foreground border border-border/70">
            v1.0
          </span>
        </div>

        {/* Right: Actions, Theme Switcher & Window Controls */}
        <div className="flex items-center gap-2 h-full flex-shrink-0" style={{ "--wails-draggable": "no-drag" } as React.CSSProperties}>
          {/* Progress Pill */}
          {isProcessing && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-muted border border-primary/40 text-[11px] font-mono text-primary animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>{progressPct}% ({progress?.index}/{progress?.total})</span>
            </div>
          )}

          {/* Theme Switcher Toggle */}
          <div
            onClick={toggleTheme}
            className="flex items-center p-0.5 rounded-md bg-muted/80 border border-border cursor-pointer select-none transition-all duration-300 hover:bg-muted"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && toggleTheme()}
          >
            <div
              className={`flex items-center justify-center w-5 h-5 rounded transition-all duration-300 ${
                theme === 'light'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sun className="w-3 h-3" />
            </div>
            <div
              className={`flex items-center justify-center w-5 h-5 rounded transition-all duration-300 ${
                theme === 'dark'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Moon className="w-3 h-3" />
            </div>
          </div>

          {/* Convert Primary Button */}
          <Tooltip.Provider delayDuration={200}>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <span>
                  <button
                    disabled={!canRunBatch}
                    onClick={() => runBatch()}
                    className="shadcn-btn-primary h-7 px-3 text-xs font-medium"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> Converting...
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 fill-current mr-1.5" /> Convert ({files.length})
                      </>
                    )}
                  </button>
                </span>
              </Tooltip.Trigger>
              {!canRunBatch && !isProcessing && (
                <Tooltip.Portal>
                  <Tooltip.Content className="z-50 p-2 rounded bg-popover text-popover-foreground border border-border text-xs shadow-md">
                    {files.length === 0 ? 'Add files to convert' : 'Select an output folder'}
                  </Tooltip.Content>
                </Tooltip.Portal>
              )}
            </Tooltip.Root>
          </Tooltip.Provider>

          {/* Native Windows Style Window Controls */}
          <div className="flex items-center h-full ml-1 border-l border-border">
            <button
              onClick={() => wailsBridge.windowMinimise()}
              className="w-10 h-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              title="Minimize"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleToggleMaximise}
              className="w-10 h-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              title={isMaximized ? "Restore Down" : "Maximize"}
            >
              {isMaximized ? (
                <Copy className="w-3 h-3 rotate-180" />
              ) : (
                <Square className="w-3 h-3" />
              )}
            </button>
            <button
              onClick={() => wailsBridge.windowClose()}
              className="w-11 h-full flex items-center justify-center text-muted-foreground hover:text-white hover:bg-red-600 transition-colors"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Desktop Workspace Canvas Viewport */}
      <main className="flex-1 min-h-0 overflow-hidden p-2.5 bg-background relative">
        <div className="h-full w-full min-h-0">
          <div className="h-full flex flex-row gap-2.5 overflow-hidden">
            {/* Left Panel: File Manager */}
            <div className="w-80 flex-shrink-0 h-full min-h-0 flex flex-col">
              <FileList />
            </div>

            {/* Center Canvas: Live Preview & Pipeline Queue */}
            <div className="flex-1 min-w-[380px] h-full min-h-0 flex flex-col gap-2.5 overflow-hidden">
              <div className="flex-1 min-h-0">
                <PreviewPane />
              </div>
              <div className="h-64 flex-shrink-0 min-h-0">
                <ActionQueue />
              </div>
            </div>

            {/* Right Panel: Output Config */}
            <div className="w-80 flex-shrink-0 h-full min-h-0 flex flex-col">
              <OutputSettings />
            </div>
          </div>
        </div>
      </main>

      {/* Batch Processing Overlay */}
      <ProgressBar />

      {/* Non-intrusive Toasts */}
      <ToastContainer />
    </div>
  );
};

export default App;
