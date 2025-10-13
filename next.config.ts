import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 's3.amazonaws.com',
        port: '',
        pathname: '/**',
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Enable optimization for better performance
    unoptimized: false,
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  serverExternalPackages: ['argon2', 'bcryptjs'],
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  // Remove deprecated swcMinify option
  productionBrowserSourceMaps: false,
  // Enable experimental optimizations (simplified to prevent chunk errors)
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
}

export default nextConfig
