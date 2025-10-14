import { Metadata } from 'next'
import { getCurrentUser } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import { LazyDashboard } from '@/components/lazy/lazy-dashboard'

export const metadata: Metadata = {
  title: 'Staff Dashboard | Gestion de Stock',
  description: 'Tableau de bord du personnel',
}

export default async function StaffDashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Ensure only staff can access this page
  if (user.role !== 'STAFF' && user.role !== 'OWNER') {
    redirect('/unauthorized')
  }

  return <LazyDashboard user={user} />
}
