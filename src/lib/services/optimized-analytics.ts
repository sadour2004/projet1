import { db } from '@/lib/db'
import { logger } from '@/lib/logger'

export interface DashboardMetrics {
  totalProducts: number
  totalCategories: number
  totalMovements: number
  totalUsers: number
  lowStockProducts: number
  outOfStockProducts: number
  totalValue: number
  totalRevenue: number
  todayStats: {
    sales: number
    returns: number
    adjustments: number
    totalMovements: number
  }
  weekStats: {
    sales: number
    returns: number
    adjustments: number
    totalMovements: number
  }
  monthStats: {
    sales: number
    returns: number
    adjustments: number
    totalMovements: number
  }
}

export interface TopProduct {
  id: string
  name: string
  sku?: string | null
  totalSold: number
  revenue: number
  stockCached: number
}

export interface LowStockProduct {
  id: string
  name: string
  sku?: string | null
  stockCached: number
  priceCents: number
  category?: {
    name: string
  } | null
}

interface DashboardMetricsOptions {
  startDate?: Date
  endDate?: Date
}

/**
 * Optimized dashboard metrics with reduced database queries
 */
export async function getOptimizedDashboardMetrics(options: DashboardMetricsOptions = {}): Promise<DashboardMetrics> {
  try {
    const now = new Date()
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    )
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Use raw SQL for better performance on complex aggregations
    const [
      // Basic counts in parallel
      basicCounts,
      // Total value calculation using SQL aggregation
      totalValueResult,
      // Total revenue calculation using SQL aggregation
      totalRevenueResult,
      // Movement statistics for different periods
      movementStats,
    ] = await Promise.all([
      // Basic counts
      Promise.all([
        db.product.count({ where: { isActive: true, isArchived: false } }),
        db.category.count(),
        options.startDate && options.endDate
          ? db.inventoryMovement.count({
              where: {
                createdAt: {
                  gte: options.startDate,
                  lte: options.endDate,
                },
              },
            })
          : db.inventoryMovement.count(),
        db.user.count(),
        db.product.count({
          where: {
            isActive: true,
            isArchived: false,
            stockCached: { gt: 0, lte: 5 },
          },
        }),
        db.product.count({
          where: {
            isActive: true,
            isArchived: false,
            stockCached: 0,
          },
        }),
      ]),

      // Total value using raw SQL for better performance
      db.$queryRaw<[{ total: bigint }]>`
        SELECT COALESCE(SUM(priceCents * stockCached), 0) as total
        FROM Product 
        WHERE isActive = 1 AND isArchived = 0
      `,

      // Total revenue using raw SQL with proper date filtering
      options.startDate && options.endDate
        ? db.$queryRaw<[{ total: bigint }]>`
            SELECT COALESCE(SUM(ABS(qty) * COALESCE(unitPriceCents, 0)), 0) as total
            FROM InventoryMovement 
            WHERE type = 'SALE_OFFLINE'
            AND createdAt >= ${options.startDate}
            AND createdAt <= ${options.endDate}
          `
        : db.$queryRaw<[{ total: bigint }]>`
            SELECT COALESCE(SUM(ABS(qty) * COALESCE(unitPriceCents, 0)), 0) as total
            FROM InventoryMovement 
            WHERE type = 'SALE_OFFLINE'
          `,

      // Movement statistics for the selected period
      getOptimizedMovementStats(
        options.startDate || startOfToday, 
        options.startDate || startOfWeek, 
        options.startDate || startOfMonth
      ),
    ])

    const [
      totalProducts,
      totalCategories,
      totalMovements,
      totalUsers,
      lowStockProducts,
      outOfStockProducts,
    ] = basicCounts
    const totalValue = Number(totalValueResult[0]?.total || 0)
    const totalRevenue = Number(totalRevenueResult[0]?.total || 0)


    const result = {
      totalProducts,
      totalCategories,
      totalMovements,
      totalUsers,
      lowStockProducts,
      outOfStockProducts,
      totalValue,
      totalRevenue,
      ...movementStats,
    }


    return result
  } catch (error) {
    logger.error('Failed to get optimized dashboard metrics', { error })
    // Return default values instead of throwing
    return {
      totalProducts: 0,
      totalCategories: 0,
      totalMovements: 0,
      totalUsers: 0,
      lowStockProducts: 0,
      outOfStockProducts: 0,
      totalValue: 0,
      totalRevenue: 0,
      todayStats: { sales: 0, returns: 0, adjustments: 0, totalMovements: 0 },
      weekStats: { sales: 0, returns: 0, adjustments: 0, totalMovements: 0 },
      monthStats: { sales: 0, returns: 0, adjustments: 0, totalMovements: 0 },
    }
  }
}

