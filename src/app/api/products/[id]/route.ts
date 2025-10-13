import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/helpers'
import { updateProductSchema } from '@/lib/validators/product'
import {
  updateProduct,
  deleteProduct,
  getProductById,
} from '@/lib/services/product'
import { apiRateLimit } from '@/lib/security/rate-limit'
import { logger } from '@/lib/logger'
// Role enum not available in SQLite, using string literals

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    // Rate limiting
    const rateLimitResult = await apiRateLimit(req)
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    // Authentication (all authenticated users can view products)
    await requireRole('STAFF')

    const { id } = await params
    const product = await getProductById(id)

    return NextResponse.json(product)
  } catch (error) {
    const { id } = await params
    logger.error('GET /api/products/[id] error', { error, productId: id })

    if (error instanceof Error) {
      if (error.message === 'Product not found') {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }

      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    // Rate limiting
    const rateLimitResult = await apiRateLimit(req)
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    // Authentication and authorization (only OWNER can update products)
    const user = await requireRole('OWNER')

    // Parse and validate request body
    const { id } = await params
    const body = await req.json()
    const validatedData = updateProductSchema.parse({
      ...body,
      id,
    })

    const product = await updateProduct(validatedData, user.id)

    return NextResponse.json(product)
  } catch (error) {
    const { id } = await params
    logger.error('PATCH /api/products/[id] error', { error, productId: id })

    if (error instanceof Error) {
      if (error.message === 'Product not found') {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }

      if (error.message.includes('already exists')) {
        return NextResponse.json({ error: error.message }, { status: 409 })
      }

      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    // Rate limiting
    const rateLimitResult = await apiRateLimit(req)
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    // Authentication and authorization (only OWNER can delete products)
    const user = await requireRole('OWNER')
    const { id } = await params

    await deleteProduct(id, user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    const { id } = await params
    logger.error('DELETE /api/products/[id] error', { error, productId: id })

    if (error instanceof Error) {
      if (error.message === 'Product not found') {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }

      if (error.message.includes('Cannot delete')) {
        return NextResponse.json({ error: error.message }, { status: 409 })
      }

      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
