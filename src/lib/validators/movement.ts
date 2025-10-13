import { z } from 'zod'
import { MovementType } from '@/types/movement'

export const createMovementSchema = z.object({
  productId: z.string().cuid('Invalid product ID'),
  type: z.nativeEnum(MovementType),
  qty: z.number().int().positive('Quantity must be positive'),
  unitPriceCents: z.number().int().min(0).optional(),
  note: z.string().max(500, 'Note too long').optional(),
})

export const movementQuerySchema = z.object({
  productId: z.string().cuid().optional(),
  type: z.nativeEnum(MovementType).optional(),
  actorId: z.string().cuid().optional(),
  startDate: z.string().optional().transform((val) => {
    if (!val) return undefined
    try {
      // Handle both date-only (YYYY-MM-DD) and datetime formats
      const date = new Date(val)
      return date.toISOString()
    } catch {
      return undefined
    }
  }),
  endDate: z.string().optional().transform((val) => {
    if (!val) return undefined
    try {
      // Handle both date-only (YYYY-MM-DD) and datetime formats
      const date = new Date(val)
      return date.toISOString()
    } catch {
      return undefined
    }
  }),
  cursor: z.string().cuid().optional(),
  limit: z.number().int().min(1).max(100).default(20),
})

export type CreateMovementRequest = z.infer<typeof createMovementSchema>
export type MovementQuery = z.infer<typeof movementQuerySchema>
