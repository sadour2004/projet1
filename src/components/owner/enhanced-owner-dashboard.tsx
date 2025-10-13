'use client'

import { useState, useEffect, memo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Package,
  TrendingUp,
  Users,
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  BarChart3,
  Activity,
  Plus,
  Eye,
  Calendar,
} from 'lucide-react'

interface DashboardMetrics {
  totalProducts: number
  totalCategories: number
  totalUsers: number
  totalRevenue: number
  lowStockCount: number
  outOfStockCount: number
  recentMovements: number
  topProducts: Array<{
    id: string
    name: string
    sales: number
  }>
  lowStockProducts: Array<{
    id: string
    name: string
    stockCached: number
  }>
}

// Function to get endpoints with date range
const getDashboardEndpoints = (period: PeriodType) => {
  const { startDate, endDate } = {
    day: {
      startDate: new Date().setHours(0, 0, 0, 0),
      endDate: new Date().setHours(23, 59, 59, 999)
    },
    week: {
      startDate: (() => {
        const now = new Date()
        const dayOfWeek = now.getDay()
        const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
        const monday = new Date(now)
        monday.setDate(now.getDate() + daysToMonday)
        monday.setHours(0, 0, 0, 0)
        return monday.getTime()
      })(),
      endDate: new Date().setHours(23, 59, 59, 999)
    },
    month: {
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).setHours(0, 0, 0, 0),
      endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).setHours(23, 59, 59, 999)
    }
  }[period]

  return {
    dashboard: `/api/analytics/dashboard?startDate=${new Date(startDate).toISOString()}&endDate=${new Date(endDate).toISOString()}`,
    topProducts: `/api/analytics/top-products?startDate=${new Date(startDate).toISOString()}&endDate=${new Date(endDate).toISOString()}&limit=5`,
    lowStock: '/api/analytics/low-stock?threshold=10',
  }
}

type PeriodType = 'day' | 'week' | 'month'

