import React from 'react';
import { cn } from '../../lib/utils';

/* ============================================
   APPLE CARD COMPONENT
   iOS/macOS Style Card System
   ============================================ */

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        // Apple Card Base
        'rounded-[16px]',              // 16px radius (iOS card standard)
        'bg-card text-card-foreground',
        'border border-border/50',     // Subtle border
        'apple-shadow',                // Minimal shadow
        'transition-all duration-200',
        className
      )}
      {...props}
    />
  )
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col space-y-2',
        'px-5 pt-5 pb-4',             // 20px padding (Apple spacing)
        className
      )}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        'text-[20px] font-semibold',   // 20px Title 3 (Apple)
        'leading-tight tracking-tight',
        'text-foreground',
        className
      )}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn(
        'text-[15px]',                 // 15px Subhead (Apple)
        'text-muted-foreground',
        'leading-relaxed',
        className
      )}
      {...props}
    />
  )
);
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn(
        'px-5 pb-5',                   // Consistent 20px padding
        className
      )} 
      {...props} 
    />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center',
        'px-5 pb-5',
        'border-t border-border/30',   // Optional top border
        'pt-4',
        className
      )}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };


