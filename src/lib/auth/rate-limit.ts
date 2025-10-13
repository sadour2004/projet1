import { logger } from '@/lib/logger'

interface RateLimitEntry {
  attempts: number
  lastAttempt: number
  lockedUntil?: number
}

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>()

const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const LOCKOUT_MS = 15 * 60 * 1000 // 15 minutes

/**
 * Check if IP/email combination is rate limited
 */
export function isRateLimited(identifier: string): boolean {
  const entry = rateLimitStore.get(identifier)
  const now = Date.now()

  if (!entry) {
    return false
  }

  // Check if still locked out
  if (entry.lockedUntil && now < entry.lockedUntil) {
    logger.warn('Rate limit active', {
      identifier,
      lockedUntil: entry.lockedUntil,
    })
    return true
  }

  // Reset if window has passed
  if (now - entry.lastAttempt > WINDOW_MS) {
    rateLimitStore.delete(identifier)
    return false
  }

  return false
}

/**
 * Record a failed login attempt
 */
export function recordFailedAttempt(identifier: string): void {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier) || {
    attempts: 0,
    lastAttempt: 0,
  }

  // Reset if window has passed
  if (now - entry.lastAttempt > WINDOW_MS) {
    entry.attempts = 0
  }

  entry.attempts += 1
  entry.lastAttempt = now

  // Lock if too many attempts
  if (entry.attempts >= MAX_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_MS
    logger.warn('Rate limit triggered', {
      identifier,
      attempts: entry.attempts,
      lockedUntil: entry.lockedUntil,
    })
  }

  rateLimitStore.set(identifier, entry)
}

/**
 * Record a successful login (resets the counter)
 */
export function recordSuccessfulAttempt(identifier: string): void {
  rateLimitStore.delete(identifier)
}

/**
 * Get rate limit identifier for IP + email combination
 */
export function getRateLimitIdentifier(ip: string, email: string): string {
  return `${ip}:${email}`
}

/**
 * Clean up old entries (call periodically)
 */
export function cleanupRateLimit(): void {
  const now = Date.now()

  for (const [key, entry] of rateLimitStore.entries()) {
    // Remove entries older than window
    if (
      now - entry.lastAttempt > WINDOW_MS &&
      (!entry.lockedUntil || now > entry.lockedUntil)
    ) {
      rateLimitStore.delete(key)
    }
  }
}

// Clean up every 5 minutes
setInterval(cleanupRateLimit, 5 * 60 * 1000)
