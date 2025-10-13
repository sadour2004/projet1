'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Package,
  Search,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from 'lucide-react'

interface Product {
  id: string
  name: string
  sku?: string
  stockCached: number
  priceCents: number
  currency: string
  category?: {
    name: string
  }
}

export function AdjustmentForm() {
  const [searchQuery, setSearchQuery] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [adjustmentQty, setAdjustmentQty] = useState('')
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const searchProducts = async (query: string) => {
    if (query.length < 2) {
      setProducts([])
      return
    }

    try {
      const response = await fetch(
        `/api/products?q=${encodeURIComponent(query)}&isActive=true&limit=10`
      )
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('Failed to search products:', error)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchProducts(searchQuery)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedProduct || !adjustmentQty || !reason) {
      setMessage({ type: 'error', text: 'Veuillez remplir tous les champs' })
      return
    }

    const qty = parseInt(adjustmentQty)
    if (isNaN(qty) || qty === 0) {
      setMessage({
        type: 'error',
        text: 'La quantité doit être un nombre non nul',
      })
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    try {
      const response = await fetch('/api/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          type: 'ADJUSTMENT',
          qty: qty,
          note: reason,
        }),
      })

      if (response.ok) {
        setMessage({
          type: 'success',
          text: `Ajustement enregistré avec succès! Stock ${qty > 0 ? 'augmenté' : 'diminué'} de ${Math.abs(qty)} unités.`,
        })
        // Reset form
        setSelectedProduct(null)
        setAdjustmentQty('')
        setReason('')
        setSearchQuery('')
        setProducts([])

        // Clear success message after 5 seconds
        setTimeout(() => setMessage(null), 5000)
      } else {
        const errorData = await response.json()
        setMessage({
          type: 'error',
          text: errorData.error || "Erreur lors de l'ajustement",
        })
      }
    } catch (error) {
      console.error('Failed to create adjustment:', error)
      setMessage({ type: 'error', text: 'Erreur de connexion' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getNewStock = () => {
    if (!selectedProduct || !adjustmentQty)
      return selectedProduct?.stockCached || 0
    const qty = parseInt(adjustmentQty)
    if (isNaN(qty)) return selectedProduct.stockCached
    return selectedProduct.stockCached + qty
  }

  const getAdjustmentType = () => {
    const qty = parseInt(adjustmentQty)
    if (isNaN(qty) || qty === 0) return null
    return qty > 0 ? 'increase' : 'decrease'
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      {/* Adjustment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-semibold">
            <Package className="mr-2 h-6 w-6" />
            Ajustement de Stock
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {message && (
              <div
                className={`flex items-center rounded-lg p-4 ${
                  message.type === 'success'
                    ? 'border border-green-200 bg-green-50 text-green-700'
                    : 'border border-red-200 bg-red-50 text-red-700'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle className="mr-2 h-5 w-5" />
                ) : (
                  <AlertTriangle className="mr-2 h-5 w-5" />
                )}
                {message.text}
              </div>
            )}

            {/* Product Search */}
            <div>
              <Label htmlFor="product-search">Rechercher un produit</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="product-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Nom, SKU ou description..."
                  className="pl-10"
                />
              </div>

              {/* Search Results */}
              {products.length > 0 && (
                <div className="mt-2 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                  {products.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => {
                        setSelectedProduct(product)
                        setSearchQuery('')
                        setProducts([])
                      }}
                      className="w-full border-b border-gray-100 p-3 text-left last:border-b-0 hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">
                            {product.name}
                          </div>
                          {product.sku && (
                            <div className="text-sm text-gray-500">
                              SKU: {product.sku}
                            </div>
                          )}
                          {product.category && (
                            <div className="text-sm text-gray-500">
                              {product.category.name}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900">
                            Stock: {product.stockCached}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Intl.NumberFormat('ar-MA', {
                              style: 'currency',
                              currency: product.currency,
                            }).format(product.priceCents / 100)}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Product */}
            {selectedProduct && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <h3 className="mb-2 font-medium text-blue-900">
                  Produit sélectionné:
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-blue-900">
                      {selectedProduct.name}
                    </div>
                    {selectedProduct.sku && (
                      <div className="text-sm text-blue-700">
                        SKU: {selectedProduct.sku}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-blue-900">
                      Stock actuel: {selectedProduct.stockCached}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Adjustment Quantity */}
            <div>
              <Label htmlFor="adjustment-qty">Quantité d'ajustement</Label>
              <div className="relative">
                <Input
                  id="adjustment-qty"
                  type="number"
                  value={adjustmentQty}
                  onChange={(e) => setAdjustmentQty(e.target.value)}
                  placeholder="+10 pour augmenter, -5 pour diminuer"
                  className="pl-10"
                  required
                />
                {getAdjustmentType() === 'increase' && (
                  <TrendingUp className="absolute left-3 top-3 h-4 w-4 text-green-600" />
                )}
                {getAdjustmentType() === 'decrease' && (
                  <TrendingDown className="absolute left-3 top-3 h-4 w-4 text-red-600" />
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Utilisez des nombres positifs pour augmenter le stock, négatifs
                pour le diminuer
              </p>
            </div>

            {/* New Stock Preview */}
            {selectedProduct && adjustmentQty && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Nouveau stock:
                  </span>
                  <span
                    className={`font-bold ${
                      getNewStock() < 0 ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {getNewStock()}
                  </span>
                </div>
                {getNewStock() < 0 && (
                  <p className="mt-1 text-xs text-red-600">
                    ⚠️ Le stock ne peut pas être négatif
                  </p>
                )}
              </div>
            )}

            {/* Reason */}
            <div>
              <Label htmlFor="reason">Raison de l'ajustement</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Expliquez la raison de cet ajustement (inventaire, perte, erreur, etc.)"
                rows={3}
                required
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !selectedProduct ||
                !adjustmentQty ||
                !reason ||
                getNewStock() < 0
              }
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Package className="mr-2 h-4 w-4" />
                  Enregistrer l'Ajustement
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                <span className="text-xs font-medium text-blue-600">1</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">
                  Rechercher le produit
                </h3>
                <p className="text-sm text-gray-600">
                  Tapez le nom, SKU ou description du produit à ajuster
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                <span className="text-xs font-medium text-blue-600">2</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">
                  Sélectionner le produit
                </h3>
                <p className="text-sm text-gray-600">
                  Cliquez sur le produit dans la liste de résultats
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                <span className="text-xs font-medium text-blue-600">3</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">
                  Spécifier l'ajustement
                </h3>
                <p className="text-sm text-gray-600">
                  Entrez la quantité: +10 pour augmenter, -5 pour diminuer
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                <span className="text-xs font-medium text-blue-600">4</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">
                  Expliquer la raison
                </h3>
                <p className="text-sm text-gray-600">
                  Documentez pourquoi cet ajustement est nécessaire
                </p>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="mb-2 font-medium text-gray-900">
              Types d'ajustements courants:
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                • <strong>Inventaire physique:</strong> Correction après
                comptage
              </li>
              <li>
                • <strong>Perte/Vol:</strong> Articles endommagés ou volés
              </li>
              <li>
                • <strong>Erreur de saisie:</strong> Correction d'erreurs
                précédentes
              </li>
              <li>
                • <strong>Retour fournisseur:</strong> Articles retournés
              </li>
              <li>
                • <strong>Échantillons:</strong> Articles donnés ou testés
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
