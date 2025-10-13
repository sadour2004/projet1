'use client'

import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Package,
  Search,
  Filter,
  Edit,
  Eye,
  EyeOff,
  AlertTriangle,
  Plus,
  Trash2,
} from 'lucide-react'
import { RobustImage } from '@/components/ui/robust-image'

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

interface OptimizedProductsTableProps {
  searchParams: {
    q?: string
    category?: string
    isActive?: string
    cursor?: string
  }
  products?: Product[]
  categories?: Category[]
  isLoading?: boolean
}

const OptimizedProductsTableComponent = ({ 
  searchParams, 
  products: propProducts, 
  categories: propCategories, 
  isLoading: propIsLoading 
}: OptimizedProductsTableProps) => {
  const router = useRouter()
  const { data: session } = useSession()
  const [products, setProducts] = useState<Product[]>(propProducts || [])
  const [categories, setCategories] = useState<Category[]>(propCategories || [])
  const [isLoading, setIsLoading] = useState(propIsLoading ?? true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Check if user has OWNER role
  const isOwner = session?.user?.role === 'OWNER'
  
  // Local filter state that syncs with URL params
  const [filters, setFilters] = useState({
    q: searchParams.q || '',
    category: searchParams.category || '',
    isActive: searchParams.isActive || '',
  })

  // Update products and categories when props change
  useEffect(() => {
    if (propProducts) {
      setProducts(propProducts)
    }
  }, [propProducts])

  useEffect(() => {
    if (propCategories) {
      setCategories(propCategories)
    }
  }, [propCategories])

  useEffect(() => {
    if (propIsLoading !== undefined) {
      setIsLoading(propIsLoading)
    }
  }, [propIsLoading])

  // Update filters when searchParams change
  useEffect(() => {
    setFilters({
      q: searchParams.q || '',
      category: searchParams.category || '',
      isActive: searchParams.isActive || '',
    })
  }, [searchParams])

  const fetchProducts = useCallback(async () => {
    // Skip if products are provided via props
    if (propProducts) return

    try {
      setIsLoading(true)
      setError('')

      const params = new URLSearchParams()
      if (filters.q) params.append('q', filters.q)
      if (filters.category && filters.category !== 'all') {
        params.append('category', filters.category)
      }
      if (filters.isActive && filters.isActive !== 'all') {
        params.append('isActive', filters.isActive)
      }
      params.append('limit', '50')

      const response = await fetch(`/api/products?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      } else {
        throw new Error('Failed to fetch products')
      }
    } catch (err) {
      console.error('Failed to fetch products:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch products')
    } finally {
      setIsLoading(false)
    }
  }, [filters, propProducts])

  const fetchCategories = useCallback(async () => {
    // Skip if categories are provided via props
    if (propCategories) return

    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    }
  }, [propCategories])

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [fetchProducts, fetchCategories])

  // Handle filter changes and update URL
  const handleFilterChange = useCallback((key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)

    // Update URL with new filters
    const params = new URLSearchParams()
    if (newFilters.q) params.append('q', newFilters.q)
    if (newFilters.category && newFilters.category !== 'all') {
      params.append('category', newFilters.category)
    }
    if (newFilters.isActive && newFilters.isActive !== 'all') {
      params.append('isActive', newFilters.isActive)
    }

    const newUrl = params.toString() ? `/owner/products?${params.toString()}` : '/owner/products'
    router.push(newUrl)
  }, [filters, router])

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({ q: '', category: '', isActive: '' })
    router.push('/owner/products')
  }, [router])

  // Delete product function
  const deleteProduct = async (productId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return

    try {
      setDeletingId(productId)
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setProducts(products.filter((p) => p.id !== productId))
      } else {
        throw new Error('Failed to delete product')
      }
    } catch (err) {
      console.error('Failed to delete product:', err)
      alert('Erreur lors de la suppression du produit')
    } finally {
      setDeletingId(null)
    }
  }

  // Toggle product active status
  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      })

      if (response.ok) {
        setProducts(products.map((p) => 
          p.id === productId ? { ...p, isActive: !currentStatus } : p
        ))
      } else {
        throw new Error('Failed to update product status')
      }
    } catch (err) {
      console.error('Failed to update product status:', err)
      alert('Erreur lors de la mise à jour du statut du produit')
    }
  }

  // Format price
  const formatPrice = (priceCents: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency || 'EUR',
    }).format(priceCents / 100)
  }

  // Get stock status
  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Rupture', color: 'bg-red-100 text-red-800' }
    if (stock < 10) return { label: 'Stock faible', color: 'bg-yellow-100 text-yellow-800' }
    return { label: 'En stock', color: 'bg-green-100 text-green-800' }
  }

  // Check if any filters are active
  const hasActiveFilters = filters.q || (filters.category && filters.category !== 'all') || (filters.isActive && filters.isActive !== 'all')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Liste des Produits</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">
              {products.length} produit(s)
            </Badge>
            {isOwner && (
              <Button asChild size="sm">
                <a href="/owner/products/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un produit
                </a>
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom, SKU ou description..."
                  value={filters.q}
                  onChange={(e) => handleFilterChange('q', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex space-x-2">
              <Select
                value={filters.category}
                onValueChange={(value) => handleFilterChange('category', value)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Toutes les catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.isActive}
                onValueChange={(value) => handleFilterChange('isActive', value)}
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="true">Actifs</SelectItem>
                  <SelectItem value="false">Inactifs</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  <Filter className="mr-2 h-4 w-4" />
                  Effacer
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Products Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Mouvements</TableHead>
                {isOwner && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="h-12 w-12 animate-pulse rounded-lg bg-gray-200"></div>
                        <div className="space-y-2">
                          <div className="h-4 w-32 animate-pulse rounded bg-gray-200"></div>
                          <div className="h-3 w-24 animate-pulse rounded bg-gray-200"></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-20 animate-pulse rounded bg-gray-200"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-16 animate-pulse rounded bg-gray-200"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-12 animate-pulse rounded bg-gray-200"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-6 w-16 animate-pulse rounded bg-gray-200"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-8 animate-pulse rounded bg-gray-200"></div>
                    </TableCell>
                    {isOwner && (
                      <TableCell>
                        <div className="h-8 w-16 animate-pulse rounded bg-gray-200"></div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isOwner ? 7 : 6} className="text-center py-8">
                    <div className="text-gray-500">
                      <Package className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2">Aucun produit trouvé</p>
                      {hasActiveFilters && (
                        <Button variant="outline" onClick={clearFilters} className="mt-2">
                          Effacer les filtres
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => {
                  const stockStatus = getStockStatus(product.stockCached)
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <RobustImage
                            src={product.images[0]?.url || ''}
                            alt={product.name}
                            width={48}
                            height={48}
                            className="h-12 w-12 rounded-lg object-cover"
                            fallback={
                              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                                <Package className="h-6 w-6 text-gray-400" />
                              </div>
                            }
                          />
                          <div>
                            <div className="font-medium">{product.name}</div>
                            {product.sku && (
                              <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.category ? (
                          <Badge variant="outline">{product.category.name}</Badge>
                        ) : (
                          <span className="text-gray-400">Aucune</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatPrice(product.priceCents, product.currency)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span>{product.stockCached}</span>
                          <Badge className={stockStatus.color}>
                            {stockStatus.label}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.isActive ? 'default' : 'secondary'}>
                          {product.isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell>{product._count.movements}</TableCell>
                      {isOwner && (
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleProductStatus(product.id, product.isActive)}
                            >
                              {product.isActive ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <a href={`/owner/products/${product.id}/edit`}>
                                <Edit className="h-4 w-4" />
                              </a>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteProduct(product.id)}
                              disabled={deletingId === product.id}
                            >
                              {deletingId === product.id ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

export const OptimizedProductsTable = memo(OptimizedProductsTableComponent)
