'use client'

import { useState, useEffect } from 'react'
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
import { ImageUpload } from '@/components/ui/image-upload'
import { Loader2, Package, ArrowLeft } from 'lucide-react'

const productFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(255, 'Slug too long')
    .regex(
      /^[a-z0-9-]+$/,
      'Slug must contain only lowercase letters, numbers, and hyphens'
    ),
  description: z.string().max(2000, 'Description too long').optional(),
  sku: z.string().max(100, 'SKU too long').optional(),
  priceCents: z.number().int().min(0, 'Price must be non-negative'),
  categoryId: z.string().cuid().optional(),
  stockCached: z.number().int().min(0, 'Stock must be non-negative'),
})

type ProductForm = z.infer<typeof productFormSchema>

interface Category {
  id: string
  name: string
}

interface ProductFormProps {
  initialData?: Partial<
    ProductForm & {
      id: string
      images: Array<{ url: string; alt?: string }>
      stockCached?: number
    }
  >
  isEditing?: boolean
  productId?: string
}

export function ProductForm({
  initialData,
  isEditing = false,
  productId,
}: ProductFormProps) {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [formData, setFormData] = useState<ProductForm>({
    name: initialData?.name || '',
    slug: initialData?.slug || '',
    description: initialData?.description || '',
    sku: initialData?.sku || '',
    priceCents: initialData?.priceCents || 0,
    categoryId: initialData?.categoryId || '',
    stockCached: initialData?.stockCached || 0,
  })
  const [images, setImages] = useState<Array<{ url: string; alt?: string }>>(
    initialData?.images || []
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories')
        if (response.ok) {
          const data = await response.json()
          setCategories(data.categories || [])
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error)
      }
    }

    fetchCategories()
  }, [])

  // Auto-generate slug from name
  useEffect(() => {
    if (!isEditing && formData.name && !formData.slug) {
      const generatedSlug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()

      setFormData((prev) => ({ ...prev, slug: generatedSlug }))
    }
  }, [formData.name, isEditing, formData.slug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setErrors({})

    try {
      // Validate form data
      const validatedData = productFormSchema.parse(formData)

      const requestData = {
        ...validatedData,
        categoryId:
          validatedData.categoryId === 'none'
            ? undefined
            : validatedData.categoryId,
        images: images.map((img, index) => ({
          url: img.url,
          alt: img.alt,
          priority: index === 0 ? 1 : 0,
        })),
      }

      const url = isEditing
        ? `/api/products/${productId || initialData?.id}`
        : '/api/products'
      const method = isEditing ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result.error || `Failed to ${isEditing ? 'update' : 'create'} product`
        )
      }

      router.push('/owner/products')
      router.refresh()
    } catch (err) {
      console.error('ProductForm submission error:', err)

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
    (field: keyof ProductForm) => (value: string | number) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
      if (errors[field]) {
        setErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors[field]
          return newErrors
        })
      }
    }

  const handleImageUpload = (url: string, key: string) => {
    setImages((prev) => [...prev, { url, alt: formData.name }])
  }

  const handleImageRemove = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {isEditing ? 'Modifier le Produit' : 'Ajouter un Nouveau Produit'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Name */}
              <div>
                <Label htmlFor="name">Nom du Produit</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name')(e.target.value)}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Slug */}
              <div>
                <Label htmlFor="slug">Identifiant URL</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleChange('slug')(e.target.value)}
                  className={errors.slug ? 'border-red-500' : ''}
                />
                {errors.slug && (
                  <p className="mt-1 text-sm text-red-600">{errors.slug}</p>
                )}
              </div>

              {/* SKU */}
              <div>
                <Label htmlFor="sku">SKU (Optionnel)</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => handleChange('sku')(e.target.value)}
                  className={errors.sku ? 'border-red-500' : ''}
                />
                {errors.sku && (
                  <p className="mt-1 text-sm text-red-600">{errors.sku}</p>
                )}
              </div>

              {/* Price */}
              <div>
                <Label htmlFor="price">Prix (MAD)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={
                    formData.priceCents
                      ? (formData.priceCents / 100).toFixed(2)
                      : ''
                  }
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0
                    handleChange('priceCents')(Math.round(value * 100))
                  }}
                  className={errors.priceCents ? 'border-red-500' : ''}
                />
                {errors.priceCents && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.priceCents}
                  </p>
                )}
              </div>

              {/* Stock */}
              <div>
                <Label htmlFor="stock">Quantité de Stock Initiale</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={formData.stockCached}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0
                    handleChange('stockCached')(value)
                  }}
                  className={errors.stockCached ? 'border-red-500' : ''}
                  placeholder="Entrez la quantité de stock initiale"
                />
                {errors.stockCached && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.stockCached}
                  </p>
                )}
              </div>

              {/* Category */}
              <div className="md:col-span-2">
                <Label htmlFor="category">Catégorie (Optionnel)</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={handleChange('categoryId')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune catégorie</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categoryId && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.categoryId}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description (Optionnel)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description')(e.target.value)}
                placeholder="Entrez la description du produit..."
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description}
                </p>
              )}
            </div>

            {/* Images */}
            <div>
              <Label>Images du Produit</Label>
              <ImageUpload
                onUploadComplete={handleImageUpload}
                onUploadError={(error) => setError(error)}
                maxFiles={5}
                existingImages={images}
                onRemoveImage={handleImageRemove}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Annuler
              </Button>

              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Mettre à Jour' : 'Créer le Produit'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
