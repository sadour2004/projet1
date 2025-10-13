'use client'

import { useState, useEffect } from 'react'
import { BarChart3, TrendingDown, TrendingUp } from 'lucide-react'

interface TodayStats {
  totalMovements: number
  sales: number
  returns: number
}

interface OptimizedMovementsHeaderProps {
  todayStats?: TodayStats
  isLoading?: boolean
}

export function OptimizedMovementsHeader({ todayStats, isLoading = false }: OptimizedMovementsHeaderProps) {
  const [stats, setStats] = useState<TodayStats>(todayStats || {
    totalMovements: 0,
    sales: 0,
    returns: 0,
  })

  // Update stats when props change
  useEffect(() => {
    if (todayStats) {
      setStats(todayStats)
    }
  }, [todayStats])

  // Only fetch if no stats provided as props
  useEffect(() => {
    if (todayStats) return // Skip if stats are provided via props

    const fetchTodayStats = async () => {
      try {
        // Get today's date range
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const startDate = today.toISOString()
        
        // Fetch today's movements
        const response = await fetch(
          `/api/movements?startDate=${startDate}&limit=50`
        )
        
        if (response.ok) {
          const data = await response.json()
          const movements = data.movements || []
          
          // Calculate stats
          const totalMovements = movements.length
          const sales = movements.filter(
            (m: any) => m.type === 'SALE_OFFLINE'
          ).length
          const returns = movements.filter(
            (m: any) => m.type === 'RETURN'
          ).length
          
          setStats({
            totalMovements,
            sales,
            returns,
          })
        }
      } catch (error) {
        console.error('Failed to fetch today stats:', error)
      }
    }

    fetchTodayStats()
  }, [todayStats])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Opérations de Stock
        </h1>
        <p className="mt-2 text-gray-600">
          Gérez les mouvements d'inventaire, annulez les ventes et ajustez les niveaux de stock
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="truncate text-sm font-medium text-gray-500">
                  Total Mouvements
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {isLoading ? 'Chargement...' : stats.totalMovements}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="truncate text-sm font-medium text-gray-500">
                  Ventes
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {isLoading ? 'Chargement...' : stats.sales}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="truncate text-sm font-medium text-gray-500">
                  Retours
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {isLoading ? 'Chargement...' : stats.returns}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
