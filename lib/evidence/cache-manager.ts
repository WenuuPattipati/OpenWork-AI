/**
 * Evidence Cache Manager
 * 
 * Manages Redis caching for evidence retrieval with graceful degradation.
 * When Redis is unavailable, the system falls back to direct API calls.
 * 
 * Cache Strategy:
 * - TTL: 24 hours (evidence remains relatively stable)
 * - Key format: evidence:{query_hash}:{source}
 * - Hashing: SHA-256 for consistent query identification
 * - Eviction: LRU (Least Recently Used) when memory limit reached
 */

import Redis from 'ioredis';
import { createHash } from 'crypto';

// Cache configuration
const CACHE_TTL = 24 * 60 * 60; // 24 hours in seconds
const REDIS_URL = process.env.REDIS_URL || '';

// Cache statistics (in-memory tracking)
let cacheStats = {
  hits: 0,
  misses: 0,
  errors: 0,
};

// Redis client instance
let redisClient: Redis | null = null;
let isRedisAvailable = false;

/**
 * Initialize Redis connection
 * Called automatically on first cache operation
 */
function initializeRedis(): void {
  if (redisClient || !REDIS_URL) {
    return;
  }

  try {
    redisClient = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        if (times > 3) {
          console.warn('Redis connection failed after 3 retries, disabling cache');
          isRedisAvailable = false;
          return null; // Stop retrying
        }
        return Math.min(times * 100, 3000); // Exponential backoff, max 3s
      },
      lazyConnect: true, // Don't connect immediately
    });

    // Handle connection events
    redisClient.on('connect', () => {
      console.log('✅ Redis cache connected');
      isRedisAvailable = true;
    });

    redisClient.on('error', (error: Error) => {
      console.error('❌ Redis error:', error.message);
      isRedisAvailable = false;
      cacheStats.errors++;
    });

    redisClient.on('close', () => {
      console.warn('⚠️  Redis connection closed');
      isRedisAvailable = false;
    });

    // Attempt connection
    redisClient.connect().catch((error: Error) => {
      console.error('❌ Redis connection failed:', error.message);
      isRedisAvailable = false;
    });
  } catch (error: any) {
    console.error('❌ Redis initialization failed:', error.message);
    isRedisAvailable = false;
    redisClient = null;
  }
}

/**
 * Check if caching is available
 */
export function isCacheAvailable(): boolean {
  if (!REDIS_URL) {
    return false;
  }

  if (!redisClient) {
    initializeRedis();
  }

  return isRedisAvailable && redisClient !== null;
}

/**
 * Generate consistent SHA-256 hash for query
 * Same query always produces same hash
 */
export function hashQuery(query: string): string {
  // Normalize query: lowercase, trim whitespace
  const normalized = query.toLowerCase().trim();
  
  // Generate SHA-256 hash
  const hash = createHash('sha256')
    .update(normalized)
    .digest('hex');
  
  return hash.substring(0, 16); // Use first 16 chars for shorter keys
}

/**
 * Generate cache key in format: evidence:{query_hash}:{source}
 */
function generateCacheKey(query: string, source: string): string {
  const queryHash = hashQuery(query);
  return `evidence:${queryHash}:${source}`;
}

/**
 * Cache metadata interface
 */
export interface CacheMetadata {
  timestamp: string;
  source: string;
  queryHash: string;
  ttl: number;
}

/**
 * Cached evidence interface
 */
export interface CachedEvidence<T> {
  data: T;
  metadata: CacheMetadata;
}

/**
 * Get cached evidence for a query and source
 * Returns null if cache miss or cache unavailable
 */
export async function getCachedEvidence<T>(
  query: string,
  source: string
): Promise<CachedEvidence<T> | null> {
  // Check if cache is available
  if (!isCacheAvailable()) {
    cacheStats.misses++;
    return null;
  }

  try {
    const key = generateCacheKey(query, source);
    const cached = await redisClient!.get(key);

    if (!cached) {
      // Cache miss
      cacheStats.misses++;
      console.log(`📭 Cache miss: ${source} for query ${hashQuery(query)}`);
      return null;
    }

    // Cache hit
    cacheStats.hits++;
    console.log(`📬 Cache hit: ${source} for query ${hashQuery(query)}`);

    // Parse cached data
    const parsed: CachedEvidence<T> = JSON.parse(cached);
    return parsed;
  } catch (error: any) {
    console.error(`❌ Cache read error for ${source}:`, error.message);
    cacheStats.errors++;
    cacheStats.misses++;
    return null;
  }
}

/**
 * Cache evidence with 24-hour TTL
 * Silently fails if cache unavailable (no-op)
 */
export async function cacheEvidence<T>(
  query: string,
  source: string,
  data: T
): Promise<void> {
  // Check if cache is available
  if (!isCacheAvailable()) {
    return; // Silently fail, no-op
  }

  try {
    const key = generateCacheKey(query, source);
    const queryHash = hashQuery(query);

    // Create cache entry with metadata
    const cacheEntry: CachedEvidence<T> = {
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        source,
        queryHash,
        ttl: CACHE_TTL,
      },
    };

    // Store in Redis with TTL
    await redisClient!.setex(key, CACHE_TTL, JSON.stringify(cacheEntry));

    console.log(`💾 Cached: ${source} for query ${queryHash} (TTL: 24h)`);
  } catch (error: any) {
    console.error(`❌ Cache write error for ${source}:`, error.message);
    cacheStats.errors++;
    // Silently fail, don't throw
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  hits: number;
  misses: number;
  errors: number;
  hitRate: number;
} {
  const total = cacheStats.hits + cacheStats.misses;
  const hitRate = total > 0 ? (cacheStats.hits / total) * 100 : 0;

  return {
    ...cacheStats,
    hitRate: Math.round(hitRate * 100) / 100, // Round to 2 decimal places
  };
}

/**
 * Reset cache statistics (useful for testing)
 */
export function resetCacheStats(): void {
  cacheStats = {
    hits: 0,
    misses: 0,
    errors: 0,
  };
}

/**
 * Close Redis connection (useful for cleanup in tests)
 */
export async function closeCacheConnection(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    isRedisAvailable = false;
    console.log('🔌 Redis connection closed');
  }
}
