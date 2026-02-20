/**
 * Memory Optimization Utilities
 * Prevents memory leaks in SSR and client-side components
 */

type CleanupFunction = () => void;

/**
 * Registry for tracking active listeners and cleanup functions
 */
class MemoryCleanupRegistry {
  private cleanupFunctions = new Map<string, Set<CleanupFunction>>();
  private componentRegistry = new WeakMap<object, Set<CleanupFunction>>();

  /**
   * Register a cleanup function for a component
   */
  register(componentId: string, cleanup: CleanupFunction): void {
    if (!this.cleanupFunctions.has(componentId)) {
      this.cleanupFunctions.set(componentId, new Set());
    }
    this.cleanupFunctions.get(componentId)?.add(cleanup);
  }

  /**
   * Register cleanup for a component instance using WeakMap
   */
  registerForInstance(instance: object, cleanup: CleanupFunction): void {
    if (!this.componentRegistry.has(instance)) {
      this.componentRegistry.set(instance, new Set());
    }
    this.componentRegistry.get(instance)?.add(cleanup);
  }

  /**
   * Cleanup all registered functions for a component
   */
  cleanup(componentId: string): void {
    const cleanups = this.cleanupFunctions.get(componentId);
    if (cleanups) {
      cleanups.forEach(fn => {
        try {
          fn();
        } catch (error) {
          console.error(`Error during cleanup for ${componentId}:`, error);
        }
      });
      this.cleanupFunctions.delete(componentId);
    }
  }

  /**
   * Cleanup instance-specific registrations
   */
  cleanupInstance(instance: object): void {
    const cleanups = this.componentRegistry.get(instance);
    if (cleanups) {
      cleanups.forEach(fn => {
        try {
          fn();
        } catch (error) {
          console.error('Error during instance cleanup:', error);
        }
      });
    }
  }

  /**
   * Clear all registered cleanup functions
   */
  clearAll(): void {
    this.cleanupFunctions.forEach((cleanups, id) => {
      this.cleanup(id);
    });
    this.cleanupFunctions.clear();
  }

  /**
   * Get number of registered cleanup functions (for monitoring)
   */
  getRegisteredCount(): number {
    let count = 0;
    this.cleanupFunctions.forEach(cleanups => {
      count += cleanups.size;
    });
    return count;
  }
}

// Global registry instance
export const memoryRegistry = new MemoryCleanupRegistry();

/**
 * Hook wrapper for automatic cleanup on unmount
 */
export function useMemoryCleanup(cleanupFn: CleanupFunction, componentId?: string) {
  if (typeof window === 'undefined') {
    // SSR: no-op
    return;
  }

  // Client-side: register cleanup
  const cleanup = () => {
    try {
      cleanupFn();
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  };

  if (componentId) {
    memoryRegistry.register(componentId, cleanup);
  }

  // Return cleanup for use in useEffect
  return cleanup;
}

/**
 * Remove event listeners to prevent memory leaks
 */
export function removeEventListeners(
  element: HTMLElement | Window | Document,
  events: Array<{ type: string; listener: EventListener; options?: AddEventListenerOptions }>
): void {
  events.forEach(({ type, listener, options }) => {
    element.removeEventListener(type, listener, options);
  });
}

/**
 * Abort controller cleanup helper
 */
export function createAbortController(): [AbortController, () => void] {
  const controller = new AbortController();
  const cleanup = () => controller.abort();
  return [controller, cleanup];
}

/**
 * Clear intervals and timeouts
 */
export function clearTimers(timerIds: Array<NodeJS.Timeout | number>): void {
  timerIds.forEach(id => {
    if (typeof id === 'number') {
      clearTimeout(id);
      clearInterval(id);
    }
  });
}

/**
 * SSR-safe memory cleanup wrapper
 */
export function withMemoryCleanup<T extends (...args: any[]) => any>(
  fn: T,
  cleanup: CleanupFunction
): T {
  return ((...args: any[]) => {
    try {
      return fn(...args);
    } finally {
      if (typeof window !== 'undefined') {
        // Schedule cleanup after execution
        setTimeout(cleanup, 0);
      }
    }
  }) as T;
}

/**
 * Monitor memory usage (client-side only)
 */
export function getMemoryUsage(): {
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
  jsHeapSizeLimit?: number;
} | null {
  if (typeof window === 'undefined' || !(performance as any).memory) {
    return null;
  }

  const memory = (performance as any).memory;
  return {
    usedJSHeapSize: memory.usedJSHeapSize,
    totalJSHeapSize: memory.totalJSHeapSize,
    jsHeapSizeLimit: memory.jsHeapSizeLimit,
  };
}

/**
 * Log memory stats for debugging
 */
export function logMemoryStats(label?: string): void {
  const stats = getMemoryUsage();
  if (stats) {
    const usedMB = (stats.usedJSHeapSize! / 1024 / 1024).toFixed(2);
    const totalMB = (stats.totalJSHeapSize! / 1024 / 1024).toFixed(2);
    const limitMB = (stats.jsHeapSizeLimit! / 1024 / 1024).toFixed(2);
    console.log(
      `[Memory ${label || 'Stats'}] Used: ${usedMB}MB / Total: ${totalMB}MB / Limit: ${limitMB}MB`
    );
  }
}

/**
 * Clean up React Query cache to prevent memory bloat
 */
export function cleanupQueryCache(maxAge: number = 5 * 60 * 1000): void {
  // This would integrate with React Query's cache
  // Implementation depends on QueryClient instance
  if (typeof window !== 'undefined') {
    const now = Date.now();
    // Clean up old cache entries
    // Note: Actual implementation would use QueryClient.clear() or similar
    console.log(`Query cache cleanup triggered at ${new Date(now).toISOString()}`);
  }
}

/**
 * Debounce helper to prevent excessive function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle helper to limit function call frequency
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Global cleanup on page unload
 */
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    memoryRegistry.clearAll();
  });
}
