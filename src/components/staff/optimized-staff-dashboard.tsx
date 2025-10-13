'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ShoppingCart,
  Search,
  Package,
  User as UserIcon,
  LogOut,
  TrendingUp,
  Activity,
  DollarSign,
  RotateCcw,
} from 'lucide-react'
import { useTranslation } from '@/contexts/translation-context'
import { signOut } from 'next-auth/react'
import { ReturnProductModal } from './return-product-modal'

interface User {
  id: string
  email: string
  name?: string | null
  role: 'OWNER' | 'STAFF'
}

interface StaffStats {
  totalProducts: number
  lowStockProducts: number
  todaySales: number
  todayRevenue: number
}

interface OptimizedStaffDashboardProps {
  user: User
}

export function OptimizedStaffDashboard({ user }: OptimizedStaffDashboardProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const [stats, setStats] = useState<StaffStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Memoized fetch function
  const fetchStaffStats = useCallback(async () => {
    setIsLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/analytics/staff-dashboard')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        throw new Error('Failed to fetch staff statistics')
      }
    } catch (err) {
      console.error('Failed to fetch staff stats:', err)
      setError(err instanceof Error ? err.message : 'Failed to load statistics')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStaffStats()
  }, [fetchStaffStats])

  // Memoized handlers
  const handleSignOut = useCallback(() => {
    signOut({ callbackUrl: '/auth/signin' })
  }, [])

  const handleBrowseNavigation = useCallback(() => {
    router.push('/browse')
  }, [router])

  const handleCartNavigation = useCallback(() => {
    router.push('/cart')
  }, [router])

  // Memoized loading skeleton
  const LoadingSkeleton = useMemo(() => (
    <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-gray-200"></div>
            <div className="mx-auto h-4 w-3/4 rounded bg-gray-200"></div>
          </CardHeader>
          <CardContent className="text-center">
            <div className="mx-auto mb-6 h-3 w-full rounded bg-gray-200"></div>
            <div className="mx-auto h-10 w-3/4 rounded bg-gray-200"></div>
          </CardContent>
        </Card>
      ))}
    </div>
  ), [])

  // Memoized stats cards
  const StatsCards = useMemo(() => {
    if (!stats) return null

    return (
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">
                  Produits
                </div>
                <div className="text-xs text-gray-600">
                  {stats.totalProducts} disponibles
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="rounded-lg bg-yellow-100 p-2">
                <TrendingUp className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">
                  Stock faible
                </div>
                <div className="text-xs text-gray-600">
                  {stats.lowStockProducts} produits
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="rounded-lg bg-green-100 p-2">
                <Activity className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">
                  Ventes aujourd'hui
                </div>
                <div className="text-xs text-gray-600">
                  {stats.todaySales} mouvements
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-violet-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="rounded-lg bg-purple-100 p-2">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">
                  Chiffre d'affaires
                </div>
                <div className="text-xs text-gray-600">
                  {stats.todayRevenue.toFixed(2)} MAD
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }, [stats])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white shadow-lg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 p-2">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {t('nav.dashboard')}
                  </h1>
                  <p className="text-sm text-gray-600">
                    Système de gestion d'inventaire
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <UserIcon className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">
                  {user.name || user.email}
                </span>
                <Badge
                  variant={user.role === 'OWNER' ? 'default' : 'secondary'}
                  className={
                    user.role === 'OWNER'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }
                >
                  {user.role === 'OWNER'
                    ? t('dashboard.owner')
                    : t('dashboard.staff')}
                </Badge>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t('nav.signout')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            {t('dashboard.welcome')}, {user.name || user.email}!
          </h1>
          <p className="text-gray-600">
            {user.role === 'STAFF' 
              ? 'Gérez les ventes et consultez l\'inventaire'
              : 'Tableau de bord administrateur'
            }
          </p>
        </div>

        {/* Stats Cards */}
        {isLoading ? (
          LoadingSkeleton
        ) : error ? (
          <div className="mb-8 rounded-lg bg-red-50 p-4 text-center">
            <p className="text-red-600">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchStaffStats}
              className="mt-2"
            >
              Réessayer
            </Button>
          </div>
        ) : (
          StatsCards
        )}

        {/* Action Cards */}
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
          {/* Browse Products */}
          <Card className="card-professional transition-all duration-300 hover:shadow-xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-fit rounded-full bg-blue-100 p-3">
                <Search className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                {t('dashboard.browse_products')}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="mb-6 text-gray-600">{t('dashboard.browse_desc')}</p>
              <Button
                asChild
                className="btn-professional w-full bg-blue-600 text-white hover:bg-blue-700"
              >
                <Link href="/browse">
                  <Search className="mr-2 h-4 w-4" />
                  {t('dashboard.browse_catalog')}
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Record Product Return */}
          <ReturnProductModal>
            <Card className="card-professional transition-all duration-300 hover:shadow-xl cursor-pointer">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-fit rounded-full bg-orange-100 p-3">
                  <RotateCcw className="h-8 w-8 text-orange-600" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Enregistrer le Retour Produit
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="mb-6 text-gray-600">
                  Enregistrez les retours de produits pour mettre à jour l'inventaire
                </p>
                <Button
                  className="btn-professional w-full bg-orange-600 text-white hover:bg-orange-700"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Nouveau Retour
                </Button>
              </CardContent>
            </Card>
          </ReturnProductModal>

        </div>

        {/* Quick Actions */}
        {stats && (
          <div className="mt-12">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">
              Actions Rapides
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Button
                variant="outline"
                onClick={handleBrowseNavigation}
                className="h-20 flex-col space-y-2"
              >
                <Search className="h-6 w-6" />
                <span>Parcourir Produits</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleCartNavigation}
                className="h-20 flex-col space-y-2"
              >
                <ShoppingCart className="h-6 w-6" />
                <span>Voir le Panier</span>
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
