import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/helpers'
import {
  createProductSchema,
  productQuerySchema,
} from '@/lib/validators/product'
import { createProduct, getProducts } from '@/lib/services/product'
import { apiRateLimit } from '@/lib/security/rate-limit'
import { logger } from '@/lib/logger'
export async function GET(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await apiRateLimit(req)
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    // Authentication (all authenticated users can view products)
    await requireRole('STAFF')

    // Parse query parameters
    const { searchParams } = new URL(req.url)
    const query = productQuerySchema.parse({
      q: searchParams.get('q') || undefined,
      category: searchParams.get('category') || undefined,
      isActive: searchParams.get('isActive')
        ? searchParams.get('isActive') === 'true'
        : undefined,
      cursor: searchParams.get('cursor') || undefined,
      limit: searchParams.get('limit')
        ? parseInt(searchParams.get('limit')!)
        : undefined,
    })

    const result = await getProducts(query)

    return NextResponse.json(result)
  } catch (error) {
    logger.error('GET /api/products error', { error })

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await apiRateLimit(req)
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    // Authentication and authorization (only OWNER can create products)
    const user = await requireRole('OWNER')

    // Parse and validate request body
    const body = await req.json()
    const validatedData = createProductSchema.parse(body)

    const product = await createProduct(validatedData, user.id)

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    logger.error('POST /api/products error', { error })

    if (error instanceof Error) {
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
