import React from 'react';
import { Capacitor } from '@capacitor/core';
import { cn } from '../../lib/utils';

/**
 * 📱 MOBILE WRAPPER
 * Detects if running in Capacitor (native app) and applies mobile-specific styling
 */

interface MobileWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export const MobileWrapper: React.FC<MobileWrapperProps> = ({ children, className }) => {
  const isNative = Capacitor.isNativePlatform();
  
  return (
    <div className={cn(
      'min-h-screen',
      isNative && 'mobile-app-wrapper',
      className
    )}>
      {/* Status Bar Spacer for iOS */}
      {isNative && (
        <div className="h-safe-top bg-primary" />
      )}
      
      {children}
      
      {/* Bottom Safe Area for iPhone */}
      {isNative && (
        <div className="h-safe-bottom bg-background" />
      )}
    </div>
  );
};

// Check if we're in mobile app
export const isMobileApp = () => Capacitor.isNativePlatform();

// Check if we're on mobile browser (not app)
export const isMobileBrowser = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

