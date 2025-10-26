import React from 'react';
import { cn } from '../../lib/utils';

/* ============================================
   FLUENT BADGE COMPONENT
   Microsoft Fluent Design System
   ============================================ */

export type FluentBadgeAppearance = 'success' | 'warning' | 'error' | 'info' | 'default';
export type FluentBadgeSize = 'small' | 'medium' | 'large';

export interface FluentBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  appearance?: FluentBadgeAppearance;
  size?: FluentBadgeSize;
  dot?: boolean;
}

const FluentBadge = React.forwardRef<HTMLSpanElement, FluentBadgeProps>(
  ({ appearance = 'default', size = 'medium', dot = false, className, children, ...props }, ref) => {
    const appearanceStyles = {
      success: 'bg-success/10 text-success border-success/20',
      warning: 'bg-warning/10 text-warning border-warning/20',
      error: 'bg-destructive/10 text-destructive border-destructive/20',
      info: 'bg-info/10 text-info border-info/20',
      default: 'bg-muted text-muted-foreground border-border',
    };

    const sizeStyles = {
      small: 'text-xs px-1.5 py-0.5 h-5',
      medium: 'text-xs px-2 py-1 h-6',
      large: 'text-sm px-2.5 py-1 h-7',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-1',
          'font-medium rounded-full border',
          'whitespace-nowrap',
          appearanceStyles[appearance],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
        {children}
      </span>
    );
  }
);

FluentBadge.displayName = 'FluentBadge';

export default FluentBadge;

