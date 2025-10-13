import { Metadata } from 'next'
import { requireRoleOrRedirect } from '@/lib/auth/helpers'
import { ProductForm } from '@/components/products/product-form'
// Role enum not available in SQLite, using string literals

export const metadata: Metadata = {
  title: 'Add Product | Inventory Management',
  description: 'Add a new product to your inventory',
}

export default async function NewProductPage() {
  await requireRoleOrRedirect('OWNER')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Add New Product
            </h1>
            <p className="mt-2 text-gray-600">
              Create a new product in your inventory
            </p>
          </div>

          <ProductForm />
        </div>
      </div>
    </div>
  )
}
