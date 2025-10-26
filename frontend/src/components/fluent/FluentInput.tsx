import React from 'react';
import { cn } from '../../lib/utils';

/* ============================================
   FLUENT INPUT COMPONENT
   Microsoft Fluent Design System
   ============================================ */

export type FluentInputVariant = 'underlined' | 'filled' | 'outlined';

export interface FluentInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: FluentInputVariant;
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  iconPosition?: 'start' | 'end';
}

const FluentInput = React.forwardRef<HTMLInputElement, FluentInputProps>(
  (
    {
      variant = 'filled',
      label,
      error,
      icon,
      iconPosition = 'start',
      className,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    const variantStyles = {
      underlined: cn(
        'border-0 border-b-2 border-border bg-transparent rounded-none',
        'focus:border-primary focus:ring-0'
      ),
      filled: cn(
        'border-0 bg-input rounded',
        'focus:bg-background focus:ring-2 focus:ring-primary focus:ring-offset-0'
      ),
      outlined: cn(
        'border border-border bg-background rounded',
        'focus:border-primary focus:ring-2 focus:ring-primary'
      ),
    };

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="fluent-body-small text-foreground-secondary block mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && iconPosition === 'start' && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-secondary">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full h-8 px-3 fluent-body text-foreground',
              'transition-all fluent-motion-fast',
              'placeholder:text-foreground-tertiary',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'focus:outline-none',
              icon && iconPosition === 'start' && 'pl-10',
              icon && iconPosition === 'end' && 'pr-10',
              error && 'border-destructive focus:border-destructive focus:ring-destructive',
              variantStyles[variant],
              className
            )}
            {...props}
          />
          {icon && iconPosition === 'end' && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-secondary">
              {icon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 fluent-caption text-destructive">{error}</p>
        )}
      </div>
    );
  }
);

FluentInput.displayName = 'FluentInput';

export default FluentInput;

