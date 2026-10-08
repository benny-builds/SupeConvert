import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  Loader2,
  Check,
  AlertCircle,
  Terminal,
  ChevronDown,
  ChevronRight,
  X,
  RotateCcw,
  SkipForward,
} from 'lucide-react';

export const ProgressBar: React.FC = () => {
  const {
    isProcessing,
    progress,
    batchLogs,
    completionSummary,
    clearCompletionSummary,
    outputDir,
    reprocessPrompt,
    confirmReprocess,
    cancelReprocess,
  } = useAppStore();

  const [showLogs, setShowLogs] = useState(false);
  const [showErrorsExpanded, setShowErrorsExpanded] = useState(true);

  // 1. Re-process Confirmation Modal
  if (reprocessPrompt && reprocessPrompt.open) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-card border border-border rounded-xl max-w-md w-full shadow-2xl p-5 space-y-4 text-card-foreground">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-sm text-foreground">
                Re-process Completed Images?
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">{reprocessPrompt.doneCount}</span> of{' '}
                <span className="font-semibold text-foreground">{reprocessPrompt.totalCount}</span> selected images are already marked as completed.
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 text-xs">
            <button
              onClick={cancelReprocess}
              className="px-3 py-1.5 rounded-lg border border-border bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => confirmReprocess('skip_done')}
              className="px-3 py-1.5 rounded-lg border border-border bg-muted/80 text-foreground hover:bg-muted transition-colors font-medium flex items-center gap-1.5"
            >
              <SkipForward className="w-3.5 h-3.5" /> Skip Completed
            </button>
            <button
              onClick={() => confirmReprocess('all')}
              className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Re-process All
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active summary
  const activeSummary = completionSummary;
  const activeProcessing = isProcessing;

  if (!activeProcessing && !activeSummary) {
    return null;
  }

  const total = progress?.total || activeSummary?.total || 0;
  const current = progress?.index || activeSummary?.total || 0;
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  const currentFileName = progress?.current_file ? progress.current_file.split(/[\\/]/).pop() : '';
  const hasFailed = activeSummary && activeSummary.failed > 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in select-none">
        <div className="bg-card border border-border rounded-xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col text-card-foreground">
          {/* Modal Header */}
          <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {activeProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin text-primary flex-shrink-0" />
              ) : hasFailed ? (
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-500 flex-shrink-0" />
              ) : (
                <Check className="w-5 h-5 text-emerald-500 dark:text-emerald-400 flex-shrink-0 stroke-[2.5]" />
              )}
              <div>
                <h3 className="font-semibold text-sm text-foreground">
                  {activeProcessing
                    ? 'Converting Images...'
                    : hasFailed
                    ? 'Batch Execution Complete (with Errors)'
                    : 'Batch Execution Complete'}
                </h3>
                <p className="text-xs text-muted-foreground truncate max-w-[260px]">
                  {activeProcessing
                    ? currentFileName ? currentFileName : 'Processing batch...'
                    : `Target: ${outputDir || 'D:\\testing supe'}`}
                </p>
              </div>
            </div>

            {!activeProcessing && (
              <button
                onClick={() => {
                  clearCompletionSummary();
                }}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Modal Body */}
          <div className="p-5 space-y-4">
            {/* Progress Bar & Primary Metric */}
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                {activeProcessing ? (
                  <span className="text-sm font-semibold text-foreground">
                    Processing {current} of {total} files
                  </span>
                ) : hasFailed ? (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-emerald-500">{activeSummary?.success} Succeeded</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="font-semibold text-red-600 dark:text-red-500">{activeSummary?.failed} Failed</span>
                  </div>
                ) : (
                  <span className="text-sm font-semibold text-foreground">
                    {activeSummary?.success || total} files processed successfully
                  </span>
                )}
                <span className="text-xs font-mono text-muted-foreground">{percentage}%</span>
              </div>

              {/* Progress Line */}
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden flex">
                {hasFailed && activeSummary ? (
                  <>
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${(activeSummary.success / activeSummary.total) * 100}%` }}
                    />
                    <div
                      className="h-full bg-red-600 dark:bg-red-500 transition-all duration-300"
                      style={{ width: `${(activeSummary.failed / activeSummary.total) * 100}%` }}
                    />
                  </>
                ) : (
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                )}
              </div>
            </div>

            {/* Error Log Drawer if any failed */}
            {activeSummary && activeSummary.errors.length > 0 && (
              <div className="border border-border/80 rounded-lg bg-muted/20 overflow-hidden text-xs">
                <button
                  onClick={() => setShowErrorsExpanded(!showErrorsExpanded)}
                  className="w-full p-2.5 flex items-center justify-between text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  <span className="flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-500 flex-shrink-0" /> Error Log ({activeSummary.errors.length} files failed)
                  </span>
                  {showErrorsExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>

                {showErrorsExpanded && (
                  <div className="p-3 border-t border-border/60 space-y-1.5 max-h-36 overflow-y-auto font-mono text-[11px] bg-background/50">
                    {activeSummary.errors.map((err, idx) => (
                      <div key={idx} className="p-2 rounded-md bg-card border border-border/70">
                        <p className="font-semibold text-foreground text-xs">{err.file.split(/[\\/]/).pop()}</p>
                        <p className="text-red-600 dark:text-red-400 text-[11px] mt-0.5 font-sans leading-normal">{err.error}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Collapsible Execution Stream */}
            <div className="border border-border/70 rounded-lg overflow-hidden bg-muted/20">
              <button
                onClick={() => setShowLogs(!showLogs)}
                className="w-full p-2 flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="flex items-center gap-1.5 font-mono text-[11px]">
                  <Terminal className="w-3.5 h-3.5 text-primary" /> Log Stream ({batchLogs.length} events)
                </span>
                {showLogs ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {showLogs && (
                <div className="p-3 font-mono text-[11px] h-32 overflow-y-auto space-y-1 border-t border-border/50 bg-background/50">
                  {batchLogs.length === 0 ? (
                    <p className="text-muted-foreground italic">No logs</p>
                  ) : (
                    batchLogs.map((log) => (
                      <div key={log.id} className="flex gap-2 leading-tight">
                        <span className="text-muted-foreground/70 flex-shrink-0">[{log.time}]</span>
                        <span
                          className={
                            log.type === 'error'
                              ? 'text-destructive font-medium'
                              : log.type === 'success'
                              ? 'text-primary'
                              : 'text-muted-foreground'
                          }
                        >
                          {log.message}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-5 py-3 border-t border-border/60 bg-muted/20 flex items-center justify-end gap-2 text-xs">
            {!activeProcessing && (
              <button
                onClick={() => {
                  clearCompletionSummary();
                }}
                className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
  );
};
