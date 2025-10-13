'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { X, Upload, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'

interface ImageUploadProps {
  onUploadComplete: (url: string, key: string) => void
  onUploadError?: (error: string) => void
  maxFiles?: number
  existingImages?: Array<{ url: string; alt?: string }>
  onRemoveImage?: (index: number) => void
}

interface UploadProgress {
  file: File
  progress: number
  error?: string
  url?: string
  key?: string
}

export function ImageUpload({
  onUploadComplete,
  onUploadError,
  maxFiles = 5,
  existingImages = [],
  onRemoveImage,
}: ImageUploadProps) {
  const [uploads, setUploads] = useState<UploadProgress[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (existingImages.length + acceptedFiles.length > maxFiles) {
        onUploadError?.(`Maximum ${maxFiles} images allowed`)
        return
      }

      setIsUploading(true)

      const newUploads: UploadProgress[] = acceptedFiles.map((file) => ({
        file,
        progress: 0,
      }))

      setUploads(newUploads)

      for (let i = 0; i < newUploads.length; i++) {
        const upload = newUploads[i]

        try {
          // Get presigned URL with timeout
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

          const presignResponse = await fetch('/api/uploads/presign', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contentType: upload.file.type,
              contentLength: upload.file.size,
              filename: upload.file.name,
            }),
            signal: controller.signal,
          })

          clearTimeout(timeoutId)

          if (!presignResponse.ok) {
            let errorMessage = 'Failed to get upload URL'
            try {
              const error = await presignResponse.json()
              errorMessage = error.error || errorMessage
            } catch (e) {
              errorMessage = `HTTP ${presignResponse.status}: ${presignResponse.statusText}`
            }
            throw new Error(errorMessage)
          }

          const { uploadUrl, key } = await presignResponse.json()

          // Update progress
          setUploads((prev) =>
            prev.map((u, idx) => (idx === i ? { ...u, progress: 25 } : u))
          )

          // Check if this is a local upload or S3 upload
          const isLocalUpload = uploadUrl.startsWith('/api/uploads/local')

          let publicUrl: string

          if (isLocalUpload) {
            // Local upload - use POST to the local endpoint
            const formData = new FormData()
            formData.append('file', upload.file)

            const uploadController = new AbortController()
            const uploadTimeoutId = setTimeout(
              () => uploadController.abort(),
              60000
            ) // 60 second timeout for upload

            const uploadResponse = await fetch(uploadUrl, {
              method: 'POST',
              body: formData,
              signal: uploadController.signal,
            })

            clearTimeout(uploadTimeoutId)

            if (!uploadResponse.ok) {
              let errorMessage = 'Failed to upload file'
              try {
                const error = await uploadResponse.json()
                errorMessage = error.error || errorMessage
              } catch (e) {
                errorMessage = `HTTP ${uploadResponse.status}: ${uploadResponse.statusText}`
              }
              throw new Error(errorMessage)
            }

            const result = await uploadResponse.json()
            publicUrl = result.url
          } else {
            // S3 upload - use PUT to the presigned URL
            const uploadResponse = await fetch(uploadUrl, {
              method: 'PUT',
              body: upload.file,
              headers: {
                'Content-Type': upload.file.type,
              },
            })

            if (!uploadResponse.ok) {
              throw new Error(
                `S3 upload failed: HTTP ${uploadResponse.status} ${uploadResponse.statusText}`
              )
            }

            // Complete upload - validate required S3 environment variables
            const s3Endpoint = process.env.NEXT_PUBLIC_S3_ENDPOINT || 'https://s3.amazonaws.com'
            const s3Bucket = process.env.NEXT_PUBLIC_S3_BUCKET
            
            if (!s3Bucket) {
              throw new Error('NEXT_PUBLIC_S3_BUCKET environment variable is required for S3 uploads')
            }
            
            publicUrl = `${s3Endpoint}/${s3Bucket}/${key}`
          }

          setUploads((prev) =>
            prev.map((u, idx) =>
              idx === i ? { ...u, progress: 100, url: publicUrl, key } : u
            )
          )

          onUploadComplete(publicUrl, key)
        } catch (error) {
          let errorMessage = 'Upload failed'

          if (error instanceof Error) {
            if (error.name === 'AbortError') {
              errorMessage =
                'Upload timed out. Please try again with a smaller file.'
            } else {
              errorMessage = error.message
            }
          }

          setUploads((prev) =>
            prev.map((u, idx) =>
              idx === i ? { ...u, error: errorMessage } : u
            )
          )

          onUploadError?.(errorMessage)
        }
      }

      setIsUploading(false)
    },
    [existingImages.length, maxFiles, onUploadComplete, onUploadError]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: true,
    disabled: isUploading,
  })

  const removeUpload = (index: number) => {
    setUploads((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      {/* Existing Images */}
      {existingImages.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {existingImages.map((image, index) => (
            <div key={index} className="group relative">
              <div className="relative aspect-square overflow-hidden rounded-lg border">
                <Image
                  src={image.url}
                  alt={image.alt || `Image ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
              {onRemoveImage && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -right-2 -top-2 h-6 w-6 rounded-full p-0 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => onRemoveImage(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {existingImages.length < maxFiles && (
        <div
          {...getRootProps()}
          className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'} ${isUploading ? 'pointer-events-none opacity-50' : ''} `}
        >
          <input {...getInputProps()} />
          <ImageIcon className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          {isDragActive ? (
            <p className="text-blue-600">Drop the images here...</p>
          ) : (
            <div>
              <p className="mb-2 text-gray-600">
                Drag & drop images here, or click to select
              </p>
              <p className="text-sm text-gray-500">
                JPEG, PNG, WebP up to 5MB each
              </p>
              <p className="text-sm text-gray-500">Maximum {maxFiles} images</p>
            </div>
          )}
        </div>
      )}

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div className="space-y-3">
          {uploads.map((upload, index) => (
            <div key={index} className="rounded-lg border p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="truncate text-sm font-medium">
                  {upload.file.name}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeUpload(index)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>

              {upload.error ? (
                <Alert variant="destructive">
                  <AlertDescription>{upload.error}</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  <Progress value={upload.progress} className="h-2" />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{Math.round(upload.progress)}%</span>
                    <span>
                      {(upload.file.size / 1024 / 1024).toFixed(1)} MB
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
