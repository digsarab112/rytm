"use client";

import { useEffect, useRef, useState } from "react";

import { persistAdminStorageValue } from "@/lib/admin/storefront-config-actions";

export function useLocalStorageState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [isReady, setIsReady] = useState(false);
  const persistTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      try {
        const storedValue = window.localStorage.getItem(key);

        if (storedValue) {
          setValue(JSON.parse(storedValue) as T);
        }
      } catch {
        window.localStorage.removeItem(key);
      } finally {
        setIsReady(true);
      }
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, [key]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    window.localStorage.setItem(key, JSON.stringify(value));

    if (persistTimerRef.current) {
      window.clearTimeout(persistTimerRef.current);
    }

    persistTimerRef.current = window.setTimeout(() => {
      void persistAdminStorageValue(key, value);
      persistTimerRef.current = null;
    }, 300);
  }, [isReady, key, value]);

  useEffect(() => {
    return () => {
      if (persistTimerRef.current) {
        window.clearTimeout(persistTimerRef.current);
      }
    };
  }, []);

  return [value, setValue, isReady] as const;
}
