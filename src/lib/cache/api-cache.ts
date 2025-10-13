/**
 * Simple in-memory cache for API responses
 * In production, consider using Redis or similar
 */

interface CacheEntry {
  data: any
  timestamp: number
  ttl: number // Time to live in milliseconds
}

class ApiCache {
  private cache = new Map<string, CacheEntry>()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

  /**
   * Get cached data
   */
  get(key: string): any | null {
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  /**
   * Set cached data
   */
  set(key: string, data: any, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  /**
   * Delete cached data
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Generate cache key from URL and params
   */
  generateKey(url: string, params?: Record<string, any>): string {
    const sortedParams = params
      ? Object.keys(params)
          .sort()
          .map((key) => `${key}=${params[key]}`)
          .join('&')
      : ''

    return `${url}${sortedParams ? `?${sortedParams}` : ''}`
  }

  /**
   * Clean up expired entries (call periodically)
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

// Singleton instance
export const apiCache = new ApiCache()

// Cleanup expired entries every 10 minutes
if (typeof window !== 'undefined') {
  setInterval(
    () => {
      apiCache.cleanup()
    },
    10 * 60 * 1000
  )
}

/**
 * Enhanced fetch with caching
 */
export async function cachedFetch(
  url: string,
  options?: RequestInit,
  ttl?: number
): Promise<Response> {
  // Only cache GET requests
  if (options?.method && options.method !== 'GET') {
    return fetch(url, options)
  }

  const cacheKey = apiCache.generateKey(url)
  const cachedData = apiCache.get(cacheKey)

  if (cachedData) {
    // Return a mock Response object with cached data
    return new Response(JSON.stringify(cachedData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Fetch fresh data
  const response = await fetch(url, options)

  if (response.ok) {
    const data = await response.clone().json()
    apiCache.set(cacheKey, data, ttl)
  }

  return response
}

/**
 * Cache invalidation helpers
 */
export const cacheInvalidation = {
  // Invalidate dashboard-related cache
  invalidateDashboard: () => {
    apiCache.delete('/api/analytics/dashboard')
    apiCache.delete('/api/analytics/top-products')
    apiCache.delete('/api/analytics/low-stock')
  },

  // Invalidate product-related cache
  invalidateProducts: () => {
    const keysToDelete: string[] = []
    for (const key of apiCache['cache'].keys()) {
      if (key.includes('/api/products') || key.includes('/api/analytics')) {
        keysToDelete.push(key)
      }
    }
    keysToDelete.forEach((key) => apiCache.delete(key))
  },

  // Invalidate movement-related cache
  invalidateMovements: () => {
    const keysToDelete: string[] = []
    for (const key of apiCache['cache'].keys()) {
      if (key.includes('/api/movements')) {
        keysToDelete.push(key)
      }
    }
    keysToDelete.forEach((key) => apiCache.delete(key))
  },
}
