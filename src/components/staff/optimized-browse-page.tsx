'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/contexts/cart-context'
// Layout removed - using optimized version
import { OptimizedCategorySidebar } from './optimized-category-sidebar'
import { OptimizedProductGrid } from './optimized-product-grid'
import { ProductSearch } from '@/components/products/product-search'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Grid3X3,
  List,
  SlidersHorizontal,
  Package,
  TrendingUp,
  Search,
  ShoppingCart,
} from 'lucide-react'

interface SearchParams {
  q?: string
  category?: string
  cursor?: string
}

interface OptimizedBrowsePageProps {
  searchParams: SearchParams
}

export function OptimizedBrowsePage({
  searchParams,
}: OptimizedBrowsePageProps) {
  const router = useRouter()
  const { cart, getCartItemCount } = useCart()
  const [searchQuery, setSearchQuery] = useState(searchParams.q || '')
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.category || ''
  )
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)

  // Memoized URL parameters to prevent unnecessary re-renders
  const memoizedSearchParams = useMemo(() => searchParams, [
    searchParams.q,
    searchParams.category,
    searchParams.cursor,
  ])

  // Memoized handlers to prevent unnecessary re-renders
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    const params = new URLSearchParams()
    if (query) params.append('q', query)
    if (selectedCategory) params.append('category', selectedCategory)

    const newUrl = `/browse?${params.toString()}`
    router.push(newUrl)
  }, [selectedCategory, router])

  const handleCategorySelect = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId)
    const params = new URLSearchParams()
    if (searchQuery) params.append('q', searchQuery)
    if (categoryId) params.append('category', categoryId)

    const newUrl = `/browse?${params.toString()}`
    router.push(newUrl)
  }, [searchQuery, router])

  const handleViewModeChange = useCallback((mode: 'grid' | 'list') => {
    setViewMode(mode)
  }, [])

  const handleFiltersToggle = useCallback(() => {
    setShowFilters(prev => !prev)
  }, [])

  // Memoized navigation handlers
  const handleCartNavigation = useCallback(() => {
    router.push('/cart')
  }, [router])

  const handleDashboardNavigation = useCallback(() => {
    router.push('/dashboard')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white shadow-lg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 p-2">
                  <Search className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Catalogue Produits
                  </h1>
                  <p className="text-sm text-gray-600">
                    Parcourez et gérez les produits
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Search Bar */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Rechercher des produits..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
              </div>

              {/* Cart Button */}
              <Button
                onClick={handleCartNavigation}
                className="bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg hover:from-green-700 hover:to-green-800"
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Panier ({getCartItemCount()})
              </Button>

              {/* Dashboard Button */}
              <Button
                variant="outline"
                onClick={handleDashboardNavigation}
                className="flex items-center space-x-2"
              >
                <Package className="h-4 w-4" />
                <span>Retour au Dashboard</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Left Sidebar - Categories and Filters */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-6">
            {/* Quick Stats */}
            <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="rounded-lg bg-blue-100 p-2">
                    <Package className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      Catalogue
                    </div>
                    <div className="text-xs text-gray-600">
                      Produits disponibles
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Category Sidebar */}
            <OptimizedCategorySidebar
              selectedCategory={selectedCategory}
              onCategorySelect={handleCategorySelect}
            />

            {/* Quick Actions */}
            <Card>
              <CardContent className="p-4">
                <h3 className="mb-3 font-semibold text-gray-900">
                  Actions Rapides
                </h3>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={handleCartNavigation}
                  >
                    <Package className="mr-2 h-4 w-4" />
                    Voir le Panier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={handleDashboardNavigation}
                  >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Retour au Tableau
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3">
          {/* Top Controls */}
          <div className="mb-6 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {searchQuery
                    ? `Résultats pour "${searchQuery}"`
                    : 'Catalogue Produits'}
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  {selectedCategory
                    ? `Filtré par catégorie`
                    : 'Tous les produits disponibles'}
                </p>
              </div>
              {searchQuery && (
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-800"
                >
                  Recherche active
                </Badge>
              )}
            </div>

            {/* View Controls */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center rounded-lg bg-gray-100 p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleViewModeChange('grid')}
                  className="h-8 w-8 p-0"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleViewModeChange('list')}
                  className="h-8 w-8 p-0"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleFiltersToggle}
                className="flex items-center space-x-2"
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span>Filtres</span>
              </Button>
            </div>
          </div>

          {/* Product Grid */}
          <OptimizedProductGrid
            searchParams={memoizedSearchParams}
            viewMode={viewMode}
          />
        </div>
      </div>
      </main>
    </div>
  )
}
