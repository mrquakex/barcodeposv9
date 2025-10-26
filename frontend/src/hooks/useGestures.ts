import { useGesture } from '@use-gesture/react';
import { useRef } from 'react';
import toast from 'react-hot-toast';

interface GestureConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinch?: (scale: number) => void;
}

export function useGestures(config: GestureConfig) {
  const targetRef = useRef<HTMLDivElement>(null);

  const bind = useGesture(
    {
      onDrag: ({ movement: [mx, my], last }) => {
        if (!last) return;

        const threshold = 100;

        // Horizontal swipe
        if (Math.abs(mx) > Math.abs(my)) {
          if (mx > threshold && config.onSwipeRight) {
            toast('👉 Sağa kaydırıldı', { duration: 1000 });
            config.onSwipeRight();
          } else if (mx < -threshold && config.onSwipeLeft) {
            toast('👈 Sola kaydırıldı', { duration: 1000 });
            config.onSwipeLeft();
          }
        }
        // Vertical swipe
        else {
          if (my > threshold && config.onSwipeDown) {
            toast('👇 Aşağı kaydırıldı', { duration: 1000 });
            config.onSwipeDown();
          } else if (my < -threshold && config.onSwipeUp) {
            toast('👆 Yukarı kaydırıldı', { duration: 1000 });
            config.onSwipeUp();
          }
        }
      },
      onPinch: ({ offset: [scale], last }) => {
        if (config.onPinch) {
          config.onPinch(scale);
          if (last) {
            toast(`🔍 Zoom: ${scale.toFixed(2)}x`, { duration: 1000 });
          }
        }
      },
    },
    {
      drag: {
        filterTaps: true,
      },
      pinch: {
        scaleBounds: { min: 0.5, max: 3 },
        rubberband: true,
      },
    }
  );

  return { bind, targetRef };
}


