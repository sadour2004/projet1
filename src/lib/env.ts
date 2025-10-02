import { z } from 'zod'

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  
  // NextAuth
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url().optional(),
  
  // S3 Configuration
  S3_ENDPOINT: z.string().url(),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  S3_REGION: z.string().min(1),
  
  // Application
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  
  // Optional
  REDIS_URL: z.string().url().optional(),
  
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

export const env = envSchema.parse(process.env)

export type Env = z.infer<typeof envSchema>
