'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ArrowLeft,
  ShoppingCart,
  Package,
  Tag,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Plus,
  Minus,
  Eye,
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
  movements?: Array<{
    id: string
    type: string
    qty: number
    createdAt: string
    actor: {
      name?: string | null
      email: string
    }
  }>
}

interface OptimizedProductDetailProps {
  product: Product
}

export function OptimizedProductDetail({ product }: OptimizedProductDetailProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const { cart, addToCart, updateCartQuantity, removeFromCart } = useCart()
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Memoized cart item lookup
  const cartItem = useMemo(() => {
    return cart.find((item) => item.product.id === product.id)
  }, [cart, product.id])

  // Memoized stock status
  const stockStatus = useMemo(() => {
    if (product.stockCached === 0)
      return {
        label: 'Rupture de stock',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: AlertTriangle,
      }
    if (product.stockCached <= 5)
      return {
        label: 'Stock faible',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: TrendingUp,
      }
    return {
      label: 'En stock',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: CheckCircle,
    }
  }, [product.stockCached])

  // Memoized handlers
  const handleBackNavigation = useCallback(() => {
    router.back()
  }, [router])

  const handleBrowseNavigation = useCallback(() => {
    router.push('/browse')
  }, [router])

  const handleCartNavigation = useCallback(() => {
    router.push('/cart')
  }, [router])

  const handleQuantityChange = useCallback((newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= product.stockCached) {
      setQuantity(newQuantity)
    }
  }, [product.stockCached])

  const handleAddToCart = useCallback(async () => {
    if (!session || product.stockCached === 0) return

    setIsAddingToCart(true)
    setMessage(null)

    try {
      // Add the specified quantity to cart
      for (let i = 0; i < quantity; i++) {
        addToCart(product)
      }

      setMessage({
        type: 'success',
        text: `${quantity} ${quantity > 1 ? 'articles ajoutés' : 'article ajouté'} au panier!`
      })

      // Reset quantity after adding
      setQuantity(1)

      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      setMessage({
        type: 'error',
        text: 'Erreur lors de l\'ajout au panier'
      })
      setTimeout(() => setMessage(null), 3000)
    } finally {
      setIsAddingToCart(false)
    }
  }, [session, product, quantity, addToCart])

  const handleUpdateCartQuantity = useCallback((newQuantity: number) => {
    if (newQuantity === 0) {
      removeFromCart(product.id)
    } else {
      updateCartQuantity(product.id, newQuantity)
    }
  }, [product.id, removeFromCart, updateCartQuantity])

  // Memoized recent movements
  const recentMovements = useMemo(() => {
    return product.movements?.slice(0, 5) || []
  }, [product.movements])

  // Memoized image gallery
  const ImageGallery = useMemo(() => {
    if (!product.images || product.images.length === 0) {
      return (
        <div className="flex aspect-square items-center justify-center rounded-lg bg-gray-100">
          <Package className="h-24 w-24 text-gray-300" />
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {/* Main Image */}
        <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
          <RobustImage
            src={product.images[selectedImageIndex].url}
            alt={product.images[selectedImageIndex].alt || product.name}
            fill
            className="object-cover"
          />
        </div>

        {/* Thumbnail Gallery */}
        {product.images.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {product.images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImageIndex(index)}
                className={`aspect-square overflow-hidden rounded-md border-2 transition-colors ${
                  selectedImageIndex === index
                    ? 'border-blue-500'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <RobustImage
                  src={image.url}
                  alt={image.alt || product.name}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }, [product.images, product.name, selectedImageIndex])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackNavigation}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Retour</span>
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-lg font-semibold text-gray-900">
                Détails du produit
              </h1>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={handleBrowseNavigation}
                className="flex items-center space-x-2"
              >
                <Eye className="h-4 w-4" />
                <span>Parcourir</span>
              </Button>
              {session && (
                <Button
                  onClick={handleCartNavigation}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span>Panier</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Success/Error Messages */}
        {message && (
          <Alert className={`mb-6 ${
            message.type === 'success' 
              ? 'border-green-200 bg-green-50' 
              : 'border-red-200 bg-red-50'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={
              message.type === 'success' ? 'text-green-800' : 'text-red-800'
            }>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Product Images */}
          <div>
            {ImageGallery}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Product Header */}
            <div>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {product.name}
                  </h1>
                  {product.sku && (
                    <p className="mt-2 text-sm text-gray-600">
                      SKU: {product.sku}
                    </p>
                  )}
                </div>
                <Badge className={`${stockStatus.color} shadow-sm`}>
                  <stockStatus.icon className="mr-1 h-3 w-3" />
                  {stockStatus.label}
                </Badge>
              </div>

              {product.description && (
                <p className="mt-4 text-gray-700 leading-relaxed">
                  {product.description}
                </p>
              )}
            </div>

            {/* Price and Stock */}
            <div className="rounded-lg border bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-blue-600">
                    {new Intl.NumberFormat('ar-MA', {
                      style: 'currency',
                      currency: product.currency,
                    }).format(product.priceCents / 100)}
                  </p>
                  <p className="text-sm text-gray-600">Prix unitaire</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold text-gray-900">
                    {product.stockCached}
                  </p>
                  <p className="text-sm text-gray-600">En stock</p>
                </div>
              </div>
            </div>

            {/* Category */}
            {product.category && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Tag className="h-4 w-4" />
                <span>Catégorie: {product.category.name}</span>
              </div>
            )}

            {/* Add to Cart */}
            {session && product.stockCached > 0 && (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-700">
                    Quantité:
                  </span>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuantityChange(quantity - 1)}
                      disabled={quantity <= 1}
                      className="h-8 w-8 p-0"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-12 text-center font-medium">
                      {quantity}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuantityChange(quantity + 1)}
                      disabled={quantity >= product.stockCached}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {cartItem ? (
                  <div className="space-y-3">
                    <div className="rounded-lg border bg-blue-50 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-900">
                          Dans le panier: {cartItem.quantity} article{cartItem.quantity > 1 ? 's' : ''}
                        </span>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateCartQuantity(cartItem.quantity - 1)}
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
                            onClick={() => handleUpdateCartQuantity(cartItem.quantity + 1)}
                            disabled={cartItem.quantity >= product.stockCached}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={handleAddToCart}
                    disabled={isAddingToCart || quantity > product.stockCached}
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    {isAddingToCart ? (
                      <>
                        <Package className="mr-2 h-4 w-4 animate-pulse" />
                        Ajout en cours...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Ajouter au panier
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}

            {/* Out of Stock Message */}
            {product.stockCached === 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span className="font-medium text-red-800">
                    Produit en rupture de stock
                  </span>
                </div>
                <p className="mt-1 text-sm text-red-600">
                  Ce produit n'est actuellement pas disponible.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Movements */}
        {recentMovements.length > 0 && (
          <div className="mt-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Mouvements récents</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentMovements.map((movement) => (
                    <div
                      key={movement.id}
                      className="flex items-center justify-between rounded-lg border bg-gray-50 p-3"
                    >
                      <div className="flex items-center space-x-3">
                        <Badge
                          variant={
                            movement.type === 'SALE_OFFLINE'
                              ? 'default'
                              : movement.qty > 0
                              ? 'secondary'
                              : 'destructive'
                          }
                        >
                          {movement.type}
                        </Badge>
                        <span className="text-sm font-medium">
                          {movement.qty > 0 ? '+' : ''}{movement.qty}
                        </span>
                      </div>
                      <div className="text-right text-sm text-gray-600">
                        <div>{movement.actor.name || movement.actor.email}</div>
                        <div>
                          {new Date(movement.createdAt).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
