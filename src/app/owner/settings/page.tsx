import { Metadata } from 'next'
import { requireRoleOrRedirect } from '@/lib/auth/helpers'
import { ProfessionalOwnerLayout } from '@/components/owner/professional-owner-layout'
import { ProfessionalSettingsPage } from '@/components/owner/settings/professional-settings-page'

export const metadata: Metadata = {
  title: 'Paramètres | Inventory Management',
  description: 'Gestion du personnel et paramètres système',
}

export default async function SettingsPageRoute() {
  await requireRoleOrRedirect('OWNER')

  return (
    <ProfessionalOwnerLayout>
      <ProfessionalSettingsPage />
    </ProfessionalOwnerLayout>
  )
}
