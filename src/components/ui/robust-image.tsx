'use client'

import { useState } from 'react'
import { Package } from 'lucide-react'

interface RobustImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  fallback?: React.ReactNode
  fill?: boolean
}

export function RobustImage({
  src,
  alt,
  width = 400,
  height = 400,
  className = '',
  fallback,
  fill = false,
}: RobustImageProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  // Check if URL is problematic
  const isProblematicUrl = (url: string) => {
    if (!url || url.trim() === '') return true
    const lowerUrl = url.toLowerCase()
    return (
      lowerUrl.includes('placeholder') ||
      lowerUrl.includes('example.com') ||
      lowerUrl.includes('broken') ||
      lowerUrl.includes('404') ||
      !url.startsWith('http') ||
      url === 'undefined' ||
      url === 'null'
    )
  }

  // If URL is problematic or image failed to load, show placeholder
  if (imageError || isProblematicUrl(src)) {
    if (fallback) {
      return <>{fallback}</>
    }
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 ${className}`}
        style={fill ? { width: '100%', height: '100%' } : { width, height }}
      >
        <Package className="h-8 w-8 text-gray-400" />
      </div>
    )
  }

  const containerStyle = fill ? { width: '100%', height: '100%' } : { width, height }
  const imageProps = fill 
    ? {
        src,
        alt,
        className: `w-full h-full object-cover transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`,
        onError: () => {
          console.warn(`[RobustImage] Failed to load image: ${src}`)
          setImageError(true)
          setImageLoading(false)
        },
        onLoad: () => {
          setImageLoading(false)
        },
      }
    : {
        src,
        alt,
        width,
        height,
        className: `transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`,
        onError: () => {
          console.warn(`[RobustImage] Failed to load image: ${src}`)
          setImageError(true)
          setImageLoading(false)
        },
        onLoad: () => {
          setImageLoading(false)
        },
      }

  return (
    <div className={`relative ${className}`} style={containerStyle}>
      <img {...imageProps} />
      {imageLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-pulse">
            <Package className="h-8 w-8 text-gray-300" />
          </div>
        </div>
      )}
    </div>
  )
}
