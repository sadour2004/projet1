import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  keyGenerator?: (req: NextRequest) => string
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Clear rate limit store in development
// Only initialize if NODE_ENV is properly set
const nodeEnv = process.env.NODE_ENV
if (nodeEnv === 'development') {
  // Clear store every 5 minutes in development
  setInterval(
    () => {
      rateLimitStore.clear()
    },
    5 * 60 * 1000
  )
}

/**
 * Rate limiting middleware factory
 */
export function createRateLimit(config: RateLimitConfig) {
  return async (
    req: NextRequest
  ): Promise<{
    success: boolean
    limit: number
    remaining: number
    resetTime: number
  }> => {
    const key = config.keyGenerator
      ? config.keyGenerator(req)
      : getDefaultKey(req)
    const now = Date.now()

    // Clean up expired entries
    if (Math.random() < 0.01) {
      // 1% chance to clean up
      cleanupExpiredEntries(now)
    }

    let entry = rateLimitStore.get(key)

    if (!entry || now >= entry.resetTime) {
      // Create new entry or reset expired one
      entry = {
        count: 1,
        resetTime: now + config.windowMs,
      }
      rateLimitStore.set(key, entry)

      return {
        success: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - 1,
        resetTime: entry.resetTime,
      }
    }

    if (entry.count >= config.maxRequests) {
      logger.warn('Rate limit exceeded', {
        key,
        count: entry.count,
        limit: config.maxRequests,
      })

      return {
        success: false,
        limit: config.maxRequests,
        remaining: 0,
        resetTime: entry.resetTime,
      }
    }

    entry.count++
    rateLimitStore.set(key, entry)

    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - entry.count,
      resetTime: entry.resetTime,
    }
  }
}

/**
 * Default key generator using IP address
 */
function getDefaultKey(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
  return `rate_limit:${ip}`
}

/**
 * Clean up expired entries
 */
function cleanupExpiredEntries(now: number): void {
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now >= entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

/**
 * Predefined rate limiters
 */

// Authentication endpoints (stricter)
export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts per 15 minutes
  keyGenerator: (req) => {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    return `auth:${ip}`
  },
})

// API endpoints (moderate)
export const apiRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 1000, // 1000 requests per 15 minutes (increased for development)
})

// Upload endpoints (strict)
export const uploadRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10, // 10 uploads per hour
})
