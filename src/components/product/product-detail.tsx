'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Package,
  Calendar,
  User,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import { RobustImage } from '@/components/ui/robust-image'
import {
  MovementType,
  MOVEMENT_TYPE_COLORS,
  MOVEMENT_TYPE_LABELS,
} from '@/types/movement'

interface ProductDetailProps {
  product: {
    id: string
    name: string
    slug: string
    description?: string | null
    sku?: string | null
    priceCents: number
    currency: string
    stockCached: number
    createdAt: Date
    updatedAt: Date
    images: Array<{
      id: string
      url: string
      alt?: string | null
      priority: number
    }>
    category?: {
      id: string
      name: string
      slug: string
    } | null
    movements: Array<{
      id: string
      type: MovementType
      qty: number
      unitPriceCents?: number | null
      note?: string | null
      createdAt: Date
      actor?: {
        id: string
        email: string
        name?: string | null
      } | null
    }>
  }
}

export function ProductDetail({ product }: ProductDetailProps) {
  const router = useRouter()
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  const getStockStatus = (stock: number) => {
    if (stock === 0)
      return { label: 'Out of Stock', color: 'bg-red-100 text-red-800' }
    if (stock <= 5)
      return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' }
    return { label: 'In Stock', color: 'bg-green-100 text-green-800' }
  }

  const getMovementTypeColor = (type: MovementType) => {
    return MOVEMENT_TYPE_COLORS[type] || 'bg-gray-100 text-gray-800'
  }

  const formatMovementType = (type: MovementType) => {
    return MOVEMENT_TYPE_LABELS[type] || type.replace('_', ' ')
  }

  const formatDateTime = (date: Date) => {
    return date.toLocaleString()
  }

  const stockStatus = getStockStatus(product.stockCached)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Button>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Product Images */}
            <div>
              <div className="relative mb-4 aspect-square overflow-hidden rounded-lg bg-gray-100">
                {product.images.length > 0 ? (
                  <RobustImage
                    src={product.images[selectedImageIndex].url}
                    alt={product.images[selectedImageIndex].alt || product.name}
                    width={400}
                    height={400}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Package className="h-24 w-24 text-gray-300" />
                  </div>
                )}
              </div>

              {product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.images.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`relative aspect-square overflow-hidden rounded border-2 ${
                        index === selectedImageIndex
                          ? 'border-blue-500'
                          : 'border-gray-200'
                      }`}
                    >
                      <RobustImage
                        src={image.url}
                        alt={image.alt || `${product.name} ${index + 1}`}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Information */}
            <div>
              <div className="mb-6">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h1 className="mb-2 text-3xl font-bold text-gray-900">
                      {product.name}
                    </h1>
                    {product.sku && (
                      <p className="mb-2 text-sm text-gray-500">
                        SKU: {product.sku}
                      </p>
                    )}
                    {product.category && (
                      <Badge variant="outline">{product.category.name}</Badge>
                    )}
                  </div>
                  <Badge className={stockStatus.color}>
                    {stockStatus.label}
                  </Badge>
                </div>

                <div className="mb-6">
                  <p className="text-3xl font-bold text-gray-900">
                    {new Intl.NumberFormat('ar-MA', {
                      style: 'currency',
                      currency: product.currency,
                    }).format(product.priceCents / 100)}
                  </p>
                  <p className="text-lg text-gray-600">
                    Stock: {product.stockCached} units
                  </p>
                </div>

                {product.description && (
                  <div className="mb-6">
                    <h3 className="mb-2 text-lg font-semibold text-gray-900">
                      Description
                    </h3>
                    <p className="leading-relaxed text-gray-700">
                      {product.description}
                    </p>
                  </div>
                )}

                <Separator className="my-6" />

                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <p className="font-medium">Created</p>
                    <p>{formatDateTime(product.createdAt)}</p>
                  </div>
                  <div>
                    <p className="font-medium">Last Updated</p>
                    <p>{formatDateTime(product.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Movements */}
          {product.movements.length > 0 && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Recent Inventory Movements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {product.movements.map((movement) => (
                    <div
                      key={movement.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {movement.qty > 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                          <Badge
                            className={getMovementTypeColor(movement.type)}
                          >
                            {formatMovementType(movement.type)}
                          </Badge>
                        </div>

                        <div>
                          <p className="font-medium">
                            {movement.qty > 0 ? '+' : ''}
                            {movement.qty} units
                          </p>
                          {movement.note && (
                            <p className="text-sm text-gray-600">
                              {movement.note}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right text-sm text-gray-600">
                        <p>{formatDateTime(movement.createdAt)}</p>
                        {movement.actor && (
                          <p className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {movement.actor.name || movement.actor.email}
                          </p>
                        )}
                        {movement.unitPriceCents && (
                          <p>
                            {(movement.unitPriceCents / 100).toFixed(2)}{' '}
                            {product.currency}/unit
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
