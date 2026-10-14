export type Json =
  string | number | boolean | null | Json[] | { [key: string]: Json };

export function saveData<T extends Json>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function readData<T extends Json>(key: string): T | undefined;
export function readData<T extends Json>(key: string, fallback: T): T;
export function readData<T extends Json>(
  key: string,
  fallback: T | undefined,
): T | undefined;
export function readData<T extends Json>(
  key: string,
  fallback?: T,
): T | undefined {
  const value = window.localStorage.getItem(key);
  if (value == null) return fallback;
  return JSON.parse(value) as T;
}
