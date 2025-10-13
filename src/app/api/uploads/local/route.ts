import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const key = searchParams.get('key')
    const contentType = searchParams.get('contentType')

    if (!key || !contentType) {
      return NextResponse.json(
        { error: 'Missing key or contentType parameter' },
        { status: 400 }
      )
    }

    // Accept both multipart/form-data and raw bytes
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    const contentTypeHeader = req.headers.get('content-type') || ''

    let effectiveContentType = contentType
    let fileBuffer: Buffer

    if (contentTypeHeader.startsWith('multipart/form-data')) {
      const form = await req.formData()
      const file = form.get('file') as File | null
      if (!file) {
        return NextResponse.json(
          { error: 'Missing file in multipart form-data as field "file"' },
          { status: 400 }
        )
      }
      effectiveContentType =
        file.type || contentType || 'application/octet-stream'
      if (!allowedTypes.includes(effectiveContentType)) {
        return NextResponse.json(
          { error: `Content type ${effectiveContentType} not allowed` },
          { status: 400 }
        )
      }
      const ab = await file.arrayBuffer()
      fileBuffer = Buffer.from(ab)
    } else {
      // Raw bytes path: trust validated query param contentType
      if (!allowedTypes.includes(effectiveContentType)) {
        return NextResponse.json(
          { error: `Content type ${effectiveContentType} not allowed` },
          { status: 400 }
        )
      }
      const ab = await req.arrayBuffer()
      fileBuffer = Buffer.from(ab)
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (fileBuffer.length > maxSize) {
      return NextResponse.json(
        {
          error: `File size ${fileBuffer.length} exceeds maximum ${maxSize} bytes`,
        },
        { status: 400 }
      )
    }

    // Create the full path
    const fullPath = join(process.cwd(), 'public', key)
    const dir = join(fullPath, '..')

    // Create directory if it doesn't exist
    await mkdir(dir, { recursive: true })

    // Write the file
    await writeFile(fullPath, fileBuffer)

    // Return the public URL
    const publicUrl = `/${key}`

    logger.info('File uploaded locally', {
      key,
      contentType: effectiveContentType,
      size: fileBuffer.length,
    })

    return NextResponse.json({
      success: true,
      url: publicUrl,
      key,
    })
  } catch (error) {
    logger.error('Local upload error', { error })
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
