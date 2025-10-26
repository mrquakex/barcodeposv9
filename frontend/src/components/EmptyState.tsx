import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import Button from './ui/Button';

/* ============================================
   APPLE EMPTY STATE COMPONENT
   iOS/macOS Style Empty State
   ============================================ */

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4', className)}>
      {/* Icon */}
      <div className="mb-6 p-6 rounded-[20px] bg-muted/30">
        <Icon className="w-12 h-12 text-muted-foreground/40" strokeWidth={1.5} />
      </div>

      {/* Title */}
      <h3 className="text-[20px] font-semibold text-foreground mb-2 tracking-tight">
        {title}
      </h3>

      {/* Description */}
      <p className="text-[15px] text-muted-foreground text-center max-w-md mb-6">
        {description}
      </p>

      {/* Action Button */}
      {actionLabel && onAction && (
        <Button variant="filled" size="default" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;

