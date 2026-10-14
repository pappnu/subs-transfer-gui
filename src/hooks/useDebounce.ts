import { useEffect, useRef } from "react";

// can't use 'unknown' here as TypeScript doesn't see e.g.
// '(value: string) => void' as an extension of '(...args: unknown[]) => unknown'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDebounce<T extends (...args: any[]) => any>(
  action: T,
  wait: number,
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const argRef = useRef<Parameters<T>>(undefined);

  const cancelTimeout = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = undefined;
  };

  const cancel = () => {
    cancelTimeout();
    argRef.current = undefined;
  };

  const debounce = (...args: Parameters<T>) => {
    clearTimeout(timeoutRef.current);
    argRef.current = args;
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = undefined;
      argRef.current = undefined;
      action(...args);
    }, wait);
  };

  const trigger = () => {
    if (timeoutRef.current !== undefined) {
      cancelTimeout();
      if (argRef.current) action(...argRef.current);
      else action();
    }
  };

  useEffect(() => {
    if (timeoutRef.current !== undefined) {
      const args = argRef.current || ([] as unknown[] as Parameters<T>);
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = undefined;
        argRef.current = undefined;
        action(...args);
      }, wait);
    }
    return () => clearTimeout(timeoutRef.current);
  }, [action, wait]);

  return { debounce, cancel, trigger };
}
