import { Metadata } from 'next'
import { requireUserOrRedirect } from '@/lib/auth/helpers'
import { OptimizedCartPage } from '@/components/staff/optimized-cart-page'

export const metadata: Metadata = {
  title: 'Panier de Vente | Inventory Management',
  description: 'Gérez votre panier de vente professionnel',
}

export default async function CartPageRoute() {
  await requireUserOrRedirect()

  return <OptimizedCartPage />
}
