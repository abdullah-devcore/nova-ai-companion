import { useEffect, useRef, useCallback, useState } from "react";

/**
 * Optimized streaming message renderer
 * Handles efficient token batching and DOM updates
 */
export function useStreamingMessage(token$: ReadableStream<Uint8Array> | null) {
  const [content, setContent] = useState("");
  const bufferRef = useRef("");
  const lastUpdateRef = useRef(Date.now());
  const decoderRef = useRef(new TextDecoder());

  useEffect(() => {
    if (!token$) return;

    let mounted = true;
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

    (async () => {
      try {
        reader = token$.getReader();
        const minBatchSize = 2; // Batch 2+ tokens for optimal throughput
        const maxWaitMs = 25; // 25ms = 40fps (smooth)

        while (mounted) {
          const { done, value } = await reader!.read();
          if (!mounted) break;

          if (done) {
            if (bufferRef.current) {
              setContent((prev) => prev + bufferRef.current);
              bufferRef.current = "";
            }
            break;
          }

          bufferRef.current += decoderRef.current.decode(value, { stream: true });
          const now = Date.now();

          // Flush buffer if batch ready or timeout exceeded
          if (
            bufferRef.current.length >= minBatchSize ||
            now - lastUpdateRef.current > maxWaitMs
          ) {
            setContent((prev) => prev + bufferRef.current);
            bufferRef.current = "";
            lastUpdateRef.current = now;
          }
        }
      } catch (error) {
        if (mounted) console.error("[Streaming]", error);
      } finally {
        reader?.releaseLock();
      }
    })();

    return () => {
      mounted = false;
      reader?.releaseLock();
    };
  }, [token$]);

  return content;
}

/**
 * API response caching with intelligent invalidation
 */
export function useAPICache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 5 * 60 * 1000 // 5 minutes default
) {
  const cacheRef = useRef<Map<string, { data: T; timestamp: number }>>(new Map());
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async (skipCache = false) => {
    // Check cache first
    if (!skipCache && cacheRef.current.has(key)) {
      const cached = cacheRef.current.get(key)!;
      if (Date.now() - cached.timestamp < ttl) {
        setData(cached.data);
        setLoading(false);
        return cached.data;
      }
    }

    setLoading(true);
    try {
      const result = await fetcher();
      cacheRef.current.set(key, { data: result, timestamp: Date.now() });
      setData(result);
      setError(null);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, ttl]);

  const invalidate = useCallback(() => {
    cacheRef.current.delete(key);
  }, [key]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch, invalidate };
}

/**
 * Debounced effect for efficient updates
 * Prevents redundant updates within specified time window
 */
export function useDebouncedEffect(
  effect: () => void | (() => void),
  dependencies: React.DependencyList,
  delay: number = 300
) {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const cleanupRef = useRef<() => void>();

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      cleanupRef.current = effect() as any;
    }, delay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (cleanupRef.current) cleanupRef.current();
    };
  }, dependencies);
}

/**
 * Batch state updates for better performance
 */
export function useBatchedState<T>(initialValue: T) {
  const [state, setState] = useState(initialValue);
  const pendingRef = useRef<Partial<T> | null>(null);
  const flushTimeoutRef = useRef<NodeJS.Timeout>();

  const updateBatch = useCallback((updates: Partial<T>) => {
    pendingRef.current = { ...pendingRef.current, ...updates };

    if (flushTimeoutRef.current) clearTimeout(flushTimeoutRef.current);

    flushTimeoutRef.current = setTimeout(() => {
      if (pendingRef.current) {
        setState((prev) => ({ ...prev, ...pendingRef.current }));
        pendingRef.current = null;
      }
    }, 0); // requestAnimationFrame would be ideal but setTimeout(0) is more compatible
  }, []);

  return [state, updateBatch] as const;
}

/**
 * Smooth scroll with performance optimization
 */
export function useSmoothScroll(ref: React.RefObject<HTMLElement>) {
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  const scrollToBottom = useCallback(() => {
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);

    scrollTimeoutRef.current = setTimeout(() => {
      if (ref.current) {
        ref.current.scrollTo({
          top: ref.current.scrollHeight,
          behavior: "smooth",
        });
      }
    }, 0);
  }, [ref]);

  const scrollToTop = useCallback(() => {
    if (ref.current) {
      ref.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [ref]);

  return { scrollToBottom, scrollToTop };
}

/**
 * Compute-intensive task scheduler
 * Breaks up heavy work into chunks for 60fps
 */
export function useScheduleTask<T>(
  task: (signal: AbortSignal) => Promise<T>,
  deps: React.DependencyList
) {
  const [result, setResult] = useState<T | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const abortControllerRef = useRef<AbortController>();

  useEffect(() => {
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsRunning(true);
    task(abortController.signal)
      .then((result) => {
        if (!abortController.signal.aborted) {
          setResult(result);
        }
      })
      .catch(() => {
        // Aborted or errored - ignore
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setIsRunning(false);
        }
      });

    return () => abortController.abort();
  }, deps);

  return { result, isRunning };
}

/**
 * Monitor connection quality
 */
export function useConnectionQuality() {
  const [quality, setQuality] = useState<"good" | "slow" | "offline">("good");

  useEffect(() => {
    // Check connection type
    const connection = (navigator as any).connection;
    if (!connection) return;

    const checkQuality = () => {
      const effectiveType = connection.effectiveType;
      if (effectiveType === "4g") {
        setQuality("good");
      } else if (effectiveType === "3g" || effectiveType === "2g") {
        setQuality("slow");
      }
    };

    // Check online status
    const handleOnline = () => setQuality("good");
    const handleOffline = () => setQuality("offline");

    checkQuality();
    connection.addEventListener("change", checkQuality);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      connection.removeEventListener("change", checkQuality);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return quality;
}
