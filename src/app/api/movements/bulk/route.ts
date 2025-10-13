import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/helpers'
import { z } from 'zod'
import { createMovement } from '@/lib/services/movement'
import { apiRateLimit } from '@/lib/security/rate-limit'
import { logger } from '@/lib/logger'
import { MovementType } from '@/types/movement'

const bulkMovementSchema = z.object({
  movements: z
    .array(
      z.object({
        productId: z.string().cuid('Invalid product ID'),
        type: z.enum([
          'SALE_OFFLINE',
          'CANCEL_SALE',
          'RETURN',
          'LOSS',
          'ADJUSTMENT',
        ]),
        qty: z.number().int().positive('Quantity must be positive'),
        unitPriceCents: z.number().int().min(0).optional(),
        note: z.string().max(500, 'Note too long').optional(),
      })
    )
    .min(1, 'At least one movement is required'),
})

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await apiRateLimit(req)
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    // Authentication and authorization (STAFF and OWNER can create movements)
    const user = await requireRole('STAFF')

    // Parse and validate request body
    const body = await req.json()
    const validatedData = bulkMovementSchema.parse(body)

    // Create all movements
    const movements = []
    for (const movementData of validatedData.movements) {
      try {
        // Convert string literal to MovementType enum
        const movementDataWithEnum = {
          ...movementData,
          type: movementData.type as MovementType,
        }
        const movement = await createMovement(
          movementDataWithEnum,
          user.id,
          user.role as 'OWNER' | 'STAFF'
        )
        movements.push(movement)
      } catch (error) {
        // If any movement fails, we should rollback all previous movements
        // For now, we'll just log the error and continue
        logger.error('Failed to create movement in bulk operation', {
          error,
          movementData,
          userId: user.id,
        })
        throw error
      }
    }

    logger.info('Bulk movements created', {
      count: movements.length,
      userId: user.id,
      movementIds: movements.map((m) => m.id),
    })

    return NextResponse.json(
      {
        success: true,
        movements,
        count: movements.length,
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error('POST /api/movements/bulk error', { error })

    if (error instanceof Error) {
      if (
        error.message.includes('not found') ||
        error.message.includes('Insufficient stock')
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      if (error.message.includes('cannot create')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }

      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
