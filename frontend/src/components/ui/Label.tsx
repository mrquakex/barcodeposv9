import React from 'react';
import { cn } from '../../lib/utils';

/* ============================================
   APPLE LABEL COMPONENT
   iOS/macOS Label Style
   ============================================ */

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        'text-[15px]',                 // 15px Subhead (Apple)
        'font-medium',
        'text-foreground',
        'leading-tight',
        'mb-2',
        'inline-block',
        'peer-disabled:cursor-not-allowed',
        'peer-disabled:opacity-40',
        className
      )}
      {...props}
    />
  )
);

Label.displayName = 'Label';

export default Label;


