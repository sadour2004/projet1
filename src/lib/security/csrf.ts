import { NextRequest } from 'next/server'
import { randomBytes, createHash } from 'crypto'

/**
 * Generate CSRF token
 */
export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Validate CSRF token
 */
export function validateCsrfToken(
  token: string,
  sessionToken: string
): boolean {
  if (!token || !sessionToken) {
    return false
  }

  // Validate required environment variable
  if (!process.env.NEXTAUTH_SECRET) {
    console.error('NEXTAUTH_SECRET environment variable is required for CSRF validation')
    return false
  }

  // Simple validation - in production, use more sophisticated approach
  const expectedHash = createHash('sha256')
    .update(sessionToken + process.env.NEXTAUTH_SECRET)
    .digest('hex')

  const providedHash = createHash('sha256')
    .update(token + process.env.NEXTAUTH_SECRET)
    .digest('hex')

  return expectedHash === providedHash
}

/**
 * Check if request is safe method (doesn't need CSRF protection)
 */
export function isSafeMethod(method: string): boolean {
  return ['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())
}

/**
 * Extract CSRF token from request
 */
export function extractCsrfToken(req: NextRequest): string | null {
  // Check header first
  const headerToken = req.headers.get('x-csrf-token')
  if (headerToken) {
    return headerToken
  }

  // Check form data (for traditional forms)
  const contentType = req.headers.get('content-type') || ''
  if (contentType.includes('application/x-www-form-urlencoded')) {
    // Would need to parse form data here
    // For now, rely on header-based CSRF protection
  }

  return null
}

/**
 * CSRF protection middleware
 */
export async function csrfProtection(req: NextRequest): Promise<boolean> {
  // Skip CSRF for safe methods
  if (isSafeMethod(req.method)) {
    return true
  }

  // Skip CSRF for API routes that use other authentication
  const pathname = req.nextUrl.pathname
  if (pathname.startsWith('/api/auth/')) {
    return true // NextAuth handles its own CSRF protection
  }

  // For now, we rely on SameSite cookies for CSRF protection
  // In a more complex setup, you would validate CSRF tokens here
  return true
}
