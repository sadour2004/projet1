'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProductSearch } from '@/components/products/product-search'
import { Loader2, Package, Scan } from 'lucide-react'
// MovementType: 'SALE_OFFLINE', 'CANCEL_SALE', 'RETURN', 'LOSS', 'ADJUSTMENT'
// Role: 'OWNER', 'STAFF'

const movementFormSchema = z.object({
  productId: z.string().cuid('Please select a product'),
  type: z.string(),
  qty: z.number().int().positive('Quantity must be positive'),
  unitPriceCents: z.number().int().min(0).optional(),
  note: z.string().max(500, 'Note too long').optional(),
})

type MovementForm = z.infer<typeof movementFormSchema>

interface MovementFormProps {
  userRole: string
}

interface SelectedProduct {
  id: string
  name: string
  sku?: string | null
  priceCents: number
  stockCached: number
}

export function MovementForm({ userRole }: MovementFormProps) {
  const router = useRouter()
  const [selectedProduct, setSelectedProduct] =
    useState<SelectedProduct | null>(null)
  const [formData, setFormData] = useState<Partial<MovementForm>>({
    type: 'SALE_OFFLINE',
    qty: 1,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Get allowed movement types based on role
  const getAllowedTypes = () => {
    if (userRole === 'OWNER') {
      return ['SALE_OFFLINE', 'CANCEL_SALE', 'RETURN', 'LOSS', 'ADJUSTMENT']
    } else if (userRole === 'STAFF') {
      return ['SALE_OFFLINE', 'RETURN']
    }
    return []
  }

  const allowedTypes = getAllowedTypes()

  const handleProductSelect = (product: SelectedProduct) => {
    setSelectedProduct(product)
    setFormData((prev) => ({
      ...prev,
      productId: product.id,
      unitPriceCents: product.priceCents,
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

      const validatedData = movementFormSchema.parse({
        ...formData,
        productId: selectedProduct.id,
      })

      const response = await fetch('/api/movements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create movement')
      }

      setSuccess(
        `Movement recorded successfully! New stock: ${selectedProduct.stockCached + (validatedData.type === 'SALE_OFFLINE' ? -validatedData.qty : validatedData.qty)}`
      )

      // Reset form
      setFormData({
        type: 'SALE_OFFLINE',
        qty: 1,
      })
      setSelectedProduct(null)

      // Refresh the page to update recent movements
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
    (field: keyof MovementForm) => (value: string | number) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
      if (errors[field]) {
        setErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors[field]
          return newErrors
        })
      }
    }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Record Movement
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
                    <p className="text-sm text-gray-600">
                      Price:{' '}
                      {new Intl.NumberFormat('ar-MA', {
                        style: 'currency',
                        currency: 'MAD',
                      }).format(selectedProduct.priceCents / 100)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      Stock: {selectedProduct.stockCached}
                    </p>
                  </div>
                </div>
              </div>
            )}
            {errors.productId && (
              <p className="mt-1 text-sm text-red-600">{errors.productId}</p>
            )}
          </div>

          {/* Movement Type */}
          <div>
            <Label htmlFor="type">Movement Type</Label>
            <Select value={formData.type} onValueChange={handleChange('type')}>
              <SelectTrigger>
                <SelectValue placeholder="Select movement type" />
              </SelectTrigger>
              <SelectContent>
                {allowedTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="mt-1 text-sm text-red-600">{errors.type}</p>
            )}
          </div>

          {/* Quantity */}
          <div>
            <Label htmlFor="qty">Quantity</Label>
            <Input
              id="qty"
              type="number"
              min="1"
              value={formData.qty || ''}
              onChange={(e) =>
                handleChange('qty')(parseInt(e.target.value) || 0)
              }
              className={errors.qty ? 'border-red-500' : ''}
            />
            {errors.qty && (
              <p className="mt-1 text-sm text-red-600">{errors.qty}</p>
            )}
          </div>

          {/* Unit Price (optional) */}
          <div>
            <Label htmlFor="unitPrice">Unit Price (MAD) - Optional</Label>
            <Input
              id="unitPrice"
              type="number"
              step="0.01"
              min="0"
              value={
                formData.unitPriceCents
                  ? (formData.unitPriceCents / 100).toFixed(2)
                  : ''
              }
              onChange={(e) => {
                const value = parseFloat(e.target.value) || 0
                handleChange('unitPriceCents')(Math.round(value * 100))
              }}
              placeholder="Leave empty to use product price"
            />
            {errors.unitPriceCents && (
              <p className="mt-1 text-sm text-red-600">
                {errors.unitPriceCents}
              </p>
            )}
          </div>

          {/* Note */}
          <div>
            <Label htmlFor="note">Note (Optional)</Label>
            <Textarea
              id="note"
              value={formData.note || ''}
              onChange={(e) => handleChange('note')(e.target.value)}
              placeholder="Add any additional notes..."
              className={errors.note ? 'border-red-500' : ''}
            />
            {errors.note && (
              <p className="mt-1 text-sm text-red-600">{errors.note}</p>
            )}
          </div>

          {/* Barcode Scanner Placeholder */}
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-4 text-center">
            <Scan className="mx-auto mb-2 h-8 w-8 text-gray-400" />
            <p className="text-sm text-gray-600">Barcode scanner integration</p>
            <p className="text-xs text-gray-500">(Feature coming soon)</p>
          </div>

          {error && (
            <Alert variant="destructive">
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
            disabled={isLoading || !selectedProduct}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Record Movement
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
