import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
// Role enum values: 'OWNER', 'STAFF'
import { authOptions } from './config'
import { logger } from '@/lib/logger'

export class AuthError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

export class UnauthorizedError extends AuthError {
  constructor(message = 'Unauthorized') {
    super(message, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends AuthError {
  constructor(message = 'Forbidden') {
    super(message, 'FORBIDDEN')
  }
}

/**
 * Require user to be authenticated
 * Throws UnauthorizedError if not authenticated
 */
export async function requireUser() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    logger.warn('Unauthorized access attempt')
    throw new UnauthorizedError()
  }

  return {
    id: session.user.id,
    email: session.user.email!,
    name: session.user.name,
    role: session.user.role as 'OWNER' | 'STAFF',
  }
}

/**
 * Require user to have specific role
 * Throws UnauthorizedError if not authenticated
 * Throws ForbiddenError if insufficient permissions
 */
export async function requireRole(requiredRole: 'OWNER' | 'STAFF') {
  const user = await requireUser()

  if (!hasRole(user.role, requiredRole)) {
    logger.warn('Insufficient permissions', {
      userId: user.id,
      userRole: user.role,
      requiredRole,
    })
    throw new ForbiddenError(`Required role: ${requiredRole}`)
  }

  return user
}

/**
 * Check if user has required role or higher
 * Role hierarchy: STAFF < OWNER
 */
export function hasRole(userRole: string, requiredRole: string): boolean {
  const roleHierarchy: Record<string, number> = {
    STAFF: 1,
    OWNER: 2,
  }

  return (roleHierarchy[userRole] || 0) >= (roleHierarchy[requiredRole] || 0)
}

/**
 * Redirect to login if not authenticated
 * For use in page components
 */
export async function requireUserOrRedirect() {
  try {
    return await requireUser()
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      redirect('/auth/signin')
    }
    throw error
  }
}

/**
 * Require user to have any of the specified roles
 */
export async function requireAnyRole(requiredRoles: string[]) {
  const user = await requireUser()

  if (requiredRoles.includes(user.role)) {
    return user
  }

  throw new ForbiddenError(
    `Access denied. Required roles: ${requiredRoles.join(' or ')}`
  )
}

/**
 * Redirect to unauthorized page if insufficient role
 * For use in page components
 */
export async function requireRoleOrRedirect(requiredRole: string | string[]) {
  try {
    if (Array.isArray(requiredRole)) {
      return await requireAnyRole(requiredRole)
    } else {
      return await requireRole(requiredRole as 'OWNER' | 'STAFF')
    }
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      redirect('/auth/signin')
    }
    if (error instanceof ForbiddenError) {
      redirect('/unauthorized')
    }
    throw error
  }
}

/**
 * Get current user session (nullable)
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return null
  }

  return {
    id: session.user.id,
    email: session.user.email!,
    name: session.user.name,
    role: session.user.role as 'OWNER' | 'STAFF',
  }
}
