import { create } from 'zustand';
import type { ActionDTO, BatchProgress, PresetInfo, ExifInfo } from '../services/wails';
import { wailsBridge } from '../services/wails';

export interface FileItemStatus {
  path: string;
  name: string;
  status: 'queued' | 'processing' | 'done' | 'error';
  error?: string;
}

export interface ToastItem {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
}

export interface LogEntry {
  id: string;
  time: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface AppState {
  // Theme
  theme: 'dark' | 'light';
  toggleTheme: () => void;

  // File Management
  files: string[];
  selectedFile: string | null;
  selectedFiles: string[];
  fileStatuses: Record<string, FileItemStatus>;
  
  // Pipeline Actions
  actions: ActionDTO[];
  disabledActionIndices: number[];

  // Output Config
  outputDir: string;
  targetFormat: string;
  quality: number;
  namingPattern: string;
  workers: number;

  // Batch Execution State
  isProcessing: boolean;
  progress: BatchProgress | null;
  batchLogs: LogEntry[];
  completionSummary: {
    total: number;
    success: number;
    failed: number;
    errors: { file: string; error: string }[];
  } | null;
  reprocessPrompt: {
    open: boolean;
    doneCount: number;
    totalCount: number;
    filesToProcess: string[];
  } | null;

  // Preview & Metadata
  beforePreview: string | null;
  afterPreview: string | null;
  metadata: ExifInfo | null;

  // Presets & UI Navigation
  presets: PresetInfo[];
  activeTab: 'workspace' | 'files' | 'actions' | 'preview' | 'output' | 'presets';
  toasts: ToastItem[];

  lastPivotIndex: number | null;

  // File Mutators
  setFiles: (files: string[]) => void;
  addFiles: (newFiles: string[]) => void;
  removeFile: (filePath: string) => void;
  removeSelectedFiles: () => void;
  clearFiles: () => void;
  setSelectedFile: (file: string | null) => void;
  setSelectedFiles: (files: string[]) => void;
  toggleFileSelection: (filePath: string, isMulti: boolean) => void;
  handleFileClickWithModifiers: (filePath: string, index: number, e: { shiftKey: boolean; ctrlKey: boolean; metaKey: boolean }) => void;

  // Config Mutators
  setOutputDir: (dir: string) => void;
  setTargetFormat: (format: string) => void;
  setQuality: (quality: number) => void;
  setNamingPattern: (pattern: string) => void;
  setWorkers: (workers: number) => void;
  setActiveTab: (tab: 'workspace' | 'files' | 'actions' | 'preview' | 'output' | 'presets') => void;

  // Toast System
  addToast: (message: string, type?: ToastItem['type']) => void;
  removeToast: (id: string) => void;

  // Pipeline Mutators
  refreshActions: () => Promise<void>;
  addAction: (type: string, params: any) => Promise<void>;
  updateAction: (index: number, type: string, params: any) => Promise<void>;
  removeAction: (index: number) => Promise<void>;
  reorderActions: (from: number, to: number) => Promise<void>;
  clearActions: () => Promise<void>;
  toggleActionDisabled: (index: number) => void;
  
  // Preview Mutator
  updatePreviews: () => Promise<void>;
  
  // Batch Execution
  runBatch: (explicitFiles?: string[], forceProceed?: boolean) => Promise<void>;
  confirmReprocess: (mode: 'all' | 'skip_done') => void;
  cancelReprocess: () => void;
  clearCompletionSummary: () => void;

  // Presets
  refreshPresets: () => Promise<void>;
  savePreset: (name: string) => Promise<void>;
  loadPreset: (path: string) => Promise<void>;
  deletePreset: (path: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  theme: (typeof window !== 'undefined' && (localStorage.getItem('supeconvert_theme') as 'dark' | 'light')) || 'dark',
  toggleTheme: () => {
    const newTheme = get().theme === 'dark' ? 'light' : 'dark';
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('supeconvert_theme', newTheme);
    } catch (e) {
      // ignore
    }
    set({ theme: newTheme });
  },

  files: [],
  selectedFile: null,
  selectedFiles: [],
  fileStatuses: {},

  actions: [],
  disabledActionIndices: [],

  outputDir: '',
  targetFormat: 'jpg',
  quality: 85,
  namingPattern: '{name}_{w}x{h}.{ext}',
  workers: 4,

  isProcessing: false,
  progress: null,
  batchLogs: [],
  completionSummary: null,

  beforePreview: null,
  afterPreview: null,
  metadata: null,

  presets: [],
  activeTab: 'workspace',
  toasts: [],

  addToast: (message, type = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      get().removeToast(id);
    }, 4000);
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },

  setFiles: (files) => {
    const fileStatuses: Record<string, FileItemStatus> = {};
    files.forEach((f) => {
      fileStatuses[f] = { path: f, name: f.split(/[\\/]/).pop() || f, status: 'queued' };
    });
    set({
      files,
      selectedFile: files.length > 0 ? files[0] : null,
      selectedFiles: files.length > 0 ? [files[0]] : [],
      fileStatuses,
    });
    get().updatePreviews();
  },

  addFiles: (newFiles) => {
    const existing = new Set(get().files);
    const combined = [...get().files];
    const statuses = { ...get().fileStatuses };

    let addedCount = 0;
    for (const f of newFiles) {
      if (!existing.has(f)) {
        combined.push(f);
        statuses[f] = { path: f, name: f.split(/[\\/]/).pop() || f, status: 'queued' };
        addedCount++;
      }
    }

    const firstSelected = get().selectedFile || combined[0] || null;
    set({
      files: combined,
      selectedFile: firstSelected,
      selectedFiles: get().selectedFiles.length > 0 ? get().selectedFiles : (firstSelected ? [firstSelected] : []),
      fileStatuses: statuses,
    });

    if (addedCount > 0) {
      get().addToast(`Added ${addedCount} file${addedCount > 1 ? 's' : ''} to workspace`, 'success');
    }
    get().updatePreviews();
  },

  removeFile: (filePath) => {
    const filtered = get().files.filter((f) => f !== filePath);
    const selected = get().selectedFile === filePath ? (filtered[0] || null) : get().selectedFile;
    const selectedMulti = get().selectedFiles.filter((f) => f !== filePath);
    const statuses = { ...get().fileStatuses };
    delete statuses[filePath];

    set({
      files: filtered,
      selectedFile: selected,
      selectedFiles: selectedMulti.length > 0 ? selectedMulti : (selected ? [selected] : []),
      fileStatuses: statuses,
    });
    get().updatePreviews();
  },

  removeSelectedFiles: () => {
    const toRemove = new Set(get().selectedFiles);
    if (toRemove.size === 0) return;

    const filtered = get().files.filter((f) => !toRemove.has(f));
    const statuses = { ...get().fileStatuses };
    toRemove.forEach((f) => delete statuses[f]);

    set({
      files: filtered,
      selectedFile: filtered[0] || null,
      selectedFiles: filtered[0] ? [filtered[0]] : [],
      fileStatuses: statuses,
    });
    get().addToast(`Removed ${toRemove.size} selected file${toRemove.size > 1 ? 's' : ''}`, 'info');
    get().updatePreviews();
  },

  clearFiles: () => {
    set({
      files: [],
      selectedFile: null,
      selectedFiles: [],
      fileStatuses: {},
      beforePreview: null,
      afterPreview: null,
      metadata: null,
    });
    get().addToast('Cleared all files from workspace', 'info');
  },

  lastPivotIndex: null,

  setSelectedFile: (file) => {
    const idx = get().files.indexOf(file || '');
    set({ selectedFile: file, selectedFiles: file ? [file] : [], lastPivotIndex: idx >= 0 ? idx : null });
    get().updatePreviews();
  },

  setSelectedFiles: (files) => {
    const firstIdx = get().files.indexOf(files[0] || '');
    set({ selectedFiles: files, selectedFile: files[0] || null, lastPivotIndex: firstIdx >= 0 ? firstIdx : null });
    if (files[0]) get().updatePreviews();
  },

  toggleFileSelection: (filePath, isMulti) => {
    const current = get().selectedFiles;
    if (isMulti) {
      if (current.includes(filePath)) {
        const next = current.filter((f) => f !== filePath);
        set({ selectedFiles: next, selectedFile: next[0] || null });
      } else {
        const next = [...current, filePath];
        set({ selectedFiles: next, selectedFile: filePath });
      }
    } else {
      set({ selectedFiles: [filePath], selectedFile: filePath });
    }
    get().updatePreviews();
  },

  handleFileClickWithModifiers: (filePath, index, e) => {
    const { files, selectedFiles, lastPivotIndex } = get();
    const isCtrl = e.ctrlKey || e.metaKey;
    const isShift = e.shiftKey;

    if (isShift && lastPivotIndex !== null) {
      const start = Math.min(lastPivotIndex, index);
      const end = Math.max(lastPivotIndex, index);
      const range = files.slice(start, end + 1);

      if (isCtrl) {
        // Ctrl + Shift: Add range to existing selection
        const combined = Array.from(new Set([...selectedFiles, ...range]));
        set({ selectedFiles: combined, selectedFile: filePath });
      } else {
        // Shift: Replace selection with contiguous range
        set({ selectedFiles: range, selectedFile: filePath });
      }
    } else if (isCtrl) {
      // Ctrl: Toggle single item
      let next: string[];
      if (selectedFiles.includes(filePath)) {
        next = selectedFiles.filter((f) => f !== filePath);
      } else {
        next = [...selectedFiles, filePath];
      }
      set({
        selectedFiles: next,
        selectedFile: next.length > 0 ? filePath : null,
        lastPivotIndex: index,
      });
    } else {
      // Normal click: Select single item
      set({
        selectedFiles: [filePath],
        selectedFile: filePath,
        lastPivotIndex: index,
      });
    }
    get().updatePreviews();
  },

  setOutputDir: (outputDir) => set({ outputDir }),
  setTargetFormat: (targetFormat) => set({ targetFormat }),
  setQuality: (quality) => set({ quality }),
  setNamingPattern: (namingPattern) => set({ namingPattern }),
  setWorkers: (workers) => set({ workers }),
  setActiveTab: (activeTab) => set({ activeTab }),

  toggleActionDisabled: (index) => {
    const disabled = [...get().disabledActionIndices];
    const idx = disabled.indexOf(index);
    if (idx >= 0) {
      disabled.splice(idx, 1);
    } else {
      disabled.push(index);
    }
    set({ disabledActionIndices: disabled });
    get().updatePreviews();
  },

  refreshActions: async () => {
    const actions = (await wailsBridge.getActions()) || [];
    set({ actions });
    get().updatePreviews();
  },

  addAction: async (type, params) => {
    await wailsBridge.addAction(type, params);
    get().addToast(`Added ${type} action to pipeline`, 'success');
    await get().refreshActions();
  },

  updateAction: async (index, type, params) => {
    await wailsBridge.updateAction(index, type, params);
    get().addToast(`Updated ${type} action`, 'success');
    await get().refreshActions();
  },

  removeAction: async (index) => {
    await wailsBridge.removeAction(index);
    get().addToast('Removed action from pipeline', 'info');
    await get().refreshActions();
  },

  reorderActions: async (from, to) => {
    await wailsBridge.reorderActions(from, to);
    await get().refreshActions();
  },

  clearActions: async () => {
    await wailsBridge.clearActions();
    set({ disabledActionIndices: [] });
    get().addToast('Cleared pipeline actions', 'info');
    await get().refreshActions();
  },

  updatePreviews: async () => {
    const selected = get().selectedFile;
    if (!selected) {
      set({ beforePreview: null, afterPreview: null, metadata: null });
      return;
    }

    const disabled = get().disabledActionIndices || [];
    const actionsCount = (get().actions || []).length;

    try {
      const before = await wailsBridge.getThumbnailPreview(selected, -1, disabled);
      const after = actionsCount > 0 
        ? await wailsBridge.getThumbnailPreview(selected, actionsCount - 1, disabled)
        : before;

      set({
        beforePreview: before || null,
        afterPreview: (after || before || null),
      });
    } catch (e) {
      console.error('Failed thumbnail preview load', e);
    }

    try {
      const meta = await wailsBridge.getImageMetadata(selected);
      set({ metadata: meta || null });
    } catch (e) {
      set({ metadata: null });
    }
  },

  reprocessPrompt: null,

  runBatch: async (explicitFiles, forceProceed) => {
    const state = get();
    const targetFiles = explicitFiles || state.files;

    if (targetFiles.length === 0) {
      state.addToast('No files to process', 'warning');
      return;
    }
    if (!state.outputDir) {
      state.addToast('Please select a destination folder first', 'warning');
      return;
    }

    // Check if any files to process have already completed status
    const doneFiles = targetFiles.filter((f) => state.fileStatuses[f]?.status === 'done');
    if (doneFiles.length > 0 && !forceProceed) {
      set({
        reprocessPrompt: {
          open: true,
          doneCount: doneFiles.length,
          totalCount: targetFiles.length,
          filesToProcess: targetFiles,
        },
      });
      return;
    }

    // Reset status maps
    const initialStatuses: Record<string, FileItemStatus> = { ...state.fileStatuses };
    targetFiles.forEach((f) => {
      initialStatuses[f] = { path: f, name: f.split(/[\\/]/).pop() || f, status: 'queued' };
    });

    const now = new Date().toLocaleTimeString();
    set({
      isProcessing: true,
      fileStatuses: initialStatuses,
      completionSummary: null,
      batchLogs: [{ id: '1', time: now, message: `Batch process started (${targetFiles.length} files)`, type: 'info' }],
      progress: { current_file: '', index: 0, total: targetFiles.length, success: 0, failed: 0 },
      reprocessPrompt: null,
    });

    const errorList: { file: string; error: string }[] = [];

    wailsBridge.subscribeProgress((p) => {
      const logTime = new Date().toLocaleTimeString();
      const currentLogMsg = p.current_file ? `Processing: ${p.current_file.split(/[\\/]/).pop()}` : 'Batch progressing...';
      
      set((s) => {
        const statuses = { ...s.fileStatuses };
        if (p.current_file) {
          statuses[p.current_file] = {
            path: p.current_file,
            name: p.current_file.split(/[\\/]/).pop() || p.current_file,
            status: p.error_msg ? 'error' : 'done',
            error: p.error_msg,
          };
          if (p.error_msg) {
            errorList.push({ file: p.current_file, error: p.error_msg });
          }
        }
        return {
          progress: p,
          fileStatuses: statuses,
          batchLogs: [
            ...s.batchLogs.slice(-100),
            { id: Math.random().toString(), time: logTime, message: currentLogMsg, type: p.error_msg ? 'error' : 'info' }
          ]
        };
      });
    });

    try {
      await wailsBridge.runBatch({
        input_paths: targetFiles,
        output_dir: state.outputDir,
        target_format: state.targetFormat,
        quality: state.quality,
        naming_pattern: state.namingPattern,
        workers: state.workers,
        disabled_indices: state.disabledActionIndices,
      });

      const finalProgress = get().progress;
      const totalCount = targetFiles.length;
      const succ = finalProgress?.success || totalCount - errorList.length;
      const fail = finalProgress?.failed || errorList.length;

      set((s) => ({
        progress: { current_file: '', index: totalCount, total: totalCount, success: succ, failed: fail },
        completionSummary: {
          total: totalCount,
          success: succ,
          failed: fail,
          errors: errorList,
        },
        batchLogs: [
          ...s.batchLogs,
          { id: Math.random().toString(), time: new Date().toLocaleTimeString(), message: `Batch finished. Succeeded: ${succ}, Failed: ${fail}`, type: fail > 0 ? 'warning' : 'success' }
        ]
      }));

      get().addToast(`Batch complete: ${succ} succeeded, ${fail} failed`, fail > 0 ? 'warning' : 'success');
    } catch (err: any) {
      console.error('Batch failed', err);
      get().addToast(`Batch failed: ${err?.message || err}`, 'error');
    } finally {
      set({ isProcessing: false });
    }
  },

  confirmReprocess: (mode) => {
    const prompt = get().reprocessPrompt;
    if (!prompt) return;

    if (mode === 'all') {
      get().runBatch(prompt.filesToProcess, true);
    } else {
      const pending = prompt.filesToProcess.filter((f) => get().fileStatuses[f]?.status !== 'done');
      if (pending.length === 0) {
        set({ reprocessPrompt: null });
        get().addToast('All selected files are already completed.', 'info');
      } else {
        get().runBatch(pending, true);
      }
    }
  },

  cancelReprocess: () => set({ reprocessPrompt: null }),

  clearCompletionSummary: () => set({ completionSummary: null }),

  refreshPresets: async () => {
    const presets = (await wailsBridge.listPresets()) || [];
    set({ presets });
  },

  savePreset: async (name) => {
    await wailsBridge.savePreset(name);
    get().addToast(`Preset "${name}" saved!`, 'success');
    await get().refreshPresets();
  },

  loadPreset: async (path) => {
    await wailsBridge.loadPreset(path);
    const presetName = path.split(/[\\/]/).pop()?.replace('.json', '') || 'Preset';
    get().addToast(`Loaded preset "${presetName}"`, 'success');
    await get().refreshActions();
  },

  deletePreset: async (path) => {
    await wailsBridge.deletePreset(path);
    const presetName = path.split(/[\\/]/).pop()?.replace('.json', '') || 'Preset';
    get().addToast(`Deleted preset "${presetName}"`, 'info');
    await get().refreshPresets();
  },
}));
