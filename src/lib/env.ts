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

// Parse environment variables with better error handling
let env: z.infer<typeof envSchema>
try {
  env = envSchema.parse(process.env)
} catch (error) {
  console.error('Environment variable validation failed:', error)
  // Provide fallback values for production
  env = {
    DATABASE_URL: process.env.DATABASE_URL || 'file:./prisma/dev.db',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'fallback-secret-key',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    S3_ENDPOINT: process.env.S3_ENDPOINT,
    S3_ACCESS_KEY: process.env.S3_ACCESS_KEY,
    S3_SECRET_KEY: process.env.S3_SECRET_KEY,
    S3_BUCKET: process.env.S3_BUCKET,
    S3_REGION: process.env.S3_REGION,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    REDIS_URL: process.env.REDIS_URL,
    NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
  }
}

export type Env = z.infer<typeof envSchema>