/**
 * Optimized movement statistics using a single query with date filtering
 */
async function getOptimizedMovementStats(
  startOfToday: Date,
  startOfWeek: Date,
  startOfMonth: Date
) {
  try {
    // Use a single query with conditional aggregation for all periods
    const result = await db.$queryRaw<
      [
        {
          today_sales: bigint
          today_returns: bigint
          today_adjustments: bigint
          today_total: bigint
          week_sales: bigint
          week_returns: bigint
          week_adjustments: bigint
          week_total: bigint
          month_sales: bigint
          month_returns: bigint
          month_adjustments: bigint
          month_total: bigint
        },
      ]
    >`
      SELECT 
        -- Today stats
        COALESCE(SUM(CASE WHEN type = 'SALE_OFFLINE' AND createdAt >= ${startOfToday} THEN ABS(qty) ELSE 0 END), 0) as today_sales,
        COALESCE(SUM(CASE WHEN type = 'RETURN' AND createdAt >= ${startOfToday} THEN qty ELSE 0 END), 0) as today_returns,
        COALESCE(SUM(CASE WHEN type = 'ADJUSTMENT' AND createdAt >= ${startOfToday} THEN ABS(qty) ELSE 0 END), 0) as today_adjustments,
        COUNT(CASE WHEN createdAt >= ${startOfToday} THEN 1 END) as today_total,
        
        -- Week stats
        COALESCE(SUM(CASE WHEN type = 'SALE_OFFLINE' AND createdAt >= ${startOfWeek} THEN ABS(qty) ELSE 0 END), 0) as week_sales,
        COALESCE(SUM(CASE WHEN type = 'RETURN' AND createdAt >= ${startOfWeek} THEN qty ELSE 0 END), 0) as week_returns,
        COALESCE(SUM(CASE WHEN type = 'ADJUSTMENT' AND createdAt >= ${startOfWeek} THEN ABS(qty) ELSE 0 END), 0) as week_adjustments,
        COUNT(CASE WHEN createdAt >= ${startOfWeek} THEN 1 END) as week_total,
        
        -- Month stats
        COALESCE(SUM(CASE WHEN type = 'SALE_OFFLINE' AND createdAt >= ${startOfMonth} THEN ABS(qty) ELSE 0 END), 0) as month_sales,
        COALESCE(SUM(CASE WHEN type = 'RETURN' AND createdAt >= ${startOfMonth} THEN qty ELSE 0 END), 0) as month_returns,
        COALESCE(SUM(CASE WHEN type = 'ADJUSTMENT' AND createdAt >= ${startOfMonth} THEN ABS(qty) ELSE 0 END), 0) as month_adjustments,
        COUNT(CASE WHEN createdAt >= ${startOfMonth} THEN 1 END) as month_total
      FROM InventoryMovement
    `

    const stats = result[0]

    return {
      todayStats: {
        sales: Number(stats.today_sales),
        returns: Number(stats.today_returns),
        adjustments: Number(stats.today_adjustments),
        totalMovements: Number(stats.today_total),
      },
      weekStats: {
        sales: Number(stats.week_sales),
        returns: Number(stats.week_returns),
        adjustments: Number(stats.week_adjustments),
        totalMovements: Number(stats.week_total),
      },
      monthStats: {
        sales: Number(stats.month_sales),
        returns: Number(stats.month_returns),
        adjustments: Number(stats.month_adjustments),
        totalMovements: Number(stats.month_total),
      },
    }
  } catch (error) {
    logger.error('Failed to get optimized movement stats', { error })
    return {
      todayStats: { sales: 0, returns: 0, adjustments: 0, totalMovements: 0 },
      weekStats: { sales: 0, returns: 0, adjustments: 0, totalMovements: 0 },
      monthStats: { sales: 0, returns: 0, adjustments: 0, totalMovements: 0 },
    }
  }
}

