import { z } from 'zod'

export const presignedUploadSchema = z.object({
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp'], {
    errorMap: () => ({
      message: 'Only JPEG, PNG, and WebP images are allowed',
    }),
  }),
  contentLength: z
    .number()
    .min(1)
    .max(5 * 1024 * 1024, {
      message: 'File size must be between 1 byte and 5MB',
    }),
  filename: z.string().min(1).max(255).optional(),
})

export type PresignedUploadRequest = z.infer<typeof presignedUploadSchema>

export const imageMetadataSchema = z.object({
  url: z.string().url(),
  alt: z.string().max(255).optional(),
  width: z.number().int().positive().max(4096).optional(),
  height: z.number().int().positive().max(4096).optional(),
  priority: z.number().int().min(0).max(100).default(0),
})

export type ImageMetadata = z.infer<typeof imageMetadataSchema>
