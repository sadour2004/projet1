'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProductSearch } from '@/components/products/product-search'
import { Loader2, Settings, AlertTriangle } from 'lucide-react'

const adjustmentFormSchema = z.object({
  productId: z.string().cuid('Please select a product'),
  adjustmentQty: z
    .number()
    .int()
    .min(-1000)
    .max(1000, 'Adjustment quantity too large'),
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason too long'),
})

type AdjustmentForm = z.infer<typeof adjustmentFormSchema>

interface SelectedProduct {
  id: string
  name: string
  sku?: string | null
  priceCents: number
  stockCached: number
}

export function StockAdjustmentForm() {
  const router = useRouter()
  const [selectedProduct, setSelectedProduct] =
    useState<SelectedProduct | null>(null)
  const [formData, setFormData] = useState<Partial<AdjustmentForm>>({
    adjustmentQty: 0,
    reason: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleProductSelect = (product: SelectedProduct) => {
    setSelectedProduct(product)
    setFormData((prev) => ({
      ...prev,
      productId: product.id,
    }))
    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors.productId
      return newErrors
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')
    setErrors({})

    try {
      if (!selectedProduct) {
        setErrors({ productId: 'Please select a product' })
        return
      }

      const validatedData = adjustmentFormSchema.parse({
        ...formData,
        productId: selectedProduct.id,
      })

      const response = await fetch('/api/movements/adjust-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to adjust stock')
      }

      const newStock = selectedProduct.stockCached + validatedData.adjustmentQty
      setSuccess(`Stock adjusted successfully! New stock level: ${newStock}`)

      // Reset form
      setFormData({
        adjustmentQty: 0,
        reason: '',
      })
      setSelectedProduct(null)

      // Refresh the page to update movements table
      router.refresh()
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {}
        err.errors.forEach((error) => {
          if (error.path[0] && typeof error.path[0] === 'string') {
            fieldErrors[error.path[0]] = error.message
          }
        })
        setErrors(fieldErrors)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange =
    (field: keyof AdjustmentForm) => (value: string | number) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
      if (errors[field]) {
        setErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors[field]
          return newErrors
        })
      }
    }

  const getNewStockLevel = () => {
    if (!selectedProduct || !formData.adjustmentQty) return null
    return selectedProduct.stockCached + formData.adjustmentQty
  }

  const newStock = getNewStockLevel()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Stock Adjustment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Selection */}
          <div>
            <Label>Product</Label>
            <ProductSearch
              onSelect={handleProductSelect}
              placeholder="Search by name or SKU..."
            />
            {selectedProduct && (
              <div className="mt-2 rounded-lg bg-blue-50 p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{selectedProduct.name}</p>
                    {selectedProduct.sku && (
                      <p className="text-sm text-gray-600">
                        SKU: {selectedProduct.sku}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      Current Stock: {selectedProduct.stockCached}
                    </p>
                  </div>
                </div>
              </div>
            )}
            {errors.productId && (
              <p className="mt-1 text-sm text-red-600">{errors.productId}</p>
            )}
          </div>

          {/* Adjustment Quantity */}
          <div>
            <Label htmlFor="adjustmentQty">Adjustment Quantity</Label>
            <Input
              id="adjustmentQty"
              type="number"
              value={formData.adjustmentQty || ''}
              onChange={(e) =>
                handleChange('adjustmentQty')(parseInt(e.target.value) || 0)
              }
              placeholder="Enter positive or negative number"
              className={errors.adjustmentQty ? 'border-red-500' : ''}
            />
            <p className="mt-1 text-xs text-gray-500">
              Use positive numbers to add stock, negative to reduce
            </p>
            {errors.adjustmentQty && (
              <p className="mt-1 text-sm text-red-600">
                {errors.adjustmentQty}
              </p>
            )}
          </div>

          {/* New Stock Level Preview */}
          {selectedProduct &&
            formData.adjustmentQty !== undefined &&
            formData.adjustmentQty !== 0 && (
              <div
                className={`rounded-lg p-3 ${newStock !== null && newStock < 0 ? 'border border-red-200 bg-red-50' : 'border border-green-200 bg-green-50'}`}
              >
                <div className="flex items-center gap-2">
                  {newStock !== null && newStock < 0 && (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  )}
                  <p className="text-sm font-medium">
                    New Stock Level: {newStock}
                  </p>
                </div>
                {newStock !== null && newStock < 0 && (
                  <p className="mt-1 text-xs text-red-600">
                    Warning: This will result in negative stock
                  </p>
                )}
              </div>
            )}

          {/* Reason */}
          <div>
            <Label htmlFor="reason">Reason for Adjustment</Label>
            <Textarea
              id="reason"
              value={formData.reason || ''}
              onChange={(e) => handleChange('reason')(e.target.value)}
              placeholder="Explain why this adjustment is needed..."
              className={errors.reason ? 'border-red-500' : ''}
            />
            {errors.reason && (
              <p className="mt-1 text-sm text-red-600">{errors.reason}</p>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !selectedProduct || !formData.reason?.trim()}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Adjust Stock
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
