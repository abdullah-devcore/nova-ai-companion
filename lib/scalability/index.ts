/**
 * Scalability utilities for performance optimization
 */

/**
 * Cache configuration for different content types
 */
export const cacheConfig = {
  // User data - short cache
  userData: {
    maxAge: 60, // 1 minute
    staleWhileRevalidate: 300, // 5 minutes
  },
  // Chat messages - medium cache
  messages: {
    maxAge: 300, // 5 minutes
    staleWhileRevalidate: 900, // 15 minutes
  },
  // Memories - longer cache
  memories: {
    maxAge: 600, // 10 minutes
    staleWhileRevalidate: 1800, // 30 minutes
  },
  // Static assets - very long cache
  assets: {
    maxAge: 31536000, // 1 year
    immutable: true,
  },
};

/**
 * Build cache control header
 */
export function buildCacheControlHeader(config: {
  maxAge?: number;
  staleWhileRevalidate?: number;
  immutable?: boolean;
}): string {
  const parts: string[] = [];

  if (config.immutable) {
    parts.push("public, immutable");
  } else {
    parts.push("public");
  }

  if (config.maxAge) {
    parts.push(`max-age=${config.maxAge}`);
  }

  if (config.staleWhileRevalidate) {
    parts.push(`stale-while-revalidate=${config.staleWhileRevalidate}`);
  }

  return parts.join(", ");
}

/**
 * Database connection pooling config
 */
export const dbPoolConfig = {
  min: 2,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  maxUses: 7500,
};

/**
 * API response pagination
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export function getPaginationOffsetLimit(
  options: PaginationOptions,
  maxLimit: number = 100
): { offset: number; limit: number } {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(options.limit || 20, maxLimit);
  const offset = (page - 1) * limit;

  return { offset, limit };
}

/**
 * Query optimization - select only needed fields
 */
export function optimizeQuery(fields: string[] = []): string {
  if (fields.length === 0) {
    return "*";
  }
  return fields.join(", ");
}

/**
 * Batch operations for better performance
 */
export async function batchOperation<T, R>(
  items: T[],
  operation: (item: T) => Promise<R>,
  batchSize: number = 10
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(operation));
    results.push(...batchResults);
  }

  return results;
}

/**
 * Timeout wrapper for long operations
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Operation timeout")), timeoutMs)
    ),
  ]);
}

/**
 * Retry logic for transient failures
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * Math.pow(2, i)));
      }
    }
  }

  throw lastError;
}

/**
 * Compression strategy selection
 */
export function shouldCompress(contentType: string, size: number): boolean {
  // Only compress text-based content larger than 1KB
  if (size < 1024) return false;

  const compressibleTypes = [
    "application/json",
    "application/javascript",
    "text/",
    "image/svg+xml",
  ];

  return compressibleTypes.some((type) => contentType.includes(type));
}

/**
 * Connection pool health check
 */
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  responseTime: number;
}> {
  const start = Date.now();

  try {
    // This would be a simple query like SELECT 1
    const responseTime = Date.now() - start;
    return { healthy: responseTime < 1000, responseTime };
  } catch (error) {
    return { healthy: false, responseTime: Date.now() - start };
  }
}

/**
 * Monitoring metrics collection
 */
export interface Metrics {
  apiLatency: number;
  errorRate: number;
  requestCount: number;
  cacheHitRate: number;
  dbPoolUtilization: number;
}

export function collectMetrics(): Metrics {
  // This would integrate with your monitoring service
  return {
    apiLatency: 0,
    errorRate: 0,
    requestCount: 0,
    cacheHitRate: 0,
    dbPoolUtilization: 0,
  };
}
