import { Metadata } from 'next'
import { requireRoleOrRedirect } from '@/lib/auth/helpers'
import { ProfessionalOwnerLayout } from '@/components/owner/professional-owner-layout'
import { OptimizedProductsPage } from '@/components/products/optimized-products-page'

export const metadata: Metadata = {
  title: 'Products | Inventory Management',
  description: 'Manage your product catalog',
}

interface SearchParams {
  q?: string
  category?: string
  isActive?: string
  cursor?: string
}

interface ProductsPageProps {
  searchParams: Promise<SearchParams>
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  await requireRoleOrRedirect('OWNER')
  const resolvedSearchParams = await searchParams

  return (
    <ProfessionalOwnerLayout>
      <div className="h-full w-full max-w-full px-2 py-4">
        <OptimizedProductsPage searchParams={resolvedSearchParams} />
      </div>
    </ProfessionalOwnerLayout>
  )
}