/**
 * Optimized top products with better query performance
 */
export async function getOptimizedTopProducts(
  limit = 10,
  options: { startDate?: Date; endDate?: Date } = {}
): Promise<TopProduct[]> {
  try {
    let result: Array<{
      id: string
      name: string
      sku: string | null
      totalSold: bigint
      revenue: bigint
      stockCached: number
    }>

    if (options.startDate && options.endDate) {
      // Try to get products for the specific period first
      result = await db.$queryRaw`
        SELECT 
          p.id,
          p.name,
          p.sku,
          SUM(ABS(im.qty)) as totalSold,
          SUM(ABS(im.qty) * COALESCE(im.unitPriceCents, 0)) as revenue,
          p.stockCached
        FROM InventoryMovement im
        JOIN Product p ON im.productId = p.id
        WHERE im.type = 'SALE_OFFLINE' AND p.isArchived = 0
        AND im.createdAt >= ${options.startDate}
        AND im.createdAt <= ${options.endDate}
        GROUP BY p.id, p.name, p.sku, p.stockCached
        ORDER BY totalSold DESC
        LIMIT ${limit}
      `

      // If no products found for the period, fall back to all-time top products
      if (result.length === 0) {
        result = await db.$queryRaw`
          SELECT 
            p.id,
            p.name,
            p.sku,
            SUM(ABS(im.qty)) as totalSold,
            SUM(ABS(im.qty) * COALESCE(im.unitPriceCents, 0)) as revenue,
            p.stockCached
          FROM InventoryMovement im
          JOIN Product p ON im.productId = p.id
          WHERE im.type = 'SALE_OFFLINE' AND p.isArchived = 0
          GROUP BY p.id, p.name, p.sku, p.stockCached
          ORDER BY totalSold DESC
          LIMIT ${limit}
        `
      }
    } else {
      // No date filtering - get all-time top products
      result = await db.$queryRaw`
        SELECT 
          p.id,
          p.name,
          p.sku,
          SUM(ABS(im.qty)) as totalSold,
          SUM(ABS(im.qty) * COALESCE(im.unitPriceCents, 0)) as revenue,
          p.stockCached
        FROM InventoryMovement im
        JOIN Product p ON im.productId = p.id
        WHERE im.type = 'SALE_OFFLINE' AND p.isArchived = 0
        GROUP BY p.id, p.name, p.sku, p.stockCached
        ORDER BY totalSold DESC
        LIMIT ${limit}
      `
    }

    return result.map((row) => ({
      id: row.id,
      name: row.name,
      sku: row.sku,
      totalSold: Number(row.totalSold),
      revenue: Number(row.revenue),
      stockCached: row.stockCached,
    }))
  } catch (error) {
    logger.error('Failed to get optimized top products', { error })
    return []
  }
}

/**
 * Optimized low stock products with better query performance
 */
export async function getOptimizedLowStockProducts(
  threshold = 5
): Promise<LowStockProduct[]> {
  try {
    const products = await db.product.findMany({
      where: {
        isActive: true,
        isArchived: false,
        stockCached: { lte: threshold },
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stockCached: true,
        priceCents: true,
        category: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { stockCached: 'asc' },
    })

    return products.map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      stockCached: product.stockCached,
      priceCents: product.priceCents,
      category: product.category,
    }))
  } catch (error) {
    logger.error('Failed to get optimized low stock products', { error })
    return []
  }
}

/**
 * Optimized sales trend with better date grouping
 */
export async function getOptimizedSalesTrend(days = 30) {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Use raw SQL for better date grouping performance
    const result = await db.$queryRaw<
      Array<{
        date: string
        units: bigint
        revenue: bigint
      }>
    >`
      SELECT 
        DATE(createdAt) as date,
        SUM(ABS(qty)) as units,
        SUM(ABS(qty) * COALESCE(unitPriceCents, 0)) as revenue
      FROM InventoryMovement 
      WHERE type = 'SALE_OFFLINE' 
        AND createdAt >= ${startDate}
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `

    return result.map((row) => ({
      date: row.date,
      units: Number(row.units),
      revenue: Number(row.revenue) / 100, // Convert cents to currency
    }))
  } catch (error) {
    logger.error('Failed to get optimized sales trend', { error })
    return []
  }
}
