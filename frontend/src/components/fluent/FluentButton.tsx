import React from 'react';
import { cn } from '../../lib/utils';

/* ============================================
   FLUENT BUTTON COMPONENT
   Microsoft Fluent Design System
   ============================================ */

export type FluentButtonAppearance = 'primary' | 'default' | 'subtle' | 'transparent' | 'destructive';
export type FluentButtonSize = 'small' | 'medium' | 'large';

export interface FluentButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  appearance?: FluentButtonAppearance;
  size?: FluentButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'start' | 'end';
  loading?: boolean;
  fullWidth?: boolean;
}

const FluentButton = React.forwardRef<HTMLButtonElement, FluentButtonProps>(
  (
    {
      appearance = 'default',
      size = 'medium',
      icon,
      iconPosition = 'start',
      loading = false,
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = cn(
      'inline-flex items-center justify-center gap-2',
      'font-medium transition-all',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-inset',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'fluent-motion-fast'
    );

    const appearanceStyles = {
      primary: cn(
        'bg-primary text-primary-foreground',
        'hover:bg-primary-hover active:bg-primary-pressed',
        'fluent-depth-4'
      ),
      default: cn(
        'bg-background text-foreground border border-border',
        'hover:bg-background-alt hover:border-border-strong',
        'active:bg-background-tertiary'
      ),
      subtle: cn(
        'bg-transparent text-foreground',
        'hover:bg-background-alt',
        'active:bg-background-tertiary'
      ),
      transparent: cn(
        'bg-transparent text-foreground',
        'hover:bg-background-alt/50',
        'active:bg-background-tertiary/50'
      ),
      destructive: cn(
        'bg-destructive text-destructive-foreground',
        'hover:opacity-90 active:opacity-80',
        'fluent-depth-4'
      ),
    };

    const sizeStyles = {
      small: 'h-7 px-3 text-xs rounded',
      medium: 'h-8 px-4 text-sm rounded',
      large: 'h-10 px-6 text-base rounded-md',
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          appearanceStyles[appearance],
          sizeStyles[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading...
          </>
        ) : (
          <>
            {icon && iconPosition === 'start' && <span className="shrink-0">{icon}</span>}
            {children}
            {icon && iconPosition === 'end' && <span className="shrink-0">{icon}</span>}
          </>
        )}
      </button>
    );
  }
);

FluentButton.displayName = 'FluentButton';

export default FluentButton;

