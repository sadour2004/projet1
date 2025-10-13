'use client'

import { lazy, Suspense } from 'react'
import { PageLoader } from '@/components/ui/loading-spinner'

// Lazy load staff dashboard component
const OptimizedStaffDashboard = lazy(() =>
  import('@/components/staff/optimized-staff-dashboard').then((module) => ({
    default: module.OptimizedStaffDashboard,
  }))
)

interface LazyDashboardProps {
  user: {
    id: string
    email: string
    name?: string | null
    role: 'OWNER' | 'STAFF'
  }
}

export function LazyDashboard({ user }: LazyDashboardProps) {
  // For now, only support staff dashboard
  // Owner dashboard is handled separately in lazy-owner-dashboard.tsx
  if (user.role === 'STAFF') {
    return (
      <Suspense fallback={<PageLoader />}>
        <OptimizedStaffDashboard user={user} />
      </Suspense>
    )
  }

  // Fallback for other roles
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Accès non autorisé</p>
      </div>
    </div>
  )
}
