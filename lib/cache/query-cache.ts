import { cache } from 'react';

// ============================================================================
// QUERY CACHE SYSTEM
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// In-memory cache with TTL support
const queryCache = new Map<string, CacheEntry<any>>();

/**
 * Generate cache key from function name and parameters
 */
export function getCacheKey(scope: string, ...params: (string | number | boolean)[]): string {
  return `${scope}:${params.join(':')}`
}

/**
 * Check if cache entry is still valid
 */
function isCacheValid(entry: CacheEntry<any>): boolean {
  const age = Date.now() - entry.timestamp;
  return age < entry.ttl;
}

/**
 * Get from cache if valid, otherwise undefined
 */
export function getFromCache<T>(key: string): T | undefined {
  const entry = queryCache.get(key);
  if (!entry) return undefined;
  
  if (!isCacheValid(entry)) {
    queryCache.delete(key);
    return undefined;
  }
  
  return entry.data as T;
}

/**
 * Set value in cache with TTL
 */
export function setInCache<T>(key: string, data: T, ttlMs: number = 60000): void {
  queryCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: ttlMs,
  });
}

/**
 * Clear specific cache entry
 */
export function invalidateCache(key: string): void {
  queryCache.delete(key);
}

/**
 * Clear all cache for a scope
 */
export function invalidateCacheScope(scope: string): void {
  for (const key of queryCache.keys()) {
    if (key.startsWith(`${scope}:`)) {
      queryCache.delete(key);
    }
  }
}

/**
 * Wrapper for cacheable queries with automatic TTL management
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = 60000
): Promise<T> {
  // Check cache first
  const cached = getFromCache<T>(key);
  if (cached !== undefined) {
    console.log('[Cache] Hit:', key);
    return cached;
  }

  console.log('[Cache] Miss:', key, '- Fetching...');
  
  // Fetch fresh data
  const data = await fetcher();
  
  // Store in cache
  setInCache(key, data, ttlMs);
  
  return data;
}

// ============================================================================
// CACHE CONFIG BY RESOURCE TYPE
// ============================================================================

export const CACHE_TIMES = {
  // User data - moderate TTL since it can change
  PROFILE: 5 * 60 * 1000, // 5 minutes
  SETTINGS: 5 * 60 * 1000, // 5 minutes
  
  // Chat data - longer TTL since it's mostly read-only during session
  CHAT_SESSIONS: 10 * 60 * 1000, // 10 minutes
  MESSAGES: 15 * 60 * 1000, // 15 minutes
  
  // Memory data - longer TTL since it rarely changes
  MEMORIES: 20 * 60 * 1000, // 20 minutes
  MEMORY_CONTEXT: 10 * 60 * 1000, // 10 minutes
  
  // Short-lived for frequently changing data
  EPHEMERAL: 2 * 60 * 1000, // 2 minutes
};

// ============================================================================
// CLEANUP
// ============================================================================

/**
 * Periodically clean up expired cache entries
 */
function cleanupExpiredCache(): void {
  const now = Date.now();
  for (const [key, entry] of queryCache.entries()) {
    if (!isCacheValid(entry)) {
      queryCache.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(cleanupExpiredCache, 5 * 60 * 1000);
}

export function getCache Stats(): {
  size: number;
  keys: string[];
  memory: string;
} {
  return {
    size: queryCache.size,
    keys: Array.from(queryCache.keys()),
    memory: `${Math.round((JSON.stringify(Array.from(queryCache.entries())).length / 1024) * 100) / 100} KB`,
  };
}
