import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { ActionCard } from './ActionCard';
import { AddActionPopover } from './AddActionPopover';
import { Layers, Trash2, Workflow } from 'lucide-react';

export const ActionQueue: React.FC = () => {
  const { actions, clearActions } = useAppStore();

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-lg shadow-sm overflow-hidden text-card-foreground">
      {/* Header */}
      <div className="p-3.5 border-b border-border bg-muted/30 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Workflow className="w-4 h-4 text-foreground" />
          <h2 className="font-semibold text-sm text-foreground">Pipeline Builder</h2>
          <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono text-xs border border-border">
            {actions.length} {actions.length === 1 ? 'step' : 'steps'}
          </span>
        </div>

        {actions.length > 0 && (
          <button
            onClick={clearActions}
            className="text-muted-foreground hover:text-destructive text-xs flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-destructive/10"
            title="Clear all pipeline steps"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear Pipeline
          </button>
        )}
      </div>

      {/* Body: Action list & Add trigger */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* Searchable Command Palette Popover Add Trigger */}
        <AddActionPopover />

        {/* Pipeline Step List */}
        {actions.length === 0 ? (
          <div className="min-h-[220px] flex flex-col items-center justify-center border border-dashed border-border rounded-md p-6 text-center bg-muted/10">
            <div className="w-12 h-12 rounded-lg bg-muted text-foreground flex items-center justify-center mb-3">
              <Layers className="w-6 h-6" />
            </div>
            <h4 className="font-semibold text-xs text-foreground mb-1">
              Pipeline is empty
            </h4>
            <p className="text-muted-foreground text-[11px] max-w-xs leading-relaxed">
              Click the button above to add transformation steps like Resize, Rotate, Watermark, or Format Conversion.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {actions.map((act, i) => (
              <ActionCard key={act.index} action={act} isFirst={i === 0} isLast={i === actions.length - 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
