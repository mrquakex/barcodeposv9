import React from 'react';

interface SkeletonProps {
  variant?: 'text' | 'rectangle' | 'circle' | 'product-card';
  width?: string;
  height?: string;
  count?: number;
}

const LoadingSkeleton: React.FC<SkeletonProps> = ({ 
  variant = 'text', 
  width, 
  height, 
  count = 1 
}) => {
  const renderSkeleton = () => {
    switch (variant) {
      case 'circle':
        return <div className="skeleton skeleton-circle" style={{ width, height }} />;
      
      case 'rectangle':
        return <div className="skeleton skeleton-rect" style={{ width, height }} />;
      
      case 'product-card':
        return (
          <div className="skeleton-product-card">
            <div className="skeleton skeleton-rect" style={{ height: '80px' }} />
            <div className="skeleton skeleton-text" style={{ width: '80%' }} />
            <div className="skeleton skeleton-text" style={{ width: '40%' }} />
          </div>
        );
      
      case 'text':
      default:
        return <div className="skeleton skeleton-text" style={{ width, height }} />;
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <React.Fragment key={index}>
          {renderSkeleton()}
        </React.Fragment>
      ))}
    </>
  );
};

export default LoadingSkeleton;

