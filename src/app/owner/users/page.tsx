import { Metadata } from 'next'
import { requireRoleOrRedirect } from '@/lib/auth/helpers'
import { UsersTable } from '@/components/users/users-table'
import { UserForm } from '@/components/users/user-form'
// Role enum not available in SQLite, using string literals

export const metadata: Metadata = {
  title: 'Gestion des Utilisateurs | Gestion de Stock',
  description: 'Gérer les utilisateurs et le personnel',
}

export default async function UsersPage() {
  await requireRoleOrRedirect('OWNER')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Gestion du Personnel
          </h1>
          <p className="text-gray-600">
            Créer et gérer les comptes du personnel de votre magasin
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <UsersTable />
          </div>

          <div>
            <UserForm />
          </div>
        </div>
      </div>
    </div>
  )
}
