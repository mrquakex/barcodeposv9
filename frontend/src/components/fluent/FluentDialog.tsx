import React, { useEffect } from 'react';
import { cn } from '../../lib/utils';
import { X } from 'lucide-react';
import FluentButton from './FluentButton';

/* ============================================
   FLUENT DIALOG COMPONENT
   Microsoft Fluent Design System
   ============================================ */

export interface FluentDialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  size?: 'small' | 'medium' | 'large' | 'full';
  showClose?: boolean;
}

const FluentDialog: React.FC<FluentDialogProps> = ({
  open,
  onClose,
  title,
  children,
  actions,
  size = 'medium',
  showClose = true,
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  if (!open) return null;

  const sizeStyles = {
    small: 'max-w-md',
    medium: 'max-w-2xl',
    large: 'max-w-4xl',
    full: 'max-w-7xl mx-4',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={cn(
            'relative w-full bg-card rounded-md fluent-depth-64',
            'animate-in fade-in zoom-in-95 duration-200',
            sizeStyles[size]
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {(title || showClose) && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              {title && <h2 className="fluent-title text-foreground">{title}</h2>}
              {showClose && (
                <button
                  onClick={onClose}
                  className="ml-auto p-1.5 rounded hover:bg-background-alt transition-colors"
                >
                  <X className="w-5 h-5 text-foreground-secondary" />
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className="px-6 py-4 max-h-[calc(100vh-16rem)] overflow-y-auto fluent-scrollbar">
            {children}
          </div>

          {/* Actions */}
          {actions && (
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FluentDialog;

