"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * A boolean remembered in localStorage. Every read and write is wrapped in
 * try/catch (private mode, blocked storage); if storage fails the value lives
 * in memory for the session. Server render and hydration use `false`.
 */
const memory = new Map<string, boolean>();
const listeners = new Map<string, Set<() => void>>();

function read(key: string): boolean {
  if (memory.has(key)) return memory.get(key)!;
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function write(key: string, value: boolean) {
  memory.set(key, value);
  try {
    window.localStorage.setItem(key, value ? "1" : "0");
  } catch {
    // storage unavailable; the in-memory value still applies
  }
  listeners.get(key)?.forEach((l) => l());
}

export function useStoredFlag(key: string): [boolean, (value: boolean) => void] {
  const subscribe = useCallback(
    (cb: () => void) => {
      let set = listeners.get(key);
      if (!set) {
        set = new Set();
        listeners.set(key, set);
      }
      set.add(cb);
      const onStorage = (e: StorageEvent) => {
        if (e.key === key) {
          memory.delete(key);
          cb();
        }
      };
      window.addEventListener("storage", onStorage);
      return () => {
        set!.delete(cb);
        window.removeEventListener("storage", onStorage);
      };
    },
    [key]
  );
  const value = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => false
  );
  const setValue = useCallback((v: boolean) => write(key, v), [key]);
  return [value, setValue];
}
