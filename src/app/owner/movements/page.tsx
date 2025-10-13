import { Metadata } from 'next'
import { requireRoleOrRedirect } from '@/lib/auth/helpers'
import { ProfessionalOwnerLayout } from '@/components/owner/professional-owner-layout'
import { OptimizedMovementsPage } from '@/components/movements/optimized-movements-page'

export const metadata: Metadata = {
  title: 'Inventory Operations | Inventory Management',
  description: 'Manage inventory movements, cancellations, and adjustments',
}

interface SearchParams {
  productId?: string
  type?: string
  actorId?: string
  startDate?: string
  endDate?: string
  cursor?: string
}

interface OwnerMovementsPageProps {
  searchParams: Promise<SearchParams>
}

export default async function OwnerMovementsPage({
  searchParams,
}: OwnerMovementsPageProps) {
  await requireRoleOrRedirect('OWNER')
  const resolvedSearchParams = await searchParams

  return (
    <ProfessionalOwnerLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <OptimizedMovementsPage searchParams={resolvedSearchParams} />
      </div>
    </ProfessionalOwnerLayout>
  )
}
