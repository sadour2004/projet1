import { Metadata } from 'next'
import { requireRoleOrRedirect } from '@/lib/auth/helpers'
import { ProductForm } from '@/components/products/product-form'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Edit Product | Inventory Management',
  description: 'Edit product details in your inventory',
}

interface EditProductPageProps {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  await requireRoleOrRedirect('OWNER')
  const { id } = await params

  // Fetch the product data
  const product = await db.product.findUnique({
    where: { id },
    include: {
      images: {
        orderBy: { priority: 'desc' },
      },
      category: true,
    },
  })

  if (!product) {
    notFound()
  }

  // Transform the product data for the form
  const initialData = {
    name: product.name,
    slug: product.slug,
    description: product.description || '',
    sku: product.sku || '',
    priceCents: product.priceCents,
    categoryId: product.categoryId || '',
    images: product.images.map((img) => ({
      url: img.url,
      alt: img.alt || '',
    })),
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
            <p className="mt-2 text-gray-600">
              Update product details in your inventory
            </p>
          </div>

          <ProductForm
            initialData={initialData}
            isEditing={true}
            productId={id}
          />
        </div>
      </div>
    </div>
  )
}
