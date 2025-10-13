import { Metadata } from 'next'
import { getCurrentUser } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import { LazyDashboard } from '@/components/lazy/lazy-dashboard'

export const metadata: Metadata = {
  title: 'Dashboard | Gestion de Stock',
  description: 'Tableau de bord principal',
}

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // For owners, redirect to owner dashboard
  if (user.role === 'OWNER') {
    redirect('/owner/dashboard')
  }

  // For staff, show the role-based content
  return <LazyDashboard user={user} />
}
