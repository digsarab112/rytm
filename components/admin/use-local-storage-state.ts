"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { Dispatch, SetStateAction } from "react";

import { persistAdminStorageValue } from "@/lib/admin/storefront-config-actions";

export function useLocalStorageState<T>(key: string, initialValue: T) {
  const [value, setRawValue] = useState<T>(initialValue);
  const [isReady, setIsReady] = useState(false);
  const initialValueRef = useRef(initialValue);
  const persistTimerRef = useRef<number | null>(null);
  const hasLocalChangeRef = useRef(false);

  const setValue: Dispatch<SetStateAction<T>> = useCallback((nextValue) => {
    hasLocalChangeRef.current = true;
    setRawValue(nextValue);
  }, []);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      try {
        const serverValue = initialValueRef.current;
        const storedValue = window.localStorage.getItem(key);

        if (storedValue) {
          const parsedValue = JSON.parse(storedValue) as T;

          if (shouldUseStoredValue(serverValue, parsedValue)) {
            setRawValue(parsedValue);
          } else {
            window.localStorage.setItem(key, JSON.stringify(serverValue));
          }
        } else {
          window.localStorage.setItem(key, JSON.stringify(serverValue));
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
    if (!isReady || !hasLocalChangeRef.current) {
      return;
    }

    window.localStorage.setItem(key, JSON.stringify(value));

    if (persistTimerRef.current) {
      window.clearTimeout(persistTimerRef.current);
    }

    persistTimerRef.current = window.setTimeout(() => {
      void persistAdminStorageValue(key, value);
      persistTimerRef.current = null;
      hasLocalChangeRef.current = false;
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

function shouldUseStoredValue<T>(initialValue: T, storedValue: T) {
  if (hasMeaningfulValue(initialValue)) {
    return false;
  }

  return hasMeaningfulValue(storedValue);
}

function hasMeaningfulValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (value && typeof value === "object") {
    return Object.keys(value).length > 0;
  }

  return value !== undefined && value !== null && value !== "";
}
