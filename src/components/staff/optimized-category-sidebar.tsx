'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Package, ChevronRight, Grid3X3, TrendingUp, Clock } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  _count?: {
    products: number
  }
}

interface OptimizedCategorySidebarProps {
  selectedCategory?: string
  onCategorySelect: (categoryId: string) => void
}

export function OptimizedCategorySidebar({
  selectedCategory,
  onCategorySelect,
}: OptimizedCategorySidebarProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Memoized fetch function to prevent unnecessary re-creation
  const fetchCategories = useCallback(async () => {
    setIsLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        // Handle both response formats: direct array or { categories: array }
        setCategories(Array.isArray(data) ? data : data.categories || [])
      } else {
        throw new Error('Failed to fetch categories')
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      setError('Failed to load categories')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // Memoized handlers to prevent unnecessary re-renders
  const handleCategoryClick = useCallback((categoryId: string) => {
    if (selectedCategory === categoryId) {
      onCategorySelect('') // Deselect if already selected
    } else {
      onCategorySelect(categoryId)
    }
  }, [selectedCategory, onCategorySelect])

  // Memoized calculations to prevent unnecessary re-computations
  const totalProducts = useMemo(() => {
    return categories.reduce(
      (total, cat) => total + (cat._count?.products || 0),
      0
    )
  }, [categories])

  // Loading skeleton component
  const LoadingSkeleton = useMemo(() => (
    <div className="p-4">
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 w-3/4 rounded bg-gray-200"></div>
          </div>
        ))}
      </div>
    </div>
  ), [])

  // Error state component
  const ErrorState = useMemo(() => (
    <div className="p-4 text-center">
      <div className="text-sm text-red-600">{error}</div>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={fetchCategories}
        className="mt-2"
      >
        Retry
      </Button>
    </div>
  ), [error, fetchCategories])

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
          <Grid3X3 className="mr-2 h-5 w-5 text-blue-600" />
          Catégories
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          LoadingSkeleton
        ) : error ? (
          ErrorState
        ) : (
          <div className="space-y-1">
            {/* All Products Option */}
            <Button
              variant={!selectedCategory ? 'default' : 'ghost'}
              className={`h-auto w-full justify-between p-3 ${
                !selectedCategory
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => handleCategoryClick('')}
            >
              <div className="flex items-center space-x-3">
                <Package className="h-4 w-4" />
                <span className="font-medium">Tous les produits</span>
              </div>
              <Badge
                variant={!selectedCategory ? 'secondary' : 'outline'}
                className={!selectedCategory ? 'bg-white text-blue-600' : ''}
              >
                {totalProducts}
              </Badge>
            </Button>

            {/* Category List */}
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'ghost'}
                className={`h-auto w-full justify-between p-3 ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => handleCategoryClick(category.id)}
              >
                <div className="flex items-center space-x-3">
                  <Package className="h-4 w-4" />
                  <span className="font-medium">{category.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant={
                      selectedCategory === category.id ? 'secondary' : 'outline'
                    }
                    className={
                      selectedCategory === category.id
                        ? 'bg-white text-blue-600'
                        : ''
                    }
                  >
                    {category._count?.products || 0}
                  </Badge>
                  {selectedCategory === category.id && (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </div>
              </Button>
            ))}
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-4 border-t p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-gray-600">Produits actifs</span>
              </div>
              <span className="font-medium text-gray-900">
                {totalProducts}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-gray-600">Catégories</span>
              </div>
              <span className="font-medium text-gray-900">
                {categories.length}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
