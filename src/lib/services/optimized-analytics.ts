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
  sales: number
  revenue: number
}

export interface LowStockProduct {
  id: string
  name: string
  sku?: string | null
  stockCached: number
  priceCents: number
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

    // Get basic counts
    const [
      totalProducts,
      totalCategories,
      totalMovements,
      totalUsers,
      lowStockProducts,
      outOfStockProducts,
    ] = await Promise.all([
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
    ])

    // Get total value
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
    }

    // Get total revenue
    let totalRevenue = 0
    try {
      const salesMovements = await db.inventoryMovement.findMany({
        where: {
          type: 'SALE_OFFLINE',
          ...(options.startDate && options.endDate && {
            createdAt: {
              gte: options.startDate,
              lte: options.endDate,
            },
          }),
        },
        select: { qty: true, unitPriceCents: true },
      })
      totalRevenue = salesMovements.reduce((sum, movement) => {
        return sum + Math.abs(movement.qty) * (movement.unitPriceCents || 0)
      }, 0)
    } catch (error) {
      logger.error('Failed to calculate total revenue', { error })
    }

    // Get movement statistics
    const movementStats = await getOptimizedMovementStats(
      startOfToday,
      startOfWeek,
      startOfMonth
    )

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

    logger.info('Dashboard metrics fetched successfully', { 
      totalProducts,
      totalCategories,
      totalUsers 
    })

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
    // Get today's stats
    const todayMovements = await db.inventoryMovement.findMany({
      where: { createdAt: { gte: startOfToday } },
      select: { type: true, qty: true },
    })

    // Get week's stats
    const weekMovements = await db.inventoryMovement.findMany({
      where: { createdAt: { gte: startOfWeek } },
      select: { type: true, qty: true },
    })

    // Get month's stats
    const monthMovements = await db.inventoryMovement.findMany({
      where: { createdAt: { gte: startOfMonth } },
      select: { type: true, qty: true },
    })

    const calculateStats = (movements: Array<{ type: string; qty: number }>) => {
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

    return {
      todayStats: calculateStats(todayMovements),
      weekStats: calculateStats(weekMovements),
      monthStats: calculateStats(monthMovements),
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
 * Get top selling products
 */
export async function getOptimizedTopProducts(limit = 10, options: { startDate?: Date; endDate?: Date } = {}): Promise<TopProduct[]> {
  try {
    const whereClause: any = {
      type: 'SALE_OFFLINE',
    }

    if (options.startDate && options.endDate) {
      whereClause.createdAt = {
        gte: options.startDate,
        lte: options.endDate,
      }
    }

    const movements = await db.inventoryMovement.findMany({
      where: whereClause,
      select: {
        productId: true,
        qty: true,
        unitPriceCents: true,
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
      },
    })

    // Aggregate sales by product
    const productSales = new Map<string, { sales: number; revenue: number; product: any }>()

    movements.forEach((movement) => {
      if (!movement.product) return

      const productId = movement.product.id
      const qty = Math.abs(movement.qty)
      const price = movement.unitPriceCents || 0
      const revenue = qty * price

      if (productSales.has(productId)) {
        const existing = productSales.get(productId)!
        existing.sales += qty
        existing.revenue += revenue
      } else {
        productSales.set(productId, {
          sales: qty,
          revenue,
          product: movement.product,
        })
      }
    })

    // Convert to array and sort by sales
    return Array.from(productSales.values())
      .map(({ sales, revenue, product }) => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        sales,
        revenue,
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, limit)
  } catch (error) {
    logger.error('Failed to get top products', { error })
    return []
  }
}

/**
 * Get low stock products
 */
export async function getOptimizedLowStockProducts(threshold = 5): Promise<LowStockProduct[]> {
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
      },
      orderBy: { stockCached: 'asc' },
    })

    return products.map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      stockCached: product.stockCached,
      priceCents: product.priceCents,
    }))
  } catch (error) {
    logger.error('Failed to get low stock products', { error })
    return []
  }
}