import React from 'react';
import { cn } from '../../lib/utils';

/* ============================================
   FLUENT CARD COMPONENT
   Microsoft Fluent Design System
   ============================================ */

export type FluentCardVariant = 'elevated' | 'filled' | 'outlined';
export type FluentCardDepth = 'depth-4' | 'depth-8' | 'depth-16';

export interface FluentCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: FluentCardVariant;
  depth?: FluentCardDepth;
  hoverable?: boolean;
  clickable?: boolean;
}

export const FluentCard = React.forwardRef<HTMLDivElement, FluentCardProps>(
  ({ variant = 'elevated', depth = 'depth-4', hoverable = false, clickable = false, className, ...restProps }, ref) => {
    const variantStyles = {
      elevated: cn('bg-card', `fluent-${depth}`),
      filled: 'bg-background-alt',
      outlined: 'bg-card border border-border',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-md',
          variantStyles[variant],
          hoverable && 'hover:fluent-depth-8 transition-shadow fluent-motion-normal',
          clickable && 'cursor-pointer active:fluent-depth-4',
          className
        )}
        {...restProps}
      />
    );
  }
);

FluentCard.displayName = 'FluentCard';

export const FluentCardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-5 pb-3', className)} {...props} />
  )
);

FluentCardHeader.displayName = 'FluentCardHeader';

export const FluentCardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('fluent-subtitle text-foreground', className)} {...props} />
  )
);

FluentCardTitle.displayName = 'FluentCardTitle';

export const FluentCardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-5 pt-0', className)} {...props} />
  )
);

FluentCardContent.displayName = 'FluentCardContent';

export const FluentCardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-5 pt-0', className)} {...props} />
  )
);

FluentCardFooter.displayName = 'FluentCardFooter';

export default FluentCard;
