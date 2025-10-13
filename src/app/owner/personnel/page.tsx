import { Metadata } from 'next'
import { requireRoleOrRedirect } from '@/lib/auth/helpers'
import { ProfessionalOwnerLayout } from '@/components/owner/professional-owner-layout'
import { OptimizedPersonnelPage } from '@/components/owner/personnel/optimized-personnel-page'

export const metadata: Metadata = {
  title: 'Gestion du Personnel | Inventory Management',
  description: 'Gérez votre personnel et créez des comptes employés',
}

export default async function PersonnelPageRoute() {
  await requireRoleOrRedirect('OWNER')

  return (
    <ProfessionalOwnerLayout>
      <OptimizedPersonnelPage />
    </ProfessionalOwnerLayout>
  )
}
