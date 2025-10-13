import { z } from 'zod'

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHtml(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Sanitize text input by trimming and limiting length
 */
export function sanitizeText(input: string, maxLength = 1000): string {
  return input.trim().slice(0, maxLength)
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(input: string): string {
  const emailSchema = z.string().email().max(254) // RFC 5321 limit
  try {
    return emailSchema.parse(input.toLowerCase().trim())
  } catch {
    throw new Error('Invalid email format')
  }
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(input: string): string {
  return input
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    .slice(0, 255) // Limit length
}

/**
 * Sanitize URL to prevent open redirects
 */
export function sanitizeUrl(
  input: string,
  allowedDomains: string[] = []
): string {
  try {
    const url = new URL(input)

    // Only allow http/https protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Invalid protocol')
    }

    // Check allowed domains if specified
    if (allowedDomains.length > 0 && !allowedDomains.includes(url.hostname)) {
      throw new Error('Domain not allowed')
    }

    return url.toString()
  } catch {
    throw new Error('Invalid URL format')
  }
}

/**
 * Sanitize SQL-like input (basic protection)
 */
export function sanitizeSqlInput(input: string): string {
  const dangerous = [
    'SELECT',
    'INSERT',
    'UPDATE',
    'DELETE',
    'DROP',
    'CREATE',
    'ALTER',
    'EXEC',
    'EXECUTE',
    'UNION',
    'SCRIPT',
    '--',
    ';',
    '/*',
    '*/',
  ]

  let sanitized = input
  dangerous.forEach((keyword) => {
    const regex = new RegExp(keyword, 'gi')
    sanitized = sanitized.replace(regex, '')
  })

  return sanitized.trim()
}

/**
 * General input sanitization for user content
 */
export function sanitizeUserInput(input: unknown): string {
  if (typeof input !== 'string') {
    return ''
  }

  return sanitizeText(sanitizeHtml(input))
}
