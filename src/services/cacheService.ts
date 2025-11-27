/**
 * Cache Service
 * ToIP Trust Registry v2 Backend
 *
 * In-memory caching with TTL support
 * Can be replaced with Redis in production
 */

/* eslint-disable no-console */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

// In-memory cache store
const cache = new Map<string, CacheEntry<unknown>>();

// Default TTL values (in milliseconds)
export const CACHE_TTL = {
  QUERY_RESULT: 5 * 60 * 1000, // 5 minutes
  DID_DOCUMENT: 60 * 60 * 1000, // 1 hour
  REGISTRY_DATA: 10 * 60 * 1000, // 10 minutes
  SHORT: 60 * 1000, // 1 minute
};

/**
 * Get value from cache
 */
export function get<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;

  if (!entry) {
    return null;
  }

  // Check if expired
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.value;
}

/**
 * Set value in cache with TTL
 */
export function set<T>(key: string, value: T, ttlMs: number = CACHE_TTL.QUERY_RESULT): void {
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

/**
 * Delete value from cache
 */
export function del(key: string): boolean {
  return cache.delete(key);
}

/**
 * Delete all keys matching a pattern
 */
export function delPattern(pattern: string): number {
  const regex = new RegExp(pattern.replace(/\*/g, '.*'));
  let count = 0;

  for (const key of cache.keys()) {
    if (regex.test(key)) {
      cache.delete(key);
      count++;
    }
  }

  return count;
}

/**
 * Clear all cache
 */
export function clear(): void {
  cache.clear();
}

/**
 * Get cache statistics
 */
export function getStats(): {
  size: number;
  keys: string[];
} {
  // Clean expired entries first
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now > entry.expiresAt) {
      cache.delete(key);
    }
  }

  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}

/**
 * Generate cache key for query
 */
export function queryKey(params: Record<string, unknown>): string {
  const sorted = Object.keys(params)
    .sort()
    .reduce(
      (acc, key) => {
        if (params[key] !== undefined && params[key] !== null) {
          acc[key] = params[key];
        }
        return acc;
      },
      {} as Record<string, unknown>
    );

  return `query:${JSON.stringify(sorted)}`;
}

/**
 * Generate cache key for entity
 */
export function entityKey(type: string, id: string): string {
  return `entity:${type}:${id}`;
}

/**
 * Cache decorator for async functions
 */
export function cached<T>(
  keyFn: (...args: unknown[]) => string,
  ttlMs: number = CACHE_TTL.QUERY_RESULT
) {
  return function (
    _target: unknown,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]): Promise<T> {
      const key = keyFn(...args);
      const cachedValue = get<T>(key);

      if (cachedValue !== null) {
        return cachedValue;
      }

      const result = await originalMethod.apply(this, args);
      set(key, result, ttlMs);
      return result;
    };

    return descriptor;
  };
}

/**
 * Invalidate cache for entity updates
 */
export function invalidateEntity(type: string, id: string): void {
  // Delete specific entity cache
  del(entityKey(type, id));

  // Delete related query caches
  delPattern(`query:.*"${type}".*`);
  delPattern(`query:.*"${id}".*`);
}

/**
 * Invalidate all query caches
 */
export function invalidateQueries(): void {
  delPattern('query:*');
}

// Export cache service as default
export default {
  get,
  set,
  del,
  delPattern,
  clear,
  getStats,
  queryKey,
  entityKey,
  invalidateEntity,
  invalidateQueries,
  CACHE_TTL,
};
