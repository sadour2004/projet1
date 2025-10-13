import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { env } from '@/lib/env'
import { logger } from '@/lib/logger'
import { randomBytes } from 'crypto'

// Initialize S3 client
const s3Client = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY || '',
    secretAccessKey: env.S3_SECRET_KEY || '',
  },
  forcePathStyle: true, // Required for some S3-compatible services
})

export interface PresignedUploadData {
  url: string
  key: string
  fields?: Record<string, string>
}

/**
 * Generate a presigned URL for uploading files to S3
 */
export async function generatePresignedUpload(
  contentType: string,
  contentLength: number,
  prefix = 'uploads'
): Promise<PresignedUploadData> {
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

  // Generate unique key
  const timestamp = Date.now()
  const randomId = randomBytes(16).toString('hex')
  const extension = getExtensionFromContentType(contentType)
  const key = `${prefix}/${timestamp}-${randomId}${extension}`

  try {
    // Create presigned URL for PUT operation
    const command = new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      ContentType: contentType,
      ContentLength: contentLength,
    })

    const url = await getSignedUrl(s3Client, command, {
      expiresIn: 300, // 5 minutes
    })

    logger.info('Generated presigned upload URL', {
      key,
      contentType,
      contentLength,
    })

    return { url, key }
  } catch (error) {
    logger.error('Failed to generate presigned URL', {
      error,
      key,
      contentType,
    })
    throw new Error('Failed to generate upload URL')
  }
}

/**
 * Delete a file from S3
 */
export async function deleteFile(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
    })

    await s3Client.send(command)
    logger.info('File deleted from S3', { key })
  } catch (error) {
    logger.error('Failed to delete file from S3', { error, key })
    throw new Error('Failed to delete file')
  }
}

/**
 * Get public URL for a file
 */
export function getPublicUrl(key: string): string {
  return `${env.S3_ENDPOINT}/${env.S3_BUCKET}/${key}`
}

/**
 * Extract file extension from content type
 */
function getExtensionFromContentType(contentType: string): string {
  const extensions: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
  }
  return extensions[contentType] || ''
}

/**
 * Validate image dimensions (optional, requires image processing library)
 */
export function validateImageDimensions(
  width: number,
  height: number,
  maxWidth = 2048,
  maxHeight = 2048
): boolean {
  return width <= maxWidth && height <= maxHeight
}
