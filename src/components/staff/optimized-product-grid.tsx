'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Package,
  Plus,
  Minus,
  Eye,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { RobustImage } from '@/components/ui/robust-image'
import { useSession } from 'next-auth/react'
import { useCart } from '@/contexts/cart-context'

interface Product {
  id: string
  name: string
  slug: string
  description?: string | null
  sku?: string | null
  priceCents: number
  currency: string
  stockCached: number
  images: Array<{
    url: string
    alt?: string | null
  }>
  category?: {
    id: string
    name: string
  } | null
}

interface OptimizedProductGridProps {
  searchParams: {
    q?: string
    category?: string
    cursor?: string
  }
  viewMode: 'grid' | 'list'
}

export function OptimizedProductGrid({
  searchParams,
  viewMode,
}: OptimizedProductGridProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const { cart, addToCart, updateCartQuantity, getCartItemCount } = useCart()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')

  // Memoized search params to prevent unnecessary re-fetches
  const memoizedSearchParams = useMemo(() => searchParams, [
    searchParams.q,
    searchParams.category,
    searchParams.cursor,
  ])

  // Memoized fetch function with proper error handling
  const fetchProducts = useCallback(async (cursor?: string, append = false) => {
    if (!append) {
      setIsLoading(true)
      setError('')
    } else {
      setLoadingMore(true)
    }

    try {
      const params = new URLSearchParams()
      if (memoizedSearchParams.q) params.append('q', memoizedSearchParams.q)
      if (memoizedSearchParams.category)
        params.append('category', memoizedSearchParams.category)
      if (cursor) params.append('cursor', cursor)
      params.append('isActive', 'true')
      params.append('limit', '12')

      const response = await fetch(`/api/products?${params.toString()}`)

      if (response.ok) {
        const data = await response.json()

        if (append) {
          setProducts((prev) => [...prev, ...data.products])
        } else {
          setProducts(data.products || [])
        }

        setHasMore(data.hasMore || false)
        setNextCursor(data.nextCursor || null)
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch products`)
      }
    } catch (err) {
      console.error('Failed to fetch products:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch products')
    } finally {
      setIsLoading(false)
      setLoadingMore(false)
    }
  }, [memoizedSearchParams])

  // Effect to fetch products when search params change
  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Memoized handlers to prevent unnecessary re-renders
  const handleLoadMore = useCallback(() => {
    if (nextCursor && !loadingMore) {
      fetchProducts(nextCursor, true)
    }
  }, [nextCursor, loadingMore, fetchProducts])

  const handleProductClick = useCallback((product: Product) => {
    router.push(`/product/${product.slug}`)
  }, [router])

  // Memoized stock status function
  const getStockStatus = useCallback((stock: number) => {
    if (stock === 0)
      return {
        label: 'Rupture',
        color: 'bg-red-100 text-red-800 border-red-200',
      }
    if (stock <= 5)
      return {
        label: 'Stock faible',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      }
    return {
      label: 'En stock',
      color: 'bg-green-100 text-green-800 border-green-200',
    }
  }, [])

  // Memoized cart item lookup
  const getCartItem = useCallback((productId: string) => {
    return cart.find((item) => item.product.id === productId)
  }, [cart])

  // Memoized loading skeleton
  const LoadingSkeleton = useMemo(() => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(12)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="aspect-square rounded-t-lg bg-gray-200"></div>
            <CardContent className="p-4">
              <div className="mb-2 h-4 rounded bg-gray-200"></div>
              <div className="mb-2 h-3 w-3/4 rounded bg-gray-200"></div>
              <div className="h-3 w-1/2 rounded bg-gray-200"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  ), [])

  // Empty state component
  const EmptyState = (
    <Card className="py-12 text-center">
      <CardContent>
        <div className="flex flex-col items-center space-y-4">
          <div className="rounded-full bg-gray-100 p-4">
            <Package className="h-12 w-12 text-gray-400" />
          </div>
          <div>
            <h3 className="mb-2 text-xl font-semibold text-gray-900">
              Aucun produit trouvé
            </h3>
            <p className="max-w-md text-gray-500">
              {memoizedSearchParams.q || memoizedSearchParams.category
                ? "Essayez d'ajuster vos critères de recherche ou de filtrer"
                : 'Aucun produit disponible pour le moment'}
            </p>
          </div>
          {(memoizedSearchParams.q || memoizedSearchParams.category) && (
            <Button
              variant="outline"
              onClick={() => (window.location.href = '/browse')}
            >
              Voir tous les produits
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )

  // Error state component
  const ErrorState = (
    <Card className="py-12 text-center">
      <CardContent>
        <div className="flex flex-col items-center space-y-4">
          <div className="rounded-full bg-red-100 p-4">
            <AlertCircle className="h-12 w-12 text-red-400" />
          </div>
          <div>
            <h3 className="mb-2 text-xl font-semibold text-gray-900">
              Erreur de chargement
            </h3>
            <p className="max-w-md text-gray-500">{error}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => fetchProducts()}
          >
            Réessayer
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  // Loading state
  if (isLoading) {
    return LoadingSkeleton
  }

  // Error state
  if (error && products.length === 0) {
    return ErrorState
  }

  // Empty state
  if (products.length === 0) {
    return EmptyState
  }

  // Product card component (not memoized to avoid dependency issues)
  const ProductCard = ({ product }: { product: Product }) => {
    const stockStatus = getStockStatus(product.stockCached)
    const cartItem = getCartItem(product.id)

    return (
      <Card
        key={product.id}
        className="group overflow-hidden border-0 bg-white shadow-lg transition-all duration-300 hover:shadow-xl"
      >
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
          {product.images[0] ? (
            <RobustImage
              src={product.images[0].url}
              alt={product.images[0].alt || product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Package className="h-16 w-16 text-gray-300" />
            </div>
          )}

          {/* Stock Status Badge */}
          <div className="absolute right-3 top-3">
            <Badge className={`${stockStatus.color} shadow-md`}>
              {stockStatus.label}
            </Badge>
          </div>

          {/* Quick Actions Overlay */}
          {session && product.stockCached > 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 transition-all duration-300 group-hover:bg-opacity-20">
              <div className="translate-y-4 transform space-x-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    addToCart(product)
                  }}
                  className="bg-white text-gray-900 shadow-lg hover:bg-gray-50"
                  size="sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleProductClick(product)
                  }}
                  variant="outline"
                  className="bg-white shadow-lg hover:bg-gray-50"
                  size="sm"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Voir
                </Button>
              </div>
            </div>
          )}
        </div>

        <CardContent className="p-5">
          <div className="space-y-3">
            <div>
              <h3
                className="line-clamp-2 cursor-pointer text-lg font-bold text-gray-900 transition-colors hover:text-blue-600"
                onClick={() => handleProductClick(product)}
              >
                {product.name}
              </h3>
              {product.sku && (
                <p className="mt-1 text-xs text-gray-500">
                  SKU: {product.sku}
                </p>
              )}
            </div>

            {product.description && (
              <p className="line-clamp-2 text-sm text-gray-600">
                {product.description}
              </p>
            )}

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl font-bold text-blue-600">
                  {new Intl.NumberFormat('ar-MA', {
                    style: 'currency',
                    currency: product.currency,
                  }).format(product.priceCents / 100)}
                </p>
                {product.category && (
                  <p className="text-xs text-gray-500">
                    {product.category.name}
                  </p>
                )}
              </div>

              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">
                  Stock: {product.stockCached}
                </p>
              </div>
            </div>

            {/* Cart Quantity Controls */}
            {session && cartItem && (
              <div className="flex items-center justify-between border-t pt-2">
                <span className="text-sm text-gray-600">
                  Dans le panier:
                </span>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      updateCartQuantity(
                        product.id,
                        cartItem.quantity - 1
                      )
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center font-medium">
                    {cartItem.quantity}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      updateCartQuantity(
                        product.id,
                        cartItem.quantity + 1
                      )
                    }}
                    disabled={cartItem.quantity >= product.stockCached}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Products Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        // List View
        <div className="space-y-4">
          {products.map((product) => {
            const stockStatus = getStockStatus(product.stockCached)
            const cartItem = getCartItem(product.id)

            return (
              <Card
                key={product.id}
                className="transition-shadow hover:shadow-lg"
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    {/* Product Image */}
                    <div className="relative h-20 w-20 flex-shrink-0">
                      {product.images[0] ? (
                        <RobustImage
                          src={product.images[0].url}
                          alt={product.images[0].alt || product.name}
                          fill
                          className="rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-md bg-gray-100">
                          <Package className="h-8 w-8 text-gray-300" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3
                            className="cursor-pointer font-semibold text-gray-900 transition-colors hover:text-blue-600"
                            onClick={() => handleProductClick(product)}
                          >
                            {product.name}
                          </h3>
                          {product.sku && (
                            <p className="mt-1 text-sm text-gray-500">
                              SKU: {product.sku}
                            </p>
                          )}
                          {product.description && (
                            <p className="mt-1 line-clamp-1 text-sm text-gray-600">
                              {product.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center space-x-4">
                          {/* Stock Status */}
                          <Badge className={stockStatus.color}>
                            {stockStatus.label}
                          </Badge>

                          {/* Price */}
                          <div className="text-right">
                            <p className="text-lg font-bold text-blue-600">
                              {new Intl.NumberFormat('ar-MA', {
                                style: 'currency',
                                currency: product.currency,
                              }).format(product.priceCents / 100)}
                            </p>
                            <p className="text-sm text-gray-500">
                              Stock: {product.stockCached}
                            </p>
                          </div>

                          {/* Actions */}
                          {session && product.stockCached > 0 && (
                            <div className="flex items-center space-x-2">
                              {cartItem ? (
                                <div className="flex items-center space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      updateCartQuantity(
                                        product.id,
                                        cartItem.quantity - 1
                                      )
                                    }
                                    className="h-8 w-8 p-0"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="w-8 text-center font-medium">
                                    {cartItem.quantity}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      updateCartQuantity(
                                        product.id,
                                        cartItem.quantity + 1
                                      )
                                    }
                                    disabled={
                                      cartItem.quantity >= product.stockCached
                                    }
                                    className="h-8 w-8 p-0"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  onClick={() => addToCart(product)}
                                  size="sm"
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  Ajouter
                                </Button>
                              )}
                              <Button
                                onClick={() => handleProductClick(product)}
                                variant="outline"
                                size="sm"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Load More Button */}
      {hasMore && (
        <div className="pt-6 text-center">
          <Button
            onClick={handleLoadMore}
            disabled={loadingMore}
            variant="outline"
            className="min-w-32"
          >
            {loadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Chargement...
              </>
            ) : (
              'Charger plus'
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
