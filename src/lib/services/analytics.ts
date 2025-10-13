import { db } from '@/lib/db'
import { logger } from '@/lib/logger'

export interface DashboardMetrics {
  totalProducts: number
  totalCategories: number
  totalMovements: number
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

// Helper functions for combined data
async function getRecentMovements(limit: number = 20) {
  try {
    return await db.inventoryMovement.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: { name: true, sku: true },
        },
        actor: {
          select: { name: true, email: true },
        },
      },
    })
  } catch (error) {
    logger.error('Failed to get recent movements', { error })
    return []
  }
}

/**
 * Get comprehensive dashboard metrics
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  try {
    const now = new Date()
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    )
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Basic counts with error handling
    const [
      totalProducts,
      totalCategories,
      totalMovements,
      lowStockProducts,
      outOfStockProducts,
    ] = await Promise.all([
      db.product.count({ where: { isActive: true, isArchived: false } }).catch(() => 0),
      db.category.count().catch(() => 0),
      db.inventoryMovement.count().catch(() => 0),
      db.product
        .count({
          where: {
            isActive: true,
            isArchived: false,
            stockCached: { gt: 0, lte: 5 },
          },
        })
        .catch(() => 0),
      db.product
        .count({
          where: {
            isActive: true,
            isArchived: false,
            stockCached: 0,
          },
        })
        .catch(() => 0),
    ])

    // Calculate total inventory value with error handling
    let totalValue = 0
    try {
      const products = await db.product.findMany({
        where: { isActive: true, isArchived: false },
        select: { priceCents: true, stockCached: true },
      })

      totalValue = products.reduce((sum, product) => {
        return sum + product.priceCents * product.stockCached
      }, 0)
    } catch (error) {
      logger.error('Failed to calculate total value', { error })
      totalValue = 0
    }

    // Calculate total revenue from sales with error handling
    let totalRevenue = 0
    try {
      const salesMovements = await db.inventoryMovement.findMany({
        where: { type: 'SALE_OFFLINE' },
        select: { qty: true, unitPriceCents: true },
      })

      totalRevenue = salesMovements.reduce((sum, movement) => {
        const qty = Math.abs(movement.qty)
        const price = movement.unitPriceCents || 0
        return sum + qty * price
      }, 0)
    } catch (error) {
      logger.error('Failed to calculate total revenue', { error })
      totalRevenue = 0
    }

    // Movement statistics with error handling
    const [todayStats, weekStats, monthStats] = await Promise.all([
      getMovementStats(startOfToday).catch(() => ({
        sales: 0,
        returns: 0,
        adjustments: 0,
        totalMovements: 0,
      })),
      getMovementStats(startOfWeek).catch(() => ({
        sales: 0,
        returns: 0,
        adjustments: 0,
        totalMovements: 0,
      })),
      getMovementStats(startOfMonth).catch(() => ({
        sales: 0,
        returns: 0,
        adjustments: 0,
        totalMovements: 0,
      })),
    ])

    return {
      totalProducts,
      totalCategories,
      totalMovements,
      lowStockProducts,
      outOfStockProducts,
      totalValue,
      totalRevenue,
      todayStats,
      weekStats,
      monthStats,
    }
  } catch (error) {
    logger.error('Failed to get dashboard metrics', { error })
    // Return default values instead of throwing
    return {
      totalProducts: 0,
      totalCategories: 0,
      totalMovements: 0,
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
 * Get movement statistics for a date range
 */
async function getMovementStats(startDate: Date) {
  const movements = await db.inventoryMovement.findMany({
    where: {
      createdAt: { gte: startDate },
    },
    select: {
      type: true,
      qty: true,
    },
  })

  const stats = {
    sales: 0,
    returns: 0,
    adjustments: 0,
    totalMovements: movements.length,
  }

  movements.forEach((movement) => {
    switch (movement.type) {
      case 'SALE_OFFLINE':
        stats.sales += Math.abs(movement.qty)
        break
      case 'RETURN':
        stats.returns += movement.qty
        break
      case 'ADJUSTMENT':
        stats.adjustments += Math.abs(movement.qty)
        break
    }
  })

  return stats
}

/**
 * Get top selling products
 */
export async function getTopProducts(limit = 10): Promise<TopProduct[]> {
  try {
    const salesMovements = await db.inventoryMovement.findMany({
      where: {
        type: 'SALE_OFFLINE',
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            stockCached: true,
          },
        },
      },
    })

    // Group by product and calculate totals
    const productStats = new Map<
      string,
      {
        product: any
        totalSold: number
        revenue: number
      }
    >()

    salesMovements.forEach((movement) => {
      const productId = movement.product.id
      const qty = Math.abs(movement.qty)
      const revenue = movement.unitPriceCents
        ? movement.unitPriceCents * qty
        : 0

      if (productStats.has(productId)) {
        const stats = productStats.get(productId)!
        stats.totalSold += qty
        stats.revenue += revenue
      } else {
        productStats.set(productId, {
          product: movement.product,
          totalSold: qty,
          revenue,
        })
      }
    })

    // Convert to array and sort by total sold
    const topProducts = Array.from(productStats.values())
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, limit)
      .map((stats) => ({
        id: stats.product.id,
        name: stats.product.name,
        sku: stats.product.sku,
        totalSold: stats.totalSold,
        revenue: stats.revenue,
        stockCached: stats.product.stockCached,
      }))

    return topProducts
  } catch (error) {
    logger.error('Failed to get top products', { error })
    // Return empty array instead of throwing
    return []
  }
}

/**
 * Get low stock products
 */
export async function getLowStockProducts(
  threshold = 5
): Promise<LowStockProduct[]> {
  try {
    const products = await db.product.findMany({
      where: {
        isActive: true,
        isArchived: false,
        stockCached: { lte: threshold },
      },
      include: {
        category: {
          select: { name: true },
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
    logger.error('Failed to get low stock products', { error })
    // Return empty array instead of throwing
    return []
  }
}

/**
 * Get sales trend data for charts
 */
export async function getSalesTrend(days = 30) {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const movements = await db.inventoryMovement.findMany({
      where: {
        type: 'SALE_OFFLINE',
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        qty: true,
        unitPriceCents: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    // Group by date
    const dailyStats = new Map<string, { units: number; revenue: number }>()

    movements.forEach((movement) => {
      const date = movement.createdAt.toISOString().split('T')[0]
      const units = Math.abs(movement.qty)
      const revenue = movement.unitPriceCents
        ? movement.unitPriceCents * units
        : 0

      if (dailyStats.has(date)) {
        const stats = dailyStats.get(date)!
        stats.units += units
        stats.revenue += revenue
      } else {
        dailyStats.set(date, { units, revenue })
      }
    })

    // Convert to array format for charts
    const trendData = Array.from(dailyStats.entries()).map(([date, stats]) => ({
      date,
      units: stats.units,
      revenue: stats.revenue / 100, // Convert cents to currency
    }))

    return trendData
  } catch (error) {
    logger.error('Failed to get sales trend', { error })
    throw error
  }
}
