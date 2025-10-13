'use client'

import { useState, useEffect, useMemo } from 'react'
import { OptimizedProductsHeader } from './optimized-products-header'
import { OptimizedProductsTable } from './optimized-products-table'

interface Product {
  id: string
  name: string
  slug: string
  description?: string | null
  sku?: string | null
  priceCents: number
  currency: string
  isActive: boolean
  stockCached: number
  createdAt: string
  updatedAt: string
  images: Array<{
    id: string
    url: string
    alt?: string | null
  }>
  category?: {
    id: string
    name: string
  } | null
  _count: {
    movements: number
  }
}

interface Category {
  id: string
  name: string
}

interface ProductStats {
  totalProducts: number
  lowStockProducts: number
  outOfStockProducts: number
  activeProducts: number
}

interface SearchParams {
  q?: string
  category?: string
  isActive?: string
}

interface OptimizedProductsPageProps {
  searchParams: SearchParams
}

export function OptimizedProductsPage({ searchParams }: OptimizedProductsPageProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [productStats, setProductStats] = useState<ProductStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Memoize search params to prevent unnecessary API calls
  const memoizedSearchParams = useMemo(() => searchParams, [
    searchParams.q,
    searchParams.category,
    searchParams.isActive,
  ])

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setIsLoading(true)
        setError('')

        // Build params for products API
        const params = new URLSearchParams()
        if (memoizedSearchParams.q) params.append('q', memoizedSearchParams.q)
        if (memoizedSearchParams.category && memoizedSearchParams.category !== 'all') {
          params.append('category', memoizedSearchParams.category)
        }
        if (memoizedSearchParams.isActive && memoizedSearchParams.isActive !== 'all') {
          params.append('isActive', memoizedSearchParams.isActive)
        }
        params.append('limit', '50')

        // Fetch all data in parallel
        const [productsResponse, categoriesResponse, dashboardResponse, lowStockResponse] = await Promise.all([
          fetch(`/api/products?${params.toString()}`),
          fetch('/api/categories'),
          fetch('/api/analytics/dashboard'),
          fetch('/api/analytics/low-stock?threshold=10')
        ])

        if (!productsResponse.ok) {
          throw new Error('Failed to fetch products')
        }

        const productsData = await productsResponse.json()
        setProducts(productsData.products || [])

        // Handle categories
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json()
          setCategories(categoriesData.categories || [])
        }

        // Calculate product stats
        const dashboardData = dashboardResponse.ok ? await dashboardResponse.json() : {}
        const lowStockData = lowStockResponse.ok ? await lowStockResponse.json() : { products: [] }

        setProductStats({
          totalProducts: dashboardData.totalProducts || 0,
          activeProducts: dashboardData.totalProducts || 0,
          lowStockProducts: lowStockData.products?.length || 0,
          outOfStockProducts: dashboardData.outOfStockProducts || 0,
        })

      } catch (err) {
        console.error('Failed to fetch products data:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch products data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAllData()
  }, [memoizedSearchParams]) // Only depend on memoized search params

  if (error) {
    return (
      <div className="py-8 text-center">
        <div className="mb-4 text-red-600">
          <h3 className="text-lg font-semibold">Erreur de chargement</h3>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <OptimizedProductsHeader stats={productStats} isLoading={isLoading} />
      
      <div className="mt-8">
        <OptimizedProductsTable 
          searchParams={memoizedSearchParams} 
          products={products}
          categories={categories}
          isLoading={isLoading}
        />
      </div>
    </>
  )
}
