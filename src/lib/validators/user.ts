import { z } from 'zod'

export const createUserSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['STAFF'], {
    errorMap: () => ({ message: 'Only STAFF role can be created' }),
  }),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .optional(),
  isActive: z.boolean().optional().default(true),
})

export const updateUserSchema = z.object({
  id: z.string().cuid('Invalid user ID'),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long')
    .optional(),
  email: z.string().email('Invalid email address').optional(),
  role: z
    .enum(['STAFF'], {
      errorMap: () => ({ message: 'Only STAFF role can be assigned' }),
    })
    .optional(),
  isActive: z.boolean().optional(),
})

export const changePasswordSchema = z.object({
  id: z.string().cuid('Invalid user ID'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
})

export const resetPasswordSchema = z.object({
  id: z.string().cuid('Invalid user ID'),
})

export const userQuerySchema = z.object({
  search: z.string().optional(),
  role: z.enum(['STAFF']).optional(),
  limit: z.number().int().positive().max(100).default(20),
  cursor: z.string().optional(),
})

export type CreateUserRequest = z.infer<typeof createUserSchema>
export type UpdateUserRequest = z.infer<typeof updateUserSchema>
export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>
export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>
export type UserQuery = z.infer<typeof userQuerySchema>
