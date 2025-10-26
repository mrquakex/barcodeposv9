import React from 'react';
import { cn } from '../../lib/utils';

/* ============================================
   APPLE INPUT COMPONENT
   iOS/macOS Filled Input Style
   ============================================ */

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Apple Input Base (Filled Style)
          'flex w-full',
          'h-11',                        // 44px height (iOS standard)
          'px-4 py-3',                   // 16px horizontal, 12px vertical
          'rounded-[10px]',              // 10px radius (iOS standard)
          'border-0',                    // No border (filled style)
          'bg-input',                    // Tertiary background (#E5E5EA light, #2C2C2E dark)
          'text-[17px]',                 // 17px font (iOS body)
          'text-foreground',
          'font-normal',
          'placeholder:text-muted-foreground/50',
          'transition-all duration-200',
          'focus-visible:outline-none',
          'focus-visible:ring-2',
          'focus-visible:ring-primary/20',
          'disabled:cursor-not-allowed',
          'disabled:opacity-40',
          // File input specifics
          'file:border-0',
          'file:bg-transparent',
          'file:text-[15px]',
          'file:font-medium',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export default Input;


