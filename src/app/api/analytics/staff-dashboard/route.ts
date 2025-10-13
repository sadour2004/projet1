import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/helpers'
import { apiRateLimit } from '@/lib/security/rate-limit'
import { logger } from '@/lib/logger'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await apiRateLimit(req)
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    // Authentication (STAFF and OWNER can view staff dashboard stats)
    await requireRole('STAFF')

    // Get today's date range
    const now = new Date()
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    )

    // Use parallel queries for better performance
    const [
      totalProducts,
      lowStockProducts,
      todayMovements,
      todayRevenue,
    ] = await Promise.all([
      // Total active products
      db.product.count({
        where: {
          isActive: true,
          isArchived: false,
        },
      }),

      // Low stock products (5 or fewer)
      db.product.count({
        where: {
          isActive: true,
          isArchived: false,
          stockCached: { lte: 5 },
        },
      }),

      // Today's sales movements
      db.inventoryMovement.count({
        where: {
          type: 'SALE_OFFLINE',
          createdAt: { gte: startOfToday },
        },
      }),

      // Today's revenue using raw SQL for better performance
      db.$queryRaw<[{ total: bigint }]>`
        SELECT COALESCE(SUM(ABS(qty) * COALESCE(unitPriceCents, 0)), 0) as total
        FROM InventoryMovement 
        WHERE type = 'SALE_OFFLINE' 
        AND createdAt >= ${startOfToday}
      `,
    ])

    const stats = {
      totalProducts,
      lowStockProducts,
      todaySales: todayMovements,
      todayRevenue: Number(todayRevenue[0]?.total || 0) / 100, // Convert cents to currency
    }

    logger.info('Staff dashboard stats fetched', { stats })

    return NextResponse.json(stats)
  } catch (error) {
    logger.error('GET /api/analytics/staff-dashboard error', { error })

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
