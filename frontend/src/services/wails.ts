export interface BatchProgress {
  current_file: string;
  index: number;
  total: number;
  success: number;
  failed: number;
  error_msg?: string;
}

export interface ActionDTO {
  index: number;
  type: string;
  params: any;
}

export interface PresetInfo {
  name: string;
  path: string;
}

export interface ExifInfo {
  make: string;
  model: string;
  date_time: string;
  orientation: string;
  iso_speed: string;
  exposure_time: string;
  f_number: string;
}

// Helper to access Wails App methods safely
const getApp = () => (window as any).go?.main?.App;
const getRuntime = () => (window as any).runtime;

export const wailsBridge = {
  selectInputFiles: async (): Promise<string[]> => {
    if (getApp()) {
      const res = await getApp().SelectInputFiles();
      return res || [];
    }
    return [];
  },

  selectFolder: async (): Promise<string> => {
    if (getApp()) return (await getApp().SelectFolder()) || "";
    return "";
  },

  addAction: async (actionType: string, params: any): Promise<void> => {
    if (getApp()) {
      await getApp().AddAction(actionType, JSON.stringify(params));
    }
  },

  updateAction: async (index: number, actionType: string, params: any): Promise<void> => {
    if (getApp()) {
      await getApp().UpdateAction(index, actionType, JSON.stringify(params));
    }
  },

  removeAction: async (index: number): Promise<void> => {
    if (getApp()) await getApp().RemoveAction(index);
  },

  reorderActions: async (fromIndex: number, toIndex: number): Promise<void> => {
    if (getApp()) await getApp().ReorderActions(fromIndex, toIndex);
  },

  clearActions: async (): Promise<void> => {
    if (getApp()) await getApp().ClearActions();
  },

  getActions: async (): Promise<ActionDTO[]> => {
    if (getApp()) {
      const res = await getApp().GetActions();
      return res || [];
    }
    return [];
  },

  getThumbnailPreview: async (filePath: string, actionUpToIndex: number, disabledIndices: number[] = []): Promise<string> => {
    if (getApp()) {
      const safeDisabled = Array.isArray(disabledIndices) ? disabledIndices : [];
      return (await getApp().GetThumbnailPreview(filePath, actionUpToIndex, safeDisabled)) || "";
    }
    return "";
  },

  discoverFolderImages: async (folderPath: string): Promise<string[]> => {
    if (getApp()) return (await getApp().DiscoverFolderImages(folderPath)) || [];
    return [];
  },

  runBatch: async (config: any): Promise<void> => {
    if (getApp()) return await getApp().RunBatch(config);
  },

  savePreset: async (presetName: string): Promise<string> => {
    if (getApp()) return (await getApp().SavePreset(presetName)) || "";
    return "";
  },

  loadPreset: async (presetPath: string): Promise<void> => {
    if (getApp()) await getApp().LoadPreset(presetPath);
  },

  deletePreset: async (presetPath: string): Promise<void> => {
    if (getApp()) await getApp().DeletePreset(presetPath);
  },

  listPresets: async (): Promise<PresetInfo[]> => {
    if (getApp()) {
      const res = await getApp().ListPresets();
      return res || [];
    }
    return [];
  },

  getImageMetadata: async (filePath: string): Promise<ExifInfo | null> => {
    if (getApp()) return await getApp().GetImageMetadata(filePath);
    return null;
  },

  subscribeProgress: (callback: (progress: BatchProgress) => void) => {
    const r = getRuntime();
    if (r && r.EventsOn) {
      r.EventsOn("batch_progress", callback);
    }
  },

  windowMinimise: () => {
    const r = getRuntime();
    if (r && r.WindowMinimise) r.WindowMinimise();
  },

  windowToggleMaximise: () => {
    const r = getRuntime();
    if (r && r.WindowToggleMaximise) r.WindowToggleMaximise();
  },

  windowIsMaximised: async (): Promise<boolean> => {
    const r = getRuntime();
    if (r && r.WindowIsMaximised) {
      return await r.WindowIsMaximised();
    }
    return false;
  },

  windowClose: () => {
    const r = getRuntime();
    if (r && r.Quit) r.Quit();
    else if (r && r.WindowClose) r.WindowClose();
  }
};
