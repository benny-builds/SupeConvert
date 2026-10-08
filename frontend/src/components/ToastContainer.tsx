import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useAppStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none select-none">
      {toasts.map((toast) => {
        let Icon = Info;
        let iconColor = 'text-primary';

        if (toast.type === 'success') {
          Icon = CheckCircle2;
          iconColor = 'text-primary';
        } else if (toast.type === 'warning') {
          Icon = AlertTriangle;
          iconColor = 'text-amber-400';
        } else if (toast.type === 'error') {
          Icon = XCircle;
          iconColor = 'text-red-400';
        }

        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center justify-between p-3.5 rounded-xl border border-border bg-card text-card-foreground shadow-md backdrop-blur-md animate-slide-up transition-all"
          >
            <div className="flex items-center gap-3 pr-2">
              <Icon className={`w-4 h-4 flex-shrink-0 ${iconColor}`} />
              <span className="text-xs font-medium leading-relaxed text-foreground">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
