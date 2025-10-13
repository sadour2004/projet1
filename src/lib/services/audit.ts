import { db } from '@/lib/db'
import { logger } from '@/lib/logger'

export interface AuditLogData {
  actorId?: string
  action: string
  entity: string
  entityId?: string
  meta?: Record<string, any>
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    // If actorId is provided, verify the user exists
    if (data.actorId) {
      const userExists = await db.user.findUnique({
        where: { id: data.actorId },
        select: { id: true },
      })

      if (!userExists) {
        logger.warn('Audit log skipped - actor not found', {
          actorId: data.actorId,
        })
        return
      }
    }

    await db.auditLog.create({
      data: {
        actorId: data.actorId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        meta: data.meta ? JSON.stringify(data.meta) : null,
      },
    })

    logger.info('Audit log created', {
      action: data.action,
      entity: data.entity,
      entityId: data.entityId,
      actorId: data.actorId,
    })
  } catch (error) {
    logger.error('Failed to create audit log', { error, data })
    // Don't throw - audit logging should not break the main flow
  }
}

/**
 * Audit log actions enum for consistency
 */
export const AuditAction = {
  // Authentication
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  LOGIN_FAILED: 'LOGIN_FAILED',

  // User management
  USER_CREATE: 'USER_CREATE',
  USER_UPDATE: 'USER_UPDATE',
  USER_DELETE: 'USER_DELETE',
  USER_PASSWORD_CHANGE: 'USER_PASSWORD_CHANGE',
  USER_PASSWORD_RESET: 'USER_PASSWORD_RESET',

  // Product management
  PRODUCT_CREATE: 'PRODUCT_CREATE',
  PRODUCT_UPDATE: 'PRODUCT_UPDATE',
  PRODUCT_DELETE: 'PRODUCT_DELETE',
  PRODUCT_ACTIVATE: 'PRODUCT_ACTIVATE',
  PRODUCT_DEACTIVATE: 'PRODUCT_DEACTIVATE',

  // Category management
  CATEGORY_CREATE: 'CATEGORY_CREATE',
  CATEGORY_UPDATE: 'CATEGORY_UPDATE',
  CATEGORY_DELETE: 'CATEGORY_DELETE',

  // Inventory movements
  MOVEMENT_CREATE: 'MOVEMENT_CREATE',
  MOVEMENT_CANCEL: 'MOVEMENT_CANCEL',
  STOCK_ADJUSTMENT: 'STOCK_ADJUSTMENT',

  // File uploads
  FILE_UPLOAD: 'FILE_UPLOAD',
  FILE_DELETE: 'FILE_DELETE',

  // System
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  SECURITY_VIOLATION: 'SECURITY_VIOLATION',
} as const

export type AuditActionType = (typeof AuditAction)[keyof typeof AuditAction]

/**
 * Entity types for audit logging
 */
export const AuditEntity = {
  USER: 'USER',
  PRODUCT: 'PRODUCT',
  CATEGORY: 'CATEGORY',
  INVENTORY_MOVEMENT: 'INVENTORY_MOVEMENT',
  FILE: 'FILE',
  SYSTEM: 'SYSTEM',
} as const

export type AuditEntityType = (typeof AuditEntity)[keyof typeof AuditEntity]

/**
 * Helper functions for common audit scenarios
 */

export async function auditLogin(
  userId: string,
  success: boolean,
  meta?: Record<string, any>
) {
  await createAuditLog({
    actorId: userId,
    action: success ? AuditAction.LOGIN : AuditAction.LOGIN_FAILED,
    entity: AuditEntity.USER,
    entityId: userId,
    meta,
  })
}

export async function auditProductChange(
  actorId: string,
  action: AuditActionType,
  productId: string,
  meta?: Record<string, any>
) {
  await createAuditLog({
    actorId,
    action,
    entity: AuditEntity.PRODUCT,
    entityId: productId,
    meta,
  })
}

export async function auditInventoryMovement(
  actorId: string,
  movementId: string,
  meta?: Record<string, any>
) {
  await createAuditLog({
    actorId,
    action: AuditAction.MOVEMENT_CREATE,
    entity: AuditEntity.INVENTORY_MOVEMENT,
    entityId: movementId,
    meta,
  })
}

export async function auditSecurityViolation(
  actorId: string | undefined,
  violation: string,
  meta?: Record<string, any>
) {
  await createAuditLog({
    actorId,
    action: AuditAction.SECURITY_VIOLATION,
    entity: AuditEntity.SYSTEM,
    meta: {
      violation,
      ...meta,
    },
  })
}

/**
 * Get audit logs with filtering and pagination
 */
export async function getAuditLogs(options: {
  actorId?: string
  action?: string
  entity?: string
  entityId?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}) {
  const where: any = {}

  if (options.actorId) where.actorId = options.actorId
  if (options.action) where.action = options.action
  if (options.entity) where.entity = options.entity
  if (options.entityId) where.entityId = options.entityId

  if (options.startDate || options.endDate) {
    where.createdAt = {}
    if (options.startDate) where.createdAt.gte = options.startDate
    if (options.endDate) where.createdAt.lte = options.endDate
  }

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      include: {
        actor: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: options.limit || 50,
      skip: options.offset || 0,
    }),
    db.auditLog.count({ where }),
  ])

  return { logs, total }
}
