import { useState, useRef, TouchEvent } from 'react';

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

export const useSwipeGesture = ({
  onSwipeLeft,
  onSwipeRight,
  threshold = 100,
}: SwipeGestureOptions) => {
  const [offset, setOffset] = useState(0);
  const startX = useRef(0);
  const currentX = useRef(0);
  const isSwiping = useRef(false);

  const handleTouchStart = (e: TouchEvent) => {
    startX.current = e.touches[0].clientX;
    currentX.current = e.touches[0].clientX;
    isSwiping.current = true;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isSwiping.current) return;

    currentX.current = e.touches[0].clientX;
    const deltaX = currentX.current - startX.current;
    setOffset(deltaX);
  };

  const handleTouchEnd = () => {
    if (!isSwiping.current) return;

    const deltaX = currentX.current - startX.current;

    if (Math.abs(deltaX) > threshold) {
      if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      } else if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      }
    }

    setOffset(0);
    isSwiping.current = false;
  };

  return {
    offset,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
};

