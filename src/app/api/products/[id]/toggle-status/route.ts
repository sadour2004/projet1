import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/helpers'
import { toggleProductStatus } from '@/lib/services/product'
import { apiRateLimit } from '@/lib/security/rate-limit'
import { logger } from '@/lib/logger'
// Role enum not available in SQLite, using string literals

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    // Rate limiting
    const rateLimitResult = await apiRateLimit(req)
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    // Authentication and authorization (only OWNER can toggle product status)
    const user = await requireRole('OWNER')

    const { id } = await params
    const product = await toggleProductStatus(id, user.id)

    return NextResponse.json(product)
  } catch (error) {
    const { id } = await params
    logger.error('POST /api/products/[id]/toggle-status error', {
      error,
      productId: id,
    })

    if (error instanceof Error) {
      if (error.message === 'Product not found') {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }

      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
