import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Bookmark, Save, Download, RefreshCw, FileJson, Sparkles, Trash2 } from 'lucide-react';

export const PresetManager: React.FC = () => {
  const { presets, refreshPresets, savePreset, loadPreset, deletePreset, actions } = useAppStore();
  const [presetName, setPresetName] = useState('');

  useEffect(() => {
    refreshPresets();
  }, []);

  const handleSave = async () => {
    if (!presetName.trim()) return;
    await savePreset(presetName.trim());
    setPresetName('');
  };

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-lg shadow-sm overflow-hidden text-card-foreground">
      <div className="p-3.5 border-b border-border bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-sm text-foreground">Pipeline Presets</h2>
        </div>
        <button
          onClick={() => refreshPresets()}
          className="shadcn-btn-icon"
          title="Refresh Preset List"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Save Current Pipeline Preset Card */}
        <div className="bg-muted/20 border border-border rounded-md p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-xs text-foreground flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary" /> Save Current Pipeline as Preset
            </label>
            <span className="text-xs font-mono text-muted-foreground">
              {actions.length} {actions.length === 1 ? 'action' : 'actions'}
            </span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Web Optimizer 1080p, Thumbnail Batch..."
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              className="shadcn-input flex-1"
            />
            <button
              disabled={!presetName.trim() || actions.length === 0}
              onClick={handleSave}
              className="shadcn-btn-primary flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" /> Save Preset
            </button>
          </div>
        </div>

        {/* Preset List */}
        <div className="space-y-2.5">
          <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
            Available Presets ({presets.length})
          </h3>

          {presets.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground border border-dashed border-border rounded-md bg-muted/10 text-xs">
              No saved presets found in presets folder.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {presets.map((preset) => (
                <div
                  key={preset.path}
                  className="p-3.5 rounded-md bg-muted/20 border border-border hover:border-primary/40 flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <FileJson className="w-5 h-5 text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <h4 className="font-semibold text-xs text-foreground truncate">{preset.name}</h4>
                      <p className="text-[10px] font-mono text-muted-foreground truncate">{preset.path.split(/[\\/]/).pop()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => loadPreset(preset.path)}
                      className="shadcn-btn-secondary h-7 px-2.5 text-xs flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" /> Load
                    </button>
                    <button
                      onClick={() => deletePreset(preset.path)}
                      className="p-1.5 rounded-md bg-muted text-muted-foreground hover:bg-destructive hover:text-white transition-colors"
                      title="Delete preset"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
