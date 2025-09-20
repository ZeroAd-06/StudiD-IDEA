import { useRef, useEffect, useCallback } from 'react';

export const useDebounce = <F extends (...args: any[]) => any,>(
  func: F,
  delay: number
) => {
  // Fix: Provide an initial value to useRef as calling it without arguments is deprecated and can cause errors.
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const debouncedFunc = useCallback(
    (...args: Parameters<F>) => {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
      timeout.current = setTimeout(() => {
        func(...args);
      }, delay);
    },
    [func, delay]
  );

  useEffect(() => {
    return () => {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
    };
  }, []);

  return debouncedFunc;
};
