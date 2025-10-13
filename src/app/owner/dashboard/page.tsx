import { Metadata } from 'next'
import { requireRoleOrRedirect } from '@/lib/auth/helpers'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { ProfessionalOwnerLayout } from '@/components/owner/professional-owner-layout'
import { LazyOwnerDashboard } from '@/components/lazy/lazy-owner-dashboard'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = {
  title: 'Tableau de Bord Propriétaire | Gestion de Stock',
  description: 'Tableau de bord professionnel avec analyses détaillées',
}

export default async function OwnerDashboardPage() {
  await requireRoleOrRedirect('OWNER')
  const session = await getServerSession(authOptions)

  return (
    <ProfessionalOwnerLayout>
      <div className="w-full max-w-full px-2 py-4">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              Tableau de Bord
            </h1>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Propriétaire
            </Badge>
          </div>
        </div>
        <LazyOwnerDashboard user={session?.user} />
      </div>
    </ProfessionalOwnerLayout>
  )
}
