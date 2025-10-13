import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/helpers'
import { createStockAdjustment } from '@/lib/services/movement'
import { apiRateLimit } from '@/lib/security/rate-limit'
import { logger } from '@/lib/logger'
// Role enum not available in SQLite, using string literals
import { z } from 'zod'

const adjustStockSchema = z.object({
  productId: z.string().cuid('Invalid product ID'),
  adjustmentQty: z
    .number()
    .int()
    .min(-1000)
    .max(1000, 'Adjustment quantity too large'),
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason too long'),
})

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await apiRateLimit(req)
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    // Authentication and authorization (only OWNER can adjust stock)
    const user = await requireRole('OWNER')

    // Parse and validate request body
    const body = await req.json()
    const { productId, adjustmentQty, reason } = adjustStockSchema.parse(body)

    const adjustmentMovement = await createStockAdjustment(
      productId,
      adjustmentQty,
      reason,
      user.id
    )

    return NextResponse.json(adjustmentMovement, { status: 201 })
  } catch (error) {
    logger.error('POST /api/movements/adjust-stock error', { error })

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }

      if (error.message.includes('negative stock')) {
        return NextResponse.json({ error: error.message }, { status: 409 })
      }

      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
