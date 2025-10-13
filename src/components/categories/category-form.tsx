'use client'

import { useState, useEffect } from 'react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Folder } from 'lucide-react'

const categoryFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(100, 'Slug too long')
    .regex(
      /^[a-z0-9-]+$/,
      'Slug must contain only lowercase letters, numbers, and hyphens'
    ),
})

type CategoryForm = z.infer<typeof categoryFormSchema>

interface Category {
  id: string
  name: string
  slug: string
}

interface CategoryFormProps {
  initialData?: Category
  onSuccess?: () => void
}

export function CategoryForm({ initialData, onSuccess }: CategoryFormProps) {
  const [formData, setFormData] = useState<CategoryForm>({
    name: initialData?.name || '',
    slug: initialData?.slug || '',
  })

  // Update form data when initialData changes (for editing)
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        slug: initialData.slug,
      })
    } else {
      setFormData({ name: '', slug: '' })
    }
  }, [initialData])
  const [errors, setErrors] = useState<Partial<CategoryForm>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const isEditing = !!initialData

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
    setSuccess('')
    setErrors({})

    try {
      const validatedData = categoryFormSchema.parse(formData)

      const url = isEditing
        ? `/api/categories/${initialData.id}`
        : '/api/categories'
      const method = isEditing ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result.error ||
            `Failed to ${isEditing ? 'update' : 'create'} category`
        )
      }

      setSuccess(`Category ${isEditing ? 'updated' : 'created'} successfully!`)

      if (!isEditing) {
        // Reset form for new category
        setFormData({ name: '', slug: '' })
      }

      // Call success callback to refresh the table
      onSuccess?.()
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Partial<CategoryForm> = {}
        err.errors.forEach((error) => {
          if (error.path[0]) {
            fieldErrors[error.path[0] as keyof CategoryForm] = error.message
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
    (field: keyof CategoryForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }))
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }))
      }
    }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Folder className="h-5 w-5" />
          {isEditing ? 'Edit Category' : 'Add New Category'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <Label htmlFor="name">Category Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={handleChange('name')}
              placeholder="e.g., Electronics"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Slug */}
          <div>
            <Label htmlFor="slug">URL Slug</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={handleChange('slug')}
              placeholder="e.g., electronics"
              className={errors.slug ? 'border-red-500' : ''}
            />
            <p className="mt-1 text-xs text-gray-500">
              Used in URLs. Only lowercase letters, numbers, and hyphens.
            </p>
            {errors.slug && (
              <p className="mt-1 text-sm text-red-600">{errors.slug}</p>
            )}
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

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Update Category' : 'Create Category'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
