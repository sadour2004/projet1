'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { RotateCcw, Search, Package, AlertCircle, CheckCircle } from 'lucide-react'

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
  images: Array<{
    url: string
    alt?: string
  }>
}

interface ReturnProductModalProps {
  children: React.ReactNode
}

export function ReturnProductModal({ children }: ReturnProductModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [returnQuantity, setReturnQuantity] = useState(1)
  const [returnReason, setReturnReason] = useState('')
  const [notes, setNotes] = useState('')
  const [unitPrice, setUnitPrice] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null)

  // Search products
  const searchProducts = useCallback(async () => {
    if (!searchQuery.trim()) {
      setProducts([])
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/products?q=${encodeURIComponent(searchQuery)}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      } else {
        throw new Error('Failed to search products')
      }
    } catch (error) {
      console.error('Error searching products:', error)
      setNotification({type: 'error', message: 'Impossible de rechercher les produits'})
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchProducts()
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchProducts])

  // Handle product selection
  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product)
    setReturnQuantity(1)
    setUnitPrice(product.priceCents / 100) // Convert cents to main currency unit
    setSearchQuery('')
    setProducts([])
    console.log('Product selected:', product.name, 'Setting quantity to 1, price to', product.priceCents / 100)
  }

  // Handle return submission
  const handleSubmitReturn = async () => {
    if (!selectedProduct) {
      setNotification({type: 'error', message: 'Veuillez sélectionner un produit'})
      return
    }

    if (!returnQuantity || returnQuantity <= 0) {
      setNotification({type: 'error', message: 'Veuillez saisir une quantité valide (minimum 1)'})
      return
    }

    if (!returnReason) {
      setNotification({type: 'error', message: 'Veuillez sélectionner une raison de retour'})
      return
    }

    // Validate quantity doesn't exceed stock
    if (returnQuantity > selectedProduct.stockCached) {
      setNotification({type: 'error', message: `La quantité ne peut pas dépasser le stock disponible (${selectedProduct.stockCached})`})
      return
    }

    setIsSubmitting(true)
    try {
      console.log('Submitting return with data:', {
        productId: selectedProduct.id,
        type: 'RETURN',
        qty: returnQuantity,
        note: `Raison: ${returnReason}${notes.trim() ? ` | Notes: ${notes.trim()}` : ''}`,
      })
      const response = await fetch('/api/movements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: selectedProduct.id,
          type: 'RETURN',
          qty: returnQuantity,
          unitPriceCents: Math.round(unitPrice * 100), // Convert back to cents
          note: `Raison: ${returnReason}${notes.trim() ? ` | Notes: ${notes.trim()}` : ''}`,
        }),
      })

      if (response.ok) {
        setNotification({type: 'success', message: `Retour de ${returnQuantity} ${selectedProduct.name} enregistré avec succès`})
        
        // Reset form
        setSelectedProduct(null)
        setReturnQuantity(1)
        setReturnReason('')
        setNotes('')
        setUnitPrice(0)
        setIsOpen(false)
        console.log('Return submitted successfully, form reset')
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to record return')
      }
    } catch (error) {
      console.error('Error recording return:', error)
      setNotification({type: 'error', message: error instanceof Error ? error.message : 'Impossible d\'enregistrer le retour'})
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setSelectedProduct(null)
    setReturnQuantity(1)
    setReturnReason('')
    setNotes('')
    setUnitPrice(0)
    setSearchQuery('')
    setProducts([])
    setNotification(null)
    console.log('Form reset - quantity set to 1, price reset to 0')
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open)
      if (!open) resetForm()
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <RotateCcw className="h-5 w-5 text-orange-600" />
            <span>Enregistrer un Retour Produit</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Notification */}
          {notification && (
            <div className={`p-4 rounded-lg border ${
              notification.type === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center space-x-2">
                {notification.type === 'success' ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
                <span className="font-medium">{notification.message}</span>
              </div>
            </div>
          )}

          {/* Product Search */}
          {!selectedProduct && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product-search">Rechercher un produit</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="product-search"
                    placeholder="Nom ou SKU du produit..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Search Results */}
              {isLoading && (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
                </div>
              )}

              {products.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {products.map((product) => (
                    <Card
                      key={product.id}
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => handleProductSelect(product)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            {product.images[0] ? (
                              <img
                                src={product.images[0].url}
                                alt={product.images[0].alt || product.name}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <Package className="h-6 w-6 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{product.name}</h3>
                            {product.sku && (
                              <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                            )}
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                Stock: {product.stockCached}
                              </Badge>
                              {product.category && (
                                <Badge variant="secondary" className="text-xs">
                                  {product.category.name}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              {new Intl.NumberFormat('ar-MA', {
                                style: 'currency',
                                currency: product.currency,
                              }).format(product.priceCents / 100)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Selected Product */}
          {selectedProduct && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Produit sélectionné</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                    {selectedProduct.images[0] ? (
                      <img
                        src={selectedProduct.images[0].url}
                        alt={selectedProduct.images[0].alt || selectedProduct.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Package className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{selectedProduct.name}</h3>
                    {selectedProduct.sku && (
                      <p className="text-sm text-gray-500">SKU: {selectedProduct.sku}</p>
                    )}
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="outline">
                        Stock: {selectedProduct.stockCached}
                      </Badge>
                      {selectedProduct.category && (
                        <Badge variant="secondary">
                          {selectedProduct.category.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedProduct(null)}
                  >
                    Changer
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Return Details */}
          {selectedProduct && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantité à retourner</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max={selectedProduct.stockCached}
                    value={returnQuantity}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1
                      const finalValue = Math.max(1, Math.min(value, selectedProduct.stockCached))
                      setReturnQuantity(finalValue)
                      console.log('Quantity changed:', e.target.value, '->', finalValue)
                    }}
                  />
                  <p className="text-xs text-gray-500">
                    Stock disponible: {selectedProduct.stockCached}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unitPrice">Prix unitaire (MAD)</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-gray-500">
                    Prix original: {new Intl.NumberFormat('ar-MA', {
                      style: 'currency',
                      currency: 'MAD',
                    }).format(selectedProduct.priceCents / 100)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Raison du retour</Label>
                  <Select value={returnReason} onValueChange={setReturnReason}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une raison" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DEFECTIVE">Produit défectueux</SelectItem>
                      <SelectItem value="DAMAGED">Produit endommagé</SelectItem>
                      <SelectItem value="WRONG_ITEM">Mauvais article</SelectItem>
                      <SelectItem value="CUSTOMER_RETURN">Retour client</SelectItem>
                      <SelectItem value="EXPIRED">Produit expiré</SelectItem>
                      <SelectItem value="OTHER">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optionnel)</Label>
                <textarea
                  id="notes"
                  className="w-full p-3 border border-gray-300 rounded-md resize-none"
                  rows={3}
                  placeholder="Ajoutez des détails sur le retour..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Return Summary */}
              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    <h4 className="font-medium text-orange-900">Résumé du retour</h4>
                  </div>
                  <div className="space-y-1 text-sm text-orange-800">
                    <p><strong>Produit:</strong> {selectedProduct.name}</p>
                    <p><strong>Quantité:</strong> {returnQuantity}</p>
                    <p><strong>Prix unitaire:</strong> {new Intl.NumberFormat('ar-MA', {
                      style: 'currency',
                      currency: 'MAD',
                    }).format(unitPrice)}</p>
                    <p><strong>Montant total:</strong> <span className="font-semibold text-orange-900">
                      {new Intl.NumberFormat('ar-MA', {
                        style: 'currency',
                        currency: 'MAD',
                      }).format(unitPrice * returnQuantity)}
                    </span></p>
                    <p><strong>Raison:</strong> {
                      returnReason === 'DEFECTIVE' ? 'Produit défectueux' :
                      returnReason === 'DAMAGED' ? 'Produit endommagé' :
                      returnReason === 'WRONG_ITEM' ? 'Mauvais article' :
                      returnReason === 'CUSTOMER_RETURN' ? 'Retour client' :
                      returnReason === 'EXPIRED' ? 'Produit expiré' :
                      returnReason === 'OTHER' ? 'Autre' : returnReason
                    }</p>
                    {notes && <p><strong>Notes:</strong> {notes}</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmitReturn}
              disabled={!selectedProduct || !returnReason || isSubmitting}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enregistrement...
                </>
              ) : (
                <>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Enregistrer le Retour
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
