'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Package, BarChart3, AlertTriangle } from 'lucide-react'

interface ProductStats {
  totalProducts: number
  lowStockProducts: number
  outOfStockProducts: number
  activeProducts: number
}

interface OptimizedProductsHeaderProps {
  stats?: ProductStats | null
  isLoading?: boolean
}

export function OptimizedProductsHeader({ stats: propStats, isLoading: propIsLoading = false }: OptimizedProductsHeaderProps) {
  const [stats, setStats] = useState<ProductStats | null>(propStats || null)
  const [isLoading, setIsLoading] = useState(propIsLoading)
  const [error, setError] = useState<string | null>(null)

  // Update stats when props change
  useEffect(() => {
    if (propStats) {
      setStats(propStats)
    }
  }, [propStats])

  useEffect(() => {
    if (propIsLoading !== undefined) {
      setIsLoading(propIsLoading)
    }
  }, [propIsLoading])

  const fetchProductStats = async () => {
    // Skip if stats are provided via props
    if (propStats) return

    try {
      setIsLoading(true)
      setError(null)

      const [dashboardRes, lowStockRes] = await Promise.all([
        fetch('/api/analytics/dashboard'),
        fetch('/api/analytics/low-stock?threshold=10'),
      ])

      const dashboardData = dashboardRes.ok ? await dashboardRes.json() : {}
      const lowStockData = lowStockRes.ok
        ? await lowStockRes.json()
        : { products: [] }

      setStats({
        totalProducts: dashboardData.totalProducts || 0,
        activeProducts: dashboardData.totalProducts || 0,
        lowStockProducts: lowStockData.products?.length || 0,
        outOfStockProducts: dashboardData.outOfStockProducts || 0,
      })
    } catch (err) {
      console.error('Failed to fetch product stats:', err)
      setError('Erreur lors du chargement des statistiques')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProductStats()
  }, [propStats])

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestion des Produits
          </h1>
          <p className="mt-2 text-gray-600">
            Gérez votre catalogue de produits, catégories et inventaire
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link href="/owner/categories">
              <Package className="mr-2 h-4 w-4" />
              Gérer les Catégories
            </Link>
          </Button>

          <Button variant="outline" asChild>
            <Link href="/owner/dashboard">
              <BarChart3 className="mr-2 h-4 w-4" />
              Voir les Analyses
            </Link>
          </Button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3 w-0 flex-1">
              <dl>
                <dt className="truncate text-sm font-medium text-gray-500">
                  Total Produits
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {isLoading ? (
                    <div className="h-5 animate-pulse rounded bg-gray-200"></div>
                  ) : error ? (
                    <span className="text-red-500">Erreur</span>
                  ) : (
                    stats?.totalProducts || 0
                  )}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Package className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-3 w-0 flex-1">
              <dl>
                <dt className="truncate text-sm font-medium text-gray-500">
                  Produits Actifs
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {isLoading ? (
                    <div className="h-5 animate-pulse rounded bg-gray-200"></div>
                  ) : error ? (
                    <span className="text-red-500">Erreur</span>
                  ) : (
                    stats?.activeProducts || 0
                  )}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-3 w-0 flex-1">
              <dl>
                <dt className="truncate text-sm font-medium text-gray-500">
                  Stock Faible
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {isLoading ? (
                    <div className="h-5 animate-pulse rounded bg-gray-200"></div>
                  ) : error ? (
                    <span className="text-red-500">Erreur</span>
                  ) : (
                    stats?.lowStockProducts || 0
                  )}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-3 w-0 flex-1">
              <dl>
                <dt className="truncate text-sm font-medium text-gray-500">
                  Rupture de Stock
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {isLoading ? (
                    <div className="h-5 animate-pulse rounded bg-gray-200"></div>
                  ) : error ? (
                    <span className="text-red-500">Erreur</span>
                  ) : (
                    stats?.outOfStockProducts || 0
                  )}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
          <div className="flex items-center">
            <AlertTriangle className="mr-2 h-4 w-4 text-red-400" />
            <p className="text-sm text-red-700">{error}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={fetchProductStats}
              className="ml-auto border-red-300 text-red-600 hover:bg-red-50"
            >
              Réessayer
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
