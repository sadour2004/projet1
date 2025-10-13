import { Metadata } from 'next'
import { requireRoleOrRedirect } from '@/lib/auth/helpers'
import { SettingsPage } from '@/components/settings/settings-page'

export const metadata: Metadata = {
  title: 'Settings | Inventory Management',
  description: 'Application settings and preferences',
}

export default async function Settings() {
  const user = await requireRoleOrRedirect(['OWNER', 'STAFF'])

  return <SettingsPage user={user} />
}
