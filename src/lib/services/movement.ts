import { db } from '@/lib/db'
import { CreateMovementRequest, MovementQuery } from '@/lib/validators/movement'
import { createAuditLog, AuditAction, AuditEntity } from './audit'
import { logger } from '@/lib/logger'
import { Prisma } from '@prisma/client'
import { MovementType } from '@/types/movement'

type Role = 'OWNER' | 'STAFF'

/**
 * Create an inventory movement with stock validation
 */
export async function createMovement(
  data: CreateMovementRequest,
  actorId: string,
  actorRole: Role
) {
  try {
    // Validate movement type permissions
    validateMovementPermissions(data.type, actorRole)

    const movement = await db.$transaction(async (tx) => {
      // Get current product with lock
      const product = await tx.product.findUnique({
        where: { id: data.productId },
        select: {
          id: true,
          name: true,
          sku: true,
          stockCached: true,
          isActive: true,
        },
      })

      if (!product) {
        throw new Error('Product not found')
      }

      if (!product.isActive) {
        throw new Error('Cannot create movements for inactive products')
      }

      // Calculate signed quantity based on movement type
      const signedQty = getSignedQuantity(data.type, data.qty)

      // Calculate new stock level
      const newStock = product.stockCached + signedQty

      // Prevent negative stock for outbound movements
      if (newStock < 0) {
        throw new Error(
          `Insufficient stock. Available: ${product.stockCached}, Required: ${data.qty}`
        )
      }

      // Create the movement
      const newMovement = await tx.inventoryMovement.create({
        data: {
          productId: data.productId,
          type: data.type,
          qty: signedQty,
          unitPriceCents: data.unitPriceCents,
          note: data.note,
          actorId,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
            },
          },
          actor: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      })

      // Update cached stock
      await tx.product.update({
        where: { id: data.productId },
        data: { stockCached: newStock },
      })

      return newMovement
    })

    // Audit log
    await createAuditLog({
      actorId,
      action: AuditAction.MOVEMENT_CREATE,
      entity: AuditEntity.INVENTORY_MOVEMENT,
      entityId: movement.id,
      meta: {
        productId: data.productId,
        productName: movement.product.name,
        type: data.type,
        qty: data.qty,
        signedQty: movement.qty,
        unitPriceCents: data.unitPriceCents,
        note: data.note,
      },
    })

    logger.info('Inventory movement created', {
      movementId: movement.id,
      productId: data.productId,
      type: data.type,
      qty: movement.qty,
      actorId,
    })

    return movement
  } catch (error) {
    logger.error('Failed to create movement', { error, data, actorId })
    throw error
  }
}

/**
 * Get movements with filtering and pagination
 */
export async function getMovements(query: MovementQuery) {
  try {
    const where: Prisma.InventoryMovementWhereInput = {}

    if (query.productId) where.productId = query.productId
    if (query.type) where.type = query.type
    if (query.actorId) where.actorId = query.actorId

    if (query.startDate || query.endDate) {
      where.createdAt = {}
      if (query.startDate) where.createdAt.gte = new Date(query.startDate)
      if (query.endDate) where.createdAt.lte = new Date(query.endDate)
    }

    const cursorCondition = query.cursor ? { id: query.cursor } : undefined

    const movements = await db.inventoryMovement.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
        actor: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1,
      cursor: cursorCondition ? { id: cursorCondition.id } : undefined,
      skip: cursorCondition ? 1 : 0,
    })

    const hasMore = movements.length > query.limit
    if (hasMore) {
      movements.pop()
    }

    const nextCursor = hasMore ? movements[movements.length - 1]?.id : null

    return {
      movements,
      hasMore,
      nextCursor,
    }
  } catch (error) {
    logger.error('Failed to get movements', { error, query })
    throw error
  }
}

/**
 * Cancel a sale movement (OWNER only)
 */
