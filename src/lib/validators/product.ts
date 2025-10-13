import { z } from 'zod'

export const createProductSchema = z.object({
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
  currency: z
    .string()
    .length(3, 'Currency must be 3 characters')
    .default('MAD'),
  categoryId: z.string().cuid().optional(),
  stockCached: z.number().int().min(0, 'Stock must be non-negative').default(0),
  images: z
    .array(
      z.object({
        // Accept absolute http(s) URLs and site-relative paths like "/uploads/..."
        url: z.string().refine((u) => {
          if (!u) return false
          return /^https?:\/\//.test(u) || u.startsWith('/')
        }, 'Invalid url'),
        alt: z.string().max(255).optional(),
        width: z.number().int().positive().optional(),
        height: z.number().int().positive().optional(),
        priority: z.number().int().min(0).max(100).default(0),
      })
    )
    .max(10, 'Maximum 10 images allowed')
    .default([]),
})

export const updateProductSchema = createProductSchema.partial().extend({
  id: z.string().cuid(),
  isActive: z.boolean().optional(),
})

export const productQuerySchema = z.object({
  q: z.string().optional(), // Search query
  category: z.string().cuid().optional(),
  isActive: z.boolean().optional(),
  cursor: z.string().cuid().optional(), // For pagination
  limit: z.number().int().min(1).max(100).default(20),
})

export type CreateProductRequest = z.infer<typeof createProductSchema>
export type UpdateProductRequest = z.infer<typeof updateProductSchema>
export type ProductQuery = z.infer<typeof productQuerySchema>
