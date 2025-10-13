import { Metadata } from 'next'
import { requireRoleOrRedirect } from '@/lib/auth/helpers'
import { ProfessionalOwnerLayout } from '@/components/owner/professional-owner-layout'
import { OptimizedStockAdjustmentsPage } from '@/components/owner/adjustments/optimized-stock-adjustments-page'

export const metadata: Metadata = {
  title: 'Ajustements de Stock | Inventory Management',
  description: 'Gestion des ajustements de stock et inventaire',
}

export default async function StockAdjustmentsPageRoute() {
  await requireRoleOrRedirect('OWNER')

  return (
    <ProfessionalOwnerLayout>
      <OptimizedStockAdjustmentsPage />
    </ProfessionalOwnerLayout>
  )
}
