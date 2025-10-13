import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/helpers'
import {
  createMovementSchema,
  movementQuerySchema,
} from '@/lib/validators/movement'
import { createMovement, getMovements } from '@/lib/services/movement'
import { apiRateLimit } from '@/lib/security/rate-limit'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await apiRateLimit(req)
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    // Authentication (STAFF and OWNER can view movements)
    await requireRole('STAFF')

    // Parse query parameters
    const { searchParams } = new URL(req.url)
    const query = movementQuerySchema.parse({
      productId: searchParams.get('productId') || undefined,
      type: searchParams.get('type') || undefined,
      actorId: searchParams.get('actorId') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      cursor: searchParams.get('cursor') || undefined,
      limit: searchParams.get('limit')
        ? parseInt(searchParams.get('limit')!)
        : undefined,
    })

    const result = await getMovements(query)

    return NextResponse.json(result)
  } catch (error) {
    logger.error('GET /api/movements error', { error })

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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
    const validatedData = createMovementSchema.parse(body)

    const movement = await createMovement(validatedData, user.id, user.role)

    return NextResponse.json(movement, { status: 201 })
  } catch (error) {
    logger.error('POST /api/movements error', { error })

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
