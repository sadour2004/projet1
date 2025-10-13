'use client'

import { lazy, Suspense } from 'react'
import { PageLoader } from '@/components/ui/loading-spinner'

// Lazy load owner dashboard components
const EnhancedOwnerDashboard = lazy(() =>
  import('@/components/owner/enhanced-owner-dashboard').then(
    (module) => ({
      default: module.EnhancedOwnerDashboard,
    })
  )
)

interface LazyOwnerDashboardProps {
  user?: any
}

export function LazyOwnerDashboard({ user }: LazyOwnerDashboardProps) {
  return (
    <Suspense fallback={<PageLoader />}>
      <EnhancedOwnerDashboard />
    </Suspense>
  )
}
