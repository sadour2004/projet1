import { z } from 'zod'

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().default('file:./prisma/dev.db'),

  // NextAuth
  NEXTAUTH_SECRET: z
    .string()
    .default(
      'your-nextauth-secret-key-for-development-only-change-in-production'
    ),
  NEXTAUTH_URL: z.string().url().default('http://localhost:3000'),

  // S3 Configuration (optional for development)
  S3_ENDPOINT: z.string().url().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),

  // Application
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),

  // Optional
  REDIS_URL: z.string().url().optional(),

  // Node environment
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
})

export const env = envSchema.parse(process.env)

export type Env = z.infer<typeof envSchema>
