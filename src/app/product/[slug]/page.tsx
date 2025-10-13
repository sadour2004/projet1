import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { requireUserOrRedirect } from '@/lib/auth/helpers'
import { db } from '@/lib/db'
import { OptimizedProductDetail } from '@/components/staff/optimized-product-detail'
import { MovementType } from '@/types/movement'

interface ProductPageProps {
  params: Promise<{
    slug: string
  }>
}

async function getProduct(slug: string) {
  const product = await db.product.findFirst({
    where: {
      slug,
      isActive: true,
      isArchived: false,
    },
    include: {
      images: {
        orderBy: { priority: 'desc' },
      },
      category: true,
      movements: {
        include: {
          actor: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  })

  if (!product) {
    return null
  }

  // Cast movement types to MovementType enum and return properly typed object
  return {
    ...product,
    movements: product.movements.map((movement) => ({
      ...movement,
      type: movement.type as MovementType,
    })),
  }
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) {
    return {
      title: 'Product Not Found | Inventory Management',
    }
  }

  return {
    title: `${product.name} | Inventory Management`,
    description: product.description || `View details for ${product.name}`,
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  await requireUserOrRedirect()

  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) {
    notFound()
  }

  // Transform the product data to match the component interface
  const transformedProduct = {
    ...product,
    movements: product.movements?.map(movement => ({
      ...movement,
      createdAt: movement.createdAt instanceof Date ? movement.createdAt.toISOString() : movement.createdAt,
      type: movement.type as string,
      actor: movement.actor ? {
        name: movement.actor.name,
        email: movement.actor.email,
      } : {
        name: null,
        email: 'Unknown',
      },
    })) || []
  }

  return <OptimizedProductDetail product={transformedProduct} />
}
