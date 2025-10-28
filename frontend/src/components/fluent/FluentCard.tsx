import React from 'react';
import { cn } from '../../lib/utils';

/* ============================================
   FLUENT 2 CARD COMPONENT
   Windows 11 Modern Design - Acrylic & Elevation
   ============================================ */

export type FluentCardVariant = 'elevated' | 'filled' | 'outlined' | 'acrylic';
export type FluentCardDepth = 'depth-2' | 'depth-4' | 'depth-8' | 'depth-16';

export interface FluentCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: FluentCardVariant;
  depth?: FluentCardDepth;
  hoverable?: boolean;
  clickable?: boolean;
}

export const FluentCard = React.forwardRef<HTMLDivElement, FluentCardProps>(
  ({ variant = 'elevated', depth = 'depth-4', hoverable = false, clickable = false, className, ...restProps }, ref) => {
    const variantStyles = {
      elevated: cn('bg-card border border-border/50', `fluent-${depth}`),
      filled: 'bg-background-alt border border-border/30',
      outlined: 'bg-card border-2 border-border',
      acrylic: 'fluent-acrylic fluent-depth-8',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl', // 🔘 More rounded (16px)
          'overflow-hidden',
          variantStyles[variant],
          'transition-all duration-250',
          hoverable && 'hover:fluent-depth-16 hover:-translate-y-1 hover:border-border-strong',
          clickable && 'cursor-pointer active:scale-[0.98]',
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
    <div ref={ref} className={cn('flex flex-col space-y-2 p-6 pb-4', className)} {...props} />
  )
);

FluentCardHeader.displayName = 'FluentCardHeader';

export const FluentCardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-xl font-semibold text-foreground tracking-tight', className)} {...props} />
  )
);

FluentCardTitle.displayName = 'FluentCardTitle';

export const FluentCardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-foreground-secondary', className)} {...props} />
  )
);

FluentCardDescription.displayName = 'FluentCardDescription';

export const FluentCardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);

FluentCardContent.displayName = 'FluentCardContent';

export const FluentCardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center gap-3 p-6 pt-0', className)} {...props} />
  )
);

FluentCardFooter.displayName = 'FluentCardFooter';

export default FluentCard;
