import React from 'react';
import { cn } from '../lib/utils';

/* ============================================
   APPLE LOADING STATE COMPONENTS
   iOS/macOS Style Loading Indicators
   ============================================ */

// Spinner Loading
export const LoadingSpinner: React.FC<{ className?: string; size?: 'sm' | 'md' | 'lg' }> = ({
  className,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-[3px]',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-primary border-t-transparent',
        sizeClasses[size],
        className
      )}
    />
  );
};

// Full Page Loading
export const LoadingPage: React.FC<{ message?: string }> = ({ message = 'Yükleniyor...' }) => {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <LoadingSpinner size="lg" />
      <p className="text-[15px] text-muted-foreground font-medium">{message}</p>
    </div>
  );
};

// Skeleton Loading (Apple Style)
export const Skeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn(
        'animate-pulse rounded-[10px] bg-muted/50',
        className
      )}
    />
  );
};

// Skeleton Card (Common pattern)
export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-card rounded-[16px] border border-border apple-shadow p-5 space-y-4">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
};

// Skeleton Table Row
export const SkeletonTableRow: React.FC = () => {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-border">
      <Skeleton className="h-10 w-10 rounded-[10px]" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-8 w-20" />
    </div>
  );
};

// Skeleton Grid (for products, etc.)
export const SkeletonGrid: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
};

export default LoadingSpinner;

