'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Package } from 'lucide-react'

interface SafeImageProps {
  src: string
  alt: string
  fill?: boolean
  width?: number
  height?: number
  className?: string
  priority?: boolean
  sizes?: string
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  fallback?: React.ReactNode
}

export function SafeImage({
  src,
  alt,
  fill = false,
  width,
  height,
  className = '',
  priority = false,
  sizes,
  placeholder = 'empty',
  blurDataURL,
  fallback,
}: SafeImageProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  // Reset states when src changes
  useEffect(() => {
    setImageError(false)
    setImageLoading(true)
  }, [src])

  // Check if URL is problematic before even trying to load
  const isProblematicUrl = (url: string) => {
    if (!url || url.trim() === '') return true

    const lowerUrl = url.toLowerCase()
    return (
      lowerUrl.includes('placeholder') ||
      lowerUrl.includes('example.com') ||
      lowerUrl.includes('broken') ||
      lowerUrl.includes('404') ||
      url === 'undefined' ||
      url === 'null'
    )
    // Accept http/https URLs, data URLs, and relative paths starting with /
    // Note: We removed !url.startsWith('http') check to allow data: and / paths
  }

  // If URL is problematic or image failed to load, show placeholder
  if (imageError || isProblematicUrl(src)) {
    if (fallback) {
      return <>{fallback}</>
    }
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 ${className}`}
        style={fill ? { position: 'absolute', inset: 0 } : { width, height }}
      >
        <Package className="h-8 w-8 text-gray-400" />
      </div>
    )
  }

  // For data URLs, use regular img tag instead of Next.js Image for better compatibility
  const isDataUrl = src.startsWith('data:')

  if (isDataUrl) {
    const imgProps = fill
      ? {
          src,
          alt,
          className: `w-full h-full object-cover transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'} ${className}`,
          onError: () => {
            console.warn(`[SafeImage] Failed to load data URL image`)
            setImageError(true)
            setImageLoading(false)
          },
          onLoad: () => {
            setImageLoading(false)
          },
          style: { position: 'absolute', inset: 0 },
        }
      : {
          src,
          alt,
          width,
          height,
          className: `transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'} ${className}`,
          onError: () => {
            console.warn(`[SafeImage] Failed to load data URL image`)
            setImageError(true)
            setImageLoading(false)
          },
          onLoad: () => {
            setImageLoading(false)
          },
        }

    return (
      <div
        className={`relative ${fill ? className : ''}`}
        style={fill ? { width: '100%', height: '100%' } : undefined}
      >
        <img {...imgProps} />
        {imageLoading && (
          <div
            className={`absolute inset-0 flex items-center justify-center bg-gray-100 ${className}`}
          >
            <div className="animate-pulse">
              <Package className="h-8 w-8 text-gray-300" />
            </div>
          </div>
        )}
      </div>
    )
  }

  // Create proper props object for Next.js Image (for http/https URLs)
  const imageProps = {
    src,
    alt,
    className: `${className} ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`,
    priority,
    sizes,
    placeholder,
    blurDataURL,
    onError: () => {
      console.warn(`[SafeImage] Failed to load image: ${src}`)
      setImageError(true)
      setImageLoading(false)
    },
    onLoad: () => {
      setImageLoading(false)
    },
    unoptimized: true,
  }

  // Add fill or width/height based on the fill prop
  if (fill) {
    ;(imageProps as typeof imageProps & { fill: true }).fill = true
  } else {
    if (width)
      (imageProps as typeof imageProps & { width: number }).width = width
    if (height)
      (imageProps as typeof imageProps & { height: number }).height = height
  }

  return (
    <div className="relative">
      <Image {...imageProps} />
      {imageLoading && (
        <div
          className={`absolute inset-0 flex items-center justify-center bg-gray-100 ${className}`}
        >
          <div className="animate-pulse">
            <Package className="h-8 w-8 text-gray-300" />
          </div>
        </div>
      )}
    </div>
  )
}
