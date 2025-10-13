import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for API routes that handle their own authentication
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Validate required environment variable
  if (!process.env.NEXTAUTH_SECRET) {
    console.error('NEXTAUTH_SECRET environment variable is required but not set')
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  // Security headers
  const response = NextResponse.next()

  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self'"
  )

  // Handle locale detection and routing
  const locale = pathname.split('/')[1]
  const supportedLocales = ['fr', 'ar']
  const isLocalePath = supportedLocales.includes(locale)

  // Extract path without locale
  const pathWithoutLocale = isLocalePath ? pathname.slice(3) || '/' : pathname

  // For now, redirect all locale paths to non-locale paths to avoid 404s
  if (isLocalePath) {
    const redirectUrl = new URL(pathWithoutLocale, request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Public routes that don't require authentication
  const publicRoutes = ['/auth/signin', '/auth/forgot-password', '/auth/reset-password-verify', '/api/auth']
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  if (isPublicRoute) {
    return response
  }

  // Redirect unauthenticated users to sign in
  if (!token) {
    const signInUrl = new URL('/auth/signin', request.url)
    signInUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signInUrl)
  }

  // Role-based access control
  const userRole = token.role as string

  // Redirect /dashboard to /owner/dashboard for owners
  if (pathname === '/dashboard' && userRole === 'OWNER') {
    return NextResponse.redirect(new URL('/owner/dashboard', request.url))
  }

  // Owner-only routes
  const ownerRoutes = ['/owner']
  const isOwnerRoute = ownerRoutes.some((route) => pathname.startsWith(route))

  if (isOwnerRoute && userRole !== 'OWNER') {
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }

  // Staff-only routes (staff can access these, owners can too)
  const staffRoutes = ['/staff', '/browse', '/product']
  const isStaffRoute = staffRoutes.some((route) => pathname.startsWith(route))

  if (isStaffRoute && !['OWNER', 'STAFF'].includes(userRole)) {
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