export const EnhancedOwnerDashboard = memo(function EnhancedOwnerDashboard() {
  const router = useRouter()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('day')

  // Get date range based on selected period
  const getDateRange = useCallback((period: PeriodType) => {
    const now = new Date()
    let startDate: Date
    let endDate = new Date(now)

    switch (period) {
      case 'day':
        startDate = new Date(now)
        startDate.setHours(0, 0, 0, 0)
        endDate.setHours(23, 59, 59, 999)
        break
      case 'week':
        startDate = new Date(now)
        const dayOfWeek = startDate.getDay()
        const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
        startDate.setDate(startDate.getDate() + daysToMonday)
        startDate.setHours(0, 0, 0, 0)
        endDate.setHours(23, 59, 59, 999)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        endDate.setHours(23, 59, 59, 999)
        break
      default:
        startDate = new Date(now)
        startDate.setHours(0, 0, 0, 0)
        endDate.setHours(23, 59, 59, 999)
    }

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    }
  }, [])

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const now = new Date()
      let startDate: Date
      let endDate = new Date(now)

      // Calculate date range based on selected period
      switch (selectedPeriod) {
        case 'day':
          startDate = new Date(now)
          startDate.setHours(0, 0, 0, 0)
          endDate.setHours(23, 59, 59, 999)
          break
        case 'week':
          startDate = new Date(now)
          const dayOfWeek = startDate.getDay()
          const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
          startDate.setDate(startDate.getDate() + daysToMonday)
          startDate.setHours(0, 0, 0, 0)
          endDate.setHours(23, 59, 59, 999)
          break
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          startDate.setHours(0, 0, 0, 0)
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
          endDate.setHours(23, 59, 59, 999)
          break
        default:
          startDate = new Date(now)
          startDate.setHours(0, 0, 0, 0)
          endDate.setHours(23, 59, 59, 999)
      }

      const startDateISO = startDate.toISOString()
      const endDateISO = endDate.toISOString()
      
      const [dashboardRes, topProductsRes, lowStockRes] = await Promise.all([
        fetch(`/api/analytics/dashboard?startDate=${startDateISO}&endDate=${endDateISO}`),
        fetch(`/api/analytics/top-products?startDate=${startDateISO}&endDate=${endDateISO}&limit=5`),
        fetch('/api/analytics/low-stock?threshold=10'),
      ])

      if (!dashboardRes.ok || !topProductsRes.ok || !lowStockRes.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const [dashboardData, topProductsData, lowStockData] = await Promise.all([
        dashboardRes.json(),
        topProductsRes.json(),
        lowStockRes.json(),
      ])

      const processedMetrics: DashboardMetrics = {
        totalProducts: dashboardData.totalProducts || 0,
        totalCategories: dashboardData.totalCategories || 0,
        totalUsers: dashboardData.totalUsers || 0,
        totalRevenue: dashboardData.totalRevenue || 0,
        lowStockCount: lowStockData.products?.length || 0,
        outOfStockCount: dashboardData.outOfStockProducts || 0,
        recentMovements: dashboardData.totalMovements || 0,
        topProducts: topProductsData.products || [],
        lowStockProducts: lowStockData.products || [],
      }

        setMetrics(processedMetrics)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inattendue')
      } finally {
        setIsLoading(false)
      }
  }, [selectedPeriod])

  // Fetch data when component mounts or period changes
  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="mb-2 h-3 rounded bg-gray-200"></div>
                <div className="h-6 w-1/2 rounded bg-gray-200"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-red-400" />
        <h3 className="mb-2 text-base font-medium text-gray-900">
          Erreur de chargement
        </h3>
        <p className="mb-3 text-sm text-gray-500">{error}</p>
        <Button size="sm" onClick={fetchDashboardData}>
          Réessayer
        </Button>
      </div>
    )
  }

  if (!metrics && !isLoading && !error) {
    return (
      <div className="py-8 text-center">
        <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-gray-400" />
        <h3 className="mb-2 text-base font-medium text-gray-900">
          Aucune donnée disponible
        </h3>
        <p className="mb-3 text-sm text-gray-500">
          Impossible de charger les données du tableau de bord
        </p>
        <Button size="sm" onClick={fetchDashboardData}>
          Réessayer
        </Button>
      </div>
    )
  }

  const getPeriodLabel = (period: PeriodType) => {
    switch (period) {
      case 'day': return 'Aujourd\'hui'
      case 'week': return 'Cette semaine'
      case 'month': return 'Ce mois'
      default: return 'Aujourd\'hui'
    }
  }

  return (
    <div className="space-y-3">
      {/* Date Filter */}
      <Card className="bg-gradient-to-r from-gray-50 to-gray-100">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-gray-600" />
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Période d'analyse</h3>
                <p className="text-xs text-gray-600">Sélectionnez la période pour analyser les données</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Select value={selectedPeriod} onValueChange={(value: PeriodType) => setSelectedPeriod(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sélectionner une période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Aujourd'hui</SelectItem>
                  <SelectItem value="week">Cette semaine</SelectItem>
                  <SelectItem value="month">Ce mois</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="outline" className="text-xs">
                {getPeriodLabel(selectedPeriod)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compact Metrics Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-100">Produits</p>
                <p className="text-2xl font-bold">
                  {metrics?.totalProducts || 0}
                </p>
              </div>
              <Package className="h-6 w-6 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-100">Revenus</p>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat('ar-MA', {
                    style: 'currency',
                    currency: 'MAD',
                  }).format((metrics?.totalRevenue || 0) / 100)}
                </p>
              </div>
              <DollarSign className="h-6 w-6 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-purple-100">
                  Mouvements
                </p>
                <p className="text-2xl font-bold">
                  {metrics?.recentMovements || 0}
                </p>
              </div>
              <ShoppingCart className="h-6 w-6 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-orange-100">
                  Stock Faible
                </p>
                <p className="text-2xl font-bold">
                  {metrics?.lowStockCount || 0}
                </p>
              </div>
              <AlertTriangle className="h-6 w-6 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content with Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="personnel">Personnel</TabsTrigger>
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="movements">Mouvements</TabsTrigger>
          <TabsTrigger value="analytics">Analyses</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-3">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {/* Top Products */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-base">
                  <TrendingUp className="mr-2 h-4 w-4 text-green-600" />
                  Produits Populaires
                </CardTitle>
              </CardHeader>
              <CardContent>
                {metrics?.topProducts.length === 0 ? (
                  <div className="py-6 text-center">
                    <BarChart3 className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                    <p className="text-sm text-gray-500">
                      Aucune donnée de vente
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {metrics?.topProducts.map((product, index) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between rounded bg-gray-50 p-2"
                      >
                        <div className="flex items-center space-x-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                            <span className="text-xs font-bold text-green-600">
                              #{index + 1}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {product.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {product.sales} ventes
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-xs text-green-800"
                        >
                          <TrendingUp className="mr-1 h-3 w-3" />
                          Populaire
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Low Stock Alerts */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-base">
                  <AlertTriangle className="mr-2 h-4 w-4 text-orange-600" />
                  Alertes Stock
                </CardTitle>
              </CardHeader>
              <CardContent>
                {metrics?.lowStockProducts.length === 0 ? (
                  <div className="py-6 text-center">
                    <Package className="mx-auto mb-2 h-8 w-8 text-green-400" />
                    <p className="text-sm font-medium text-green-600">
                      Stock optimal
                    </p>
                    <p className="text-xs text-gray-500">
                      Tous les produits ont un stock suffisant
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {metrics?.lowStockProducts.slice(0, 5).map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between rounded border border-orange-200 bg-orange-50 p-2"
                      >
                        <div className="flex items-center space-x-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100">
                            <AlertTriangle className="h-3 w-3 text-orange-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {product.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              Stock: {product.stockCached} unités
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-orange-100 text-xs text-orange-800"
                        >
                          Critique
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="personnel" className="space-y-3">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="rounded-lg bg-blue-100 p-2">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      Employés Totaux
                    </h3>
                    <p className="text-2xl font-bold text-blue-600">
                      {metrics?.totalUsers || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="rounded-lg bg-green-100 p-2">
                    <Activity className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      Actifs
                    </h3>
                    <p className="text-2xl font-bold text-green-600">
                      {metrics?.totalUsers || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="rounded-lg bg-purple-100 p-2">
                    <Plus className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      Actions
                    </h3>
                    <Button size="sm" className="mt-1">
                      Ajouter
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Gestion du Personnel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center">
                <Users className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                <p className="mb-3 text-sm text-gray-500">
                  Gestion complète du personnel disponible
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push('/owner/personnel')}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Voir la page Personnel
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-3">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="rounded-lg bg-blue-100 p-2">
                    <Package className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      Produits Totaux
                    </h3>
                    <p className="text-2xl font-bold text-blue-600">
                      {metrics?.totalProducts || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="rounded-lg bg-orange-100 p-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      Stock Faible
                    </h3>
                    <p className="text-2xl font-bold text-orange-600">
                      {metrics?.lowStockCount || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="rounded-lg bg-red-100 p-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      Rupture Stock
                    </h3>
                    <p className="text-2xl font-bold text-red-600">
                      {metrics?.outOfStockCount || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Gestion des Produits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center">
                <Package className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                <p className="mb-3 text-sm text-gray-500">
                  Gestion complète des produits disponible
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push('/owner/products')}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Voir la page Produits
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="space-y-3">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="rounded-lg bg-purple-100 p-2">
                    <ShoppingCart className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      Mouvements Totaux
                    </h3>
                    <p className="text-2xl font-bold text-purple-600">
                      {metrics?.recentMovements || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="rounded-lg bg-green-100 p-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      Activité Récente
                    </h3>
                    <p className="text-lg font-bold text-green-600">En cours</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Mouvements d'Inventaire
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center">
                <ShoppingCart className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                <p className="mb-3 text-sm text-gray-500">
                  Historique complet des mouvements disponible
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push('/owner/movements')}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Voir la page Mouvements
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-3">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="rounded-lg bg-green-100 p-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      Chiffre d'Affaires
                    </h3>
                    <p className="text-2xl font-bold text-green-600">
                      {new Intl.NumberFormat('ar-MA', {
                        style: 'currency',
                        currency: 'MAD',
                      }).format((metrics?.totalRevenue || 0) / 100)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="rounded-lg bg-blue-100 p-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      Analyses
                    </h3>
                    <p className="text-lg font-bold text-blue-600">
                      Disponibles
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Rapports et Analyses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center">
                <BarChart3 className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                <p className="mb-3 text-sm text-gray-500">
                  Rapports détaillés et analyses disponibles
                </p>
                <Button size="sm" variant="outline">
                  <Eye className="mr-2 h-4 w-4" />
                  Voir les Analyses
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
})