export async function cancelSaleMovement(movementId: string, actorId: string) {
  try {
    const result = await db.$transaction(async (tx) => {
      // Get the original movement
      const originalMovement = await tx.inventoryMovement.findUnique({
        where: { id: movementId },
        include: {
          product: true,
        },
      })

      if (!originalMovement) {
        throw new Error('Movement not found')
      }

      if (originalMovement.type !== 'SALE_OFFLINE') {
        throw new Error('Can only cancel SALE_OFFLINE movements')
      }

      // Check if already cancelled
      const existingCancellation = await tx.inventoryMovement.findFirst({
        where: {
          productId: originalMovement.productId,
          type: 'CANCEL_SALE',
          note: { contains: movementId },
        },
      })

      if (existingCancellation) {
        throw new Error('Sale already cancelled')
      }

      // Create compensating movement
      const cancellationMovement = await tx.inventoryMovement.create({
        data: {
          productId: originalMovement.productId,
          type: 'CANCEL_SALE',
          qty: Math.abs(originalMovement.qty), // Positive to add back to stock
          unitPriceCents: originalMovement.unitPriceCents,
          note: `Cancellation of sale movement ${movementId}`,
          actorId,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
            },
          },
          actor: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      })

      // Update cached stock
      const newStock =
        originalMovement.product.stockCached + Math.abs(originalMovement.qty)
      await tx.product.update({
        where: { id: originalMovement.productId },
        data: { stockCached: newStock },
      })

      return { originalMovement, cancellationMovement }
    })

    // Audit log
    await createAuditLog({
      actorId,
      action: AuditAction.MOVEMENT_CANCEL,
      entity: AuditEntity.INVENTORY_MOVEMENT,
      entityId: result.cancellationMovement.id,
      meta: {
        originalMovementId: movementId,
        productId: result.originalMovement.productId,
        productName: result.originalMovement.product.name,
        cancelledQty: Math.abs(result.originalMovement.qty),
      },
    })

    logger.info('Sale movement cancelled', {
      originalMovementId: movementId,
      cancellationMovementId: result.cancellationMovement.id,
      actorId,
    })

    return result.cancellationMovement
  } catch (error) {
    logger.error('Failed to cancel sale movement', {
      error,
      movementId,
      actorId,
    })
    throw error
  }
}

/**
 * Create stock adjustment (OWNER only)
 */
export async function createStockAdjustment(
  productId: string,
  adjustmentQty: number,
  reason: string,
  actorId: string
) {
  try {
    if (!reason.trim()) {
      throw new Error('Reason is required for stock adjustments')
    }

    const movement = await db.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
        select: {
          id: true,
          name: true,
          sku: true,
          stockCached: true,
          isActive: true,
        },
      })

      if (!product) {
        throw new Error('Product not found')
      }

      const newStock = product.stockCached + adjustmentQty

      if (newStock < 0) {
        throw new Error(
          `Adjustment would result in negative stock. Current: ${product.stockCached}, Adjustment: ${adjustmentQty}`
        )
      }

      // Create adjustment movement
      const adjustmentMovement = await tx.inventoryMovement.create({
        data: {
          productId,
          type: 'ADJUSTMENT',
          qty: adjustmentQty,
          note: reason,
          actorId,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
            },
          },
          actor: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      })

      // Update cached stock
      await tx.product.update({
        where: { id: productId },
        data: { stockCached: newStock },
      })

      return adjustmentMovement
    })

    // Audit log
    await createAuditLog({
      actorId,
      action: AuditAction.STOCK_ADJUSTMENT,
      entity: AuditEntity.INVENTORY_MOVEMENT,
      entityId: movement.id,
      meta: {
        productId,
        productName: movement.product.name,
        adjustmentQty,
        reason,
      },
    })

    logger.info('Stock adjustment created', {
      movementId: movement.id,
      productId,
      adjustmentQty,
      actorId,
    })

    return movement
  } catch (error) {
    logger.error('Failed to create stock adjustment', {
      error,
      productId,
      adjustmentQty,
      actorId,
    })
    throw error
  }
}

/**
 * Validate movement type permissions based on user role
 */
function validateMovementPermissions(type: MovementType, role: Role) {
  const staffAllowed: MovementType[] = [
    MovementType.SALE_OFFLINE,
    MovementType.RETURN,
  ]
  const ownerOnly: MovementType[] = [
    MovementType.CANCEL_SALE,
    MovementType.LOSS,
    MovementType.ADJUSTMENT,
  ]

  if (role === 'STAFF' && !staffAllowed.includes(type)) {
    throw new Error(`Staff users cannot create ${type} movements`)
  }
}

/**
 * Convert movement type and quantity to signed quantity
 */
function getSignedQuantity(type: MovementType, qty: number): number {
  const outboundTypes: MovementType[] = [
    MovementType.SALE_OFFLINE,
    MovementType.LOSS,
  ]
  const inboundTypes: MovementType[] = [
    MovementType.RETURN,
    MovementType.CANCEL_SALE,
  ]

  if (outboundTypes.includes(type)) {
    return -Math.abs(qty) // Negative for outbound
  } else if (inboundTypes.includes(type)) {
    return Math.abs(qty) // Positive for inbound
  } else if (type === 'ADJUSTMENT') {
    return qty // Use as-is for adjustments (can be positive or negative)
  }

  throw new Error(`Unknown movement type: ${type}`)
}
