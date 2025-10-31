import { useEffect, useRef } from 'react';

export function useAutoSave<T extends Record<string, any>>(
  data: T,
  onSave: (data: T) => void | Promise<void>,
  delay = 2000
) {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const dataRef = useRef<T>(data);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      onSave(dataRef.current);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, onSave, delay]);
}

