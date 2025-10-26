import React from 'react';
import { cn } from '../../lib/utils';

/* ============================================
   FLUENT SPINNER COMPONENT
   Microsoft Fluent Design System
   ============================================ */

export type FluentSpinnerSize = 'tiny' | 'small' | 'medium' | 'large';

export interface FluentSpinnerProps {
  size?: FluentSpinnerSize;
  label?: string;
  overlay?: boolean;
  className?: string;
}

const FluentSpinner: React.FC<FluentSpinnerProps> = ({
  size = 'medium',
  label,
  overlay = false,
  className,
}) => {
  const sizeStyles = {
    tiny: 'w-3 h-3 border-2',
    small: 'w-4 h-4 border-2',
    medium: 'w-6 h-6 border-2',
    large: 'w-8 h-8 border-[3px]',
  };

  const spinner = (
    <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-primary border-t-transparent',
          sizeStyles[size]
        )}
      />
      {label && <p className="fluent-body-small text-foreground-secondary">{label}</p>}
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default FluentSpinner;

