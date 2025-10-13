'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
// Layout removed - using optimized version
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  ShoppingCart,
  CheckCircle,
  AlertTriangle,
  Loader2,
  X,
  Plus,
  Minus,
  ArrowLeft,
  Package,
  CreditCard,
  Receipt,
  Trash2,
  User,
  Clock,
  TrendingUp,
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

interface CartItem {
  product: Product
  quantity: number
}

export function OptimizedCartPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const {
    cart,
    updateCartQuantity,
    removeFromCart,
    calculateTotal,
    clearCart,
    getCartItemCount,
  } = useCart()
  const [isProcessingSale, setIsProcessingSale] = useState(false)
  const [saleError, setSaleError] = useState('')
  const [saleSuccess, setSaleSuccess] = useState('')

  // Memoized calculations to prevent unnecessary re-renders
  const totalItems = useMemo(() => getCartItemCount(), [getCartItemCount])
  const totalAmount = useMemo(() => calculateTotal(), [calculateTotal])

  // Memoized handlers to prevent unnecessary re-renders
  const processSale = useCallback(async () => {
    if (cart.length === 0) return

    setIsProcessingSale(true)
    setSaleError('')
    setSaleSuccess('')

    try {
      const movements = cart.map((item) => ({
        productId: item.product.id,
        type: 'SALE_OFFLINE',
        qty: item.quantity,
        unitPriceCents: item.product.priceCents,
        note: `Vente - ${item.quantity}x ${item.product.name}`,
      }))

      const response = await fetch('/api/movements/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movements }),
      })

      if (response.ok) {
        setSaleSuccess(
          `Vente enregistrée avec succès! Total: ${totalAmount.toFixed(2)} MAD`
        )
        clearCart()
        // Redirect to browse page after 2 seconds
        setTimeout(() => {
          router.push('/browse')
        }, 2000)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erreur lors de l'enregistrement")
      }
    } catch (err) {
      setSaleError(err instanceof Error ? err.message : 'Erreur inattendue')
    } finally {
      setIsProcessingSale(false)
    }
  }, [cart, totalAmount, clearCart, router])

  const clearMessages = useCallback(() => {
    setSaleError('')
    setSaleSuccess('')
  }, [])

  const handleCartNavigation = useCallback(() => {
    router.push('/browse')
  }, [router])

  const handleContinueShopping = useCallback(() => {
    router.push('/browse')
  }, [router])

  // Memoized quantity update handlers
  const handleQuantityUpdate = useCallback((productId: string, newQuantity: number) => {
    updateCartQuantity(productId, newQuantity)
  }, [updateCartQuantity])

  const handleQuantityDecrease = useCallback((productId: string, currentQuantity: number) => {
    handleQuantityUpdate(productId, currentQuantity - 1)
  }, [handleQuantityUpdate])

  const handleQuantityIncrease = useCallback((productId: string, currentQuantity: number) => {
    handleQuantityUpdate(productId, currentQuantity + 1)
  }, [handleQuantityUpdate])

  const handleRemoveItem = useCallback((productId: string) => {
    removeFromCart(productId)
  }, [removeFromCart])

  // Memoized empty cart state
  const EmptyCartState = useMemo(() => (
    <div className="flex min-h-[calc(100vh-300px)] items-center justify-center">
      <Card className="w-full max-w-md p-8 text-center">
        <CardContent>
          <div className="flex flex-col items-center space-y-6">
            <div className="rounded-full bg-gray-100 p-6">
              <ShoppingCart className="h-16 w-16 text-gray-300" />
            </div>
            <div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">
                Votre panier est vide
              </h3>
              <p className="mb-6 text-gray-500">
                Ajoutez des produits depuis le catalogue pour commencer une
                vente.
              </p>
            </div>
            <Button
              onClick={handleCartNavigation}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Parcourir les produits
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  ), [handleCartNavigation])

  // Memoized unauthorized state
  const UnauthorizedState = useMemo(() => (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
      <Card className="w-full max-w-md p-8 text-center">
        <CardHeader>
          <ShoppingCart className="mx-auto mb-4 h-16 w-16 text-gray-400" />
          <CardTitle className="text-2xl font-bold">
            Accès non autorisé
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-6 text-gray-600">
            Veuillez vous connecter pour accéder à votre panier.
          </p>
          <Button
            onClick={() => router.push('/auth/signin')}
            className="w-full"
          >
            Se connecter
          </Button>
        </CardContent>
      </Card>
    </div>
  ), [router])

  // Memoized cart item component
  const CartItemComponent = useMemo(() => {
    return ({ item }: { item: CartItem }) => (
      <Card
        key={item.product.id}
        className="transition-shadow hover:shadow-md"
      >
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            {/* Product Image */}
            <div className="relative h-16 w-16 flex-shrink-0">
              {item.product.images[0] ? (
                <RobustImage
                  src={item.product.images[0].url}
                  alt={
                    item.product.images[0].alt || item.product.name
                  }
                  fill
                  className="rounded-md object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-md bg-gray-100">
                  <Package className="h-6 w-6 text-gray-300" />
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="min-w-0 flex-1">
              <h4 className="truncate font-semibold text-gray-900">
                {item.product.name}
              </h4>
              <div className="mt-1 flex items-center space-x-4 text-sm text-gray-600">
                {item.product.sku && (
                  <span>SKU: {item.product.sku}</span>
                )}
                <span>Stock: {item.product.stockCached}</span>
                {item.product.category && (
                  <span>• {item.product.category.name}</span>
                )}
              </div>
            </div>

            {/* Price and Quantity Controls */}
            <div className="flex items-center space-x-4">
              {/* Unit Price */}
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {new Intl.NumberFormat('ar-MA', {
                    style: 'currency',
                    currency: 'MAD',
                  }).format(item.product.priceCents / 100)}
                </p>
                <p className="text-xs text-gray-500">unité</p>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleQuantityDecrease(item.product.id, item.quantity)}
                  className="h-8 w-8 p-0"
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center font-medium">
                  {item.quantity}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleQuantityIncrease(item.product.id, item.quantity)}
                  disabled={item.quantity >= item.product.stockCached}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              {/* Line Total */}
              <div className="min-w-[80px] text-right">
                <p className="font-semibold text-gray-900">
                  {new Intl.NumberFormat('ar-MA', {
                    style: 'currency',
                    currency: 'MAD',
                  }).format(
                    (item.quantity * item.product.priceCents) / 100
                  )}
                </p>
                <p className="text-xs text-gray-500">
                  {item.quantity} ×{' '}
                  {new Intl.NumberFormat('ar-MA', {
                    style: 'currency',
                    currency: 'MAD',
                  }).format(item.product.priceCents / 100)}
                </p>
              </div>

              {/* Remove Button */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleRemoveItem(item.product.id)}
                className="text-red-500 hover:bg-red-50 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }, [handleQuantityDecrease, handleQuantityIncrease, handleRemoveItem])

  // Show unauthorized state if not logged in
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50">
        {UnauthorizedState}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white shadow-lg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="rounded-lg bg-gradient-to-r from-green-600 to-green-700 p-2">
                  <ShoppingCart className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Panier de Vente
                  </h1>
                  <p className="text-sm text-gray-600">
                    Gérez les ventes et transactions
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push('/browse')}
                className="flex items-center space-x-2"
              >
                <Package className="h-4 w-4" />
                <span>Continuer Shopping</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Success/Error Messages */}
      {saleError && (
        <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-red-800">
            {saleError}
          </AlertDescription>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearMessages}
            className="ml-auto"
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}

      {saleSuccess && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {saleSuccess}
          </AlertDescription>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearMessages}
            className="ml-auto"
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}

      {cart.length === 0 ? (
        EmptyCartState
      ) : (
        // Cart with Items
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Cart Items */}
          <div className="space-y-4 lg:col-span-2">
            {/* Cart Header */}
            <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="rounded-lg bg-blue-100 p-2">
                      <ShoppingCart className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        Articles dans le panier
                      </h2>
                      <p className="text-sm text-gray-600">
                        {totalItems} article{totalItems !== 1 ? 's' : ''} •{' '}
                        {cart.length} produit{cart.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearCart}
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Vider
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Cart Items List */}
            <div className="space-y-3">
              {cart.map((item) => (
                <CartItemComponent key={item.product.id} item={item} />
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              {/* Order Summary Card */}
              <Card className="shadow-lg">
                <CardHeader className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
                  <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
                    <Receipt className="mr-2 h-5 w-5 text-green-600" />
                    Résumé de la commande
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Order Details */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Articles:</span>
                        <span className="font-medium">{totalItems}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Produits:</span>
                        <span className="font-medium">{cart.length}</span>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between text-lg font-semibold">
                        <span>Total:</span>
                        <span className="text-green-600">
                          {totalAmount.toFixed(2)} MAD
                        </span>
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <CreditCard className="h-4 w-4" />
                        <span>Paiement en espèces</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <User className="h-4 w-4" />
                        <span>
                          Vendeur: {session?.user?.name || 'Personnel'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>{new Date().toLocaleString('fr-FR')}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  className="h-12 w-full bg-gradient-to-r from-green-600 to-green-700 text-lg shadow-lg hover:from-green-700 hover:to-green-800"
                  onClick={processSale}
                  disabled={isProcessingSale}
                >
                  {isProcessingSale ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-5 w-5" />
                      Finaliser la Vente
                    </>
                  )}
                </Button>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={handleContinueShopping}
                    className="flex items-center justify-center"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Continuer
                  </Button>
                  <Button
                    variant="outline"
                    onClick={clearCart}
                    className="flex items-center justify-center text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Vider
                  </Button>
                </div>
              </div>

              {/* Quick Stats */}
              <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="rounded-lg bg-blue-100 p-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        Vente en cours
                      </div>
                      <div className="text-xs text-gray-600">
                        Valeur: {totalAmount.toFixed(2)} MAD
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
      </main>
    </div>
  )
}
