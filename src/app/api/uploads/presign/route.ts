import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/helpers'
import { presignedUploadSchema } from '@/lib/validators/upload'
import { generatePresignedUpload } from '@/lib/services/s3'
import { uploadRateLimit } from '@/lib/security/rate-limit'
import { createAuditLog, AuditAction, AuditEntity } from '@/lib/services/audit'
import { logger } from '@/lib/logger'
import { env } from '@/lib/env'
import { mkdir } from 'fs/promises'
import { join } from 'path'
import { randomBytes } from 'crypto'
// Role enum not available in SQLite, using string literals

// Helper function for local file upload (development mode)
async function generateLocalUploadUrl(
  contentType: string,
  contentLength: number,
  filename: string
): Promise<{ uploadUrl: string; key: string; expiresIn: number }> {
  // Validate content type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(contentType)) {
    throw new Error(`Content type ${contentType} not allowed`)
  }

  // Validate content length (5MB max)
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (contentLength > maxSize) {
    throw new Error(
      `File size ${contentLength} exceeds maximum ${maxSize} bytes`
    )
  }

  // Generate unique filename
  const timestamp = Date.now()
  const randomId = randomBytes(16).toString('hex')
  const extension = filename.split('.').pop() || 'jpg'
  const key = `uploads/product-images/${timestamp}-${randomId}.${extension}`

  // Create uploads directory if it doesn't exist
  const uploadsDir = join(process.cwd(), 'public', 'uploads', 'product-images')
  await mkdir(uploadsDir, { recursive: true })

  // Return a local upload URL
  const uploadUrl = `/api/uploads/local?key=${encodeURIComponent(key)}&contentType=${encodeURIComponent(contentType)}`

  return {
    uploadUrl,
    key,
    expiresIn: 300, // 5 minutes
  }
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await uploadRateLimit(req)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many upload requests' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(
              rateLimitResult.resetTime
            ).toISOString(),
          },
        }
      )
    }

    // Authentication and authorization
    const user = await requireRole('STAFF') // STAFF and OWNER can upload

    // Parse and validate request body
    const body = await req.json()
    const validatedData = presignedUploadSchema.parse(body)

    // Check if S3 is configured
    const isS3Configured = Boolean(
      env.S3_ENDPOINT && env.S3_ACCESS_KEY && env.S3_SECRET_KEY && env.S3_BUCKET
    )
    // Force local uploads in development unless explicitly overridden
    const nodeEnv = process.env.NODE_ENV
    const forceS3 = process.env.NEXT_PUBLIC_FORCE_S3
    const forceLocalUploads =
      nodeEnv !== 'production' &&
      forceS3 !== 'true'

    let uploadData: { uploadUrl: string; key: string; expiresIn: number }

    if (isS3Configured && !forceLocalUploads) {
      // Use S3 for production
      const s3Data = await generatePresignedUpload(
        validatedData.contentType,
        validatedData.contentLength,
        'product-images'
      )
      uploadData = {
        uploadUrl: s3Data.url,
        key: s3Data.key,
        expiresIn: 300,
      }
    } else {
      // Use local storage for development
      uploadData = await generateLocalUploadUrl(
        validatedData.contentType,
        validatedData.contentLength,
        validatedData.filename || 'unknown'
      )
    }

    // Audit log (non-blocking)
    createAuditLog({
      actorId: user.id,
      action: AuditAction.FILE_UPLOAD,
      entity: AuditEntity.FILE,
      entityId: uploadData.key,
      meta: {
        contentType: validatedData.contentType,
        contentLength: validatedData.contentLength,
        filename: validatedData.filename,
      },
    }).catch((error) => {
      logger.warn('Audit log creation failed, continuing with upload', {
        error,
      })
    })

    logger.info('Presigned upload URL generated', {
      userId: user.id,
      key: uploadData.key,
      contentType: validatedData.contentType,
      mode: isS3Configured && !forceLocalUploads ? 's3' : 'local',
    })

    return NextResponse.json({
      uploadUrl: uploadData.uploadUrl,
      key: uploadData.key,
      expiresIn: uploadData.expiresIn,
    })
  } catch (error) {
    logger.error('Presigned upload error', { error })

    if (error instanceof Error) {
      if (
        error.message.includes('not allowed') ||
        error.message.includes('exceeds')
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    )
  }
}
