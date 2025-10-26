import React from 'react';
import toast, { Toaster, Toast as HotToast } from 'react-hot-toast';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';

/* ============================================
   FLUENT TOAST COMPONENT
   Microsoft Fluent Design System
   Uses react-hot-toast with Fluent styling
   ============================================ */

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap = {
  success: 'text-success',
  error: 'text-destructive',
  warning: 'text-warning',
  info: 'text-info',
};

export const FluentToastContainer: React.FC = () => {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'transparent',
          boxShadow: 'none',
          padding: 0,
          margin: 0,
        },
      }}
    >
      {(t) => {
        const type = (t as any).type || 'info';
        const Icon = iconMap[type as keyof typeof iconMap];

        return (
          <div
            className={cn(
              'flex items-start gap-3 p-4 rounded-md bg-card border border-border fluent-depth-16',
              'animate-in slide-in-from-right-full duration-300',
              t.visible ? 'opacity-100' : 'opacity-0'
            )}
          >
            <Icon className={cn('w-5 h-5 shrink-0 mt-0.5', colorMap[type as keyof typeof colorMap])} />
            <div className="flex-1 fluent-body text-foreground pr-4">
              {typeof t.message === 'function' ? t.message(t) : t.message}
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="shrink-0 p-1 rounded hover:bg-background-alt transition-colors"
            >
              <X className="w-4 h-4 text-foreground-secondary" />
            </button>
          </div>
        );
      }}
    </Toaster>
  );
};

// Helper functions
export const fluentToast = {
  success: (message: string) => toast.success(message, { type: 'success' } as any),
  error: (message: string) => toast.error(message, { type: 'error' } as any),
  warning: (message: string) => toast(message, { type: 'warning' } as any),
  info: (message: string) => toast(message, { type: 'info' } as any),
};

export default FluentToastContainer;

