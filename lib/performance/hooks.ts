import { useEffect, useRef, useState } from 'react';

// ============================================================================
// INTERSECTION OBSERVER FOR LAZY LOADING
// ============================================================================

interface LazyLoadOptions {
  threshold?: number | number[];
  rootMargin?: string;
  triggerOnce?: boolean;
}

/**
 * Hook for lazy loading elements with Intersection Observer
 */
export function useLazyLoad(
  options: LazyLoadOptions = {}
): [React.RefObject<HTMLDivElement>, boolean] {
  const { threshold = 0.1, rootMargin = '50px', triggerOnce = true } = options;
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (!ref.current) return;

    // Skip if already triggered and triggerOnce is true
    if (triggerOnce && hasTriggered.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          hasTriggered.current = true;
          
          if (triggerOnce) {
            observer.unobserve(entry.target);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce]);

  return [ref, isVisible];
}

/**
 * Hook for infinite scroll / load more
 */
export function useInfiniteScroll(
  onLoadMore: () => void,
  { threshold = 0.1, rootMargin = '100px' } = {}
) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onLoadMore();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [onLoadMore, threshold, rootMargin]);

  return ref;
}

// ============================================================================
// DEFERRED RENDERING
// ============================================================================

/**
 * Hook to defer rendering of a component until browser is idle
 */
export function useDeferredRendering(delay: number = 0): boolean {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setShouldRender(true);
      return;
    }

    if ('requestIdleCallback' in window) {
      const id = (window.requestIdleCallback as any)(() => {
        setTimeout(() => setShouldRender(true), delay);
      });
      
      return () => (window.cancelIdleCallback as any)(id);
    } else {
      // Fallback for browsers without requestIdleCallback
      const timeoutId = setTimeout(() => setShouldRender(true), 1000 + delay);
      return () => clearTimeout(timeoutId);
    }
  }, [delay]);

  return shouldRender;
}

// ============================================================================
// MEMOIZATION HELPERS
// ============================================================================

/**
 * Deep equality check (simple version)
 */
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key) || !deepEqual(a[key], b[key])) {
      return false;
    }
  }

  return true;
}

/**
 * Hook for memoized state that only updates on deep change
 */
export function useMemoizedState<T>(
  initialValue: T | (() => T)
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState(initialValue);

  const setMemoizedState = (value: T | ((prev: T) => T)) => {
    setState((prev) => {
      const next = typeof value === 'function' ? (value as any)(prev) : value;
      return deepEqual(prev, next) ? prev : next;
    });
  };

  return [state, setMemoizedState];
}

// ============================================================================
// RESOURCE PREFETCHING
// ============================================================================

/**
 * Prefetch resources (images, fonts, etc.)
 */
export function prefetchResource(
  href: string,
  rel: 'prefetch' | 'preload' | 'preconnect' = 'prefetch'
): void {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = rel;
  link.href = href;
  
  if (rel === 'preload') {
    link.as = href.endsWith('.js') ? 'script' : href.endsWith('.css') ? 'style' : 'fetch';
  }
  
  document.head.appendChild(link);
}

/**
 * Preload critical routes
 */
export function prefetchRoute(href: string): void {
  prefetchResource(href, 'prefetch');
}

// ============================================================================
// REQUEST DEDUPLICATION
// ============================================================================

interface PendingRequest<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
}

const pendingRequests = new Map<string, PendingRequest<any>>();

/**
 * Deduplicate concurrent requests
 */
export async function withRequestDedup<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  // Check if request is already in flight
  if (pendingRequests.has(key)) {
    console.log('[Dedup] Returning pending request:', key);
    return pendingRequests.get(key)!.promise;
  }

  console.log('[Dedup] Starting new request:', key);

  // Create new deferred promise
  let resolve: (value: T) => void;
  let reject: (error: any) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  const request: PendingRequest<T> = {
    promise,
    resolve: resolve!,
    reject: reject!,
  };

  pendingRequests.set(key, request);

  try {
    const result = await fetcher();
    request.resolve(result);
    return result;
  } catch (error) {
    request.reject(error);
    throw error;
  } finally {
    pendingRequests.delete(key);
  }
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

/**
 * Track render performance
 */
export function useRenderTime(componentName: string): void {
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const renderTime = performance.now() - startTime;
      if (renderTime > 16) { // Slower than 60fps frame
        console.warn(`[Perf] ${componentName} render took ${renderTime.toFixed(2)}ms`);
      }
    };
  }, [componentName]);
}

/**
 * Track interaction performance (clicks, inputs, etc.)
 */
export function trackInteraction(name: string, duration: number): void {
  const metric = {
    name,
    duration,
    timestamp: new Date().toISOString(),
  };

  console.log('[Interaction]', metric);

  // Send to analytics in production
  if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
    // Example: window.gtag?.('event', 'interaction', metric);
  }
}
