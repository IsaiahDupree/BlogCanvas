'use client';

import { useEffect, useRef } from 'react';
import { memoryRegistry } from '@/lib/performance/memory-cleanup';

/**
 * Hook for automatic cleanup of event listeners and resources
 */
export function useCleanup(cleanup: () => void, deps: any[] = []) {
  const cleanupRef = useRef(cleanup);

  // Update cleanup function reference
  useEffect(() => {
    cleanupRef.current = cleanup;
  }, [cleanup]);

  // Execute cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupRef.current();
    };
  }, deps);
}

/**
 * Hook for managing event listeners with automatic cleanup
 */
export function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  element?: HTMLElement | Window,
  options?: AddEventListenerOptions
) {
  const savedHandler = useRef(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const targetElement = element || window;
    if (!targetElement?.addEventListener) return;

    const eventListener: EventListener = (event) => {
      savedHandler.current(event as WindowEventMap[K]);
    };

    targetElement.addEventListener(eventName, eventListener, options);

    return () => {
      targetElement.removeEventListener(eventName, eventListener, options);
    };
  }, [eventName, element, options]);
}

/**
 * Hook for managing intervals with automatic cleanup
 */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

/**
 * Hook for managing timeouts with automatic cleanup
 */
export function useTimeout(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const id = setTimeout(() => savedCallback.current(), delay);
    return () => clearTimeout(id);
  }, [delay]);
}

/**
 * Hook for managing AbortController with automatic cleanup
 */
export function useAbortController() {
  const controllerRef = useRef<AbortController>();

  useEffect(() => {
    controllerRef.current = new AbortController();

    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  return controllerRef.current;
}

/**
 * Hook for tracking component mount/unmount for debugging
 */
export function useComponentLifecycle(componentName: string) {
  useEffect(() => {
    console.log(`[${componentName}] Mounted`);

    return () => {
      console.log(`[${componentName}] Unmounted`);
      memoryRegistry.cleanup(componentName);
    };
  }, [componentName]);
}

/**
 * Hook for debounced values
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Missing import
import { useState } from 'react';
