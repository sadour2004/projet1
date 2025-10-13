import { Metadata } from 'next'
import { requireUserOrRedirect } from '@/lib/auth/helpers'
import { OptimizedBrowsePage } from '@/components/staff/optimized-browse-page'

export const metadata: Metadata = {
  title: 'Catalogue Produits | Inventory Management',
  description: 'Parcourir le catalogue de produits',
}

interface SearchParams {
  q?: string
  category?: string
  cursor?: string
}

interface BrowsePageProps {
  searchParams: Promise<SearchParams>
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  await requireUserOrRedirect()
  const resolvedSearchParams = await searchParams

  return <OptimizedBrowsePage searchParams={resolvedSearchParams} />
}
