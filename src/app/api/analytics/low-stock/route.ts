import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/helpers'
import { getOptimizedLowStockProducts } from '@/lib/services/optimized-analytics'
import { apiRateLimit } from '@/lib/security/rate-limit'
import { logger } from '@/lib/logger'
// Using string literals since SQLite doesn't support enums

export async function GET(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await apiRateLimit(req)
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    // Authentication and authorization (OWNER and STAFF can view low stock alerts)
    await requireRole('STAFF')

    const { searchParams } = new URL(req.url)
    const threshold = parseInt(searchParams.get('threshold') || '5')

    const lowStockProducts = await getOptimizedLowStockProducts(threshold)

    return NextResponse.json({ products: lowStockProducts })
  } catch (error) {
    logger.error('GET /api/analytics/low-stock error', { error })

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
