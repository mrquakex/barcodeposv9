import React from 'react';
import { cn } from '../../lib/utils';

/* ============================================
   APPLE BUTTON COMPONENT
   iOS/macOS Style Button System
   ============================================ */

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'filled' | 'tinted' | 'plain' | 'outline' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'filled', size = 'default', ...props }, ref) => {
    // Apple Button Variants
    const variantClasses = {
      // Filled (Primary) - iOS Blue solid
      filled: 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80 apple-shadow',
      
      // Tinted (Secondary) - iOS Blue 10% background
      tinted: 'bg-primary/10 text-primary hover:bg-primary/15 active:bg-primary/20',
      
      // Plain (Tertiary) - Transparent
      plain: 'text-primary hover:bg-primary/5 active:bg-primary/10',
      
      // Outline - Border style
      outline: 'border border-border bg-background text-foreground hover:bg-muted active:bg-muted/80',
      
      // Destructive - iOS Red
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80 apple-shadow',
    };

    // Apple Button Sizes (iOS Standard: 44px)
    const sizeClasses = {
      default: 'h-11 px-5 text-[17px]',      // 44px height - iOS standard
      sm: 'h-9 px-4 text-[15px]',            // 36px height - compact
      lg: 'h-12 px-6 text-[17px]',           // 48px height - prominent
      icon: 'h-11 w-11',                     // Square button
    };

    return (
      <button
        className={cn(
          // Base styles (Apple)
          'inline-flex items-center justify-center gap-2',
          'whitespace-nowrap rounded-[10px]',
          'font-semibold tracking-tight',
          'transition-all',
          'duration-200 ease-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-40',
          'active:scale-[0.98]',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button };
export default Button;


