import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/helpers'
import { createCategorySchema } from '@/lib/validators/category'
import { createCategory, getCategories } from '@/lib/services/category'
import { apiRateLimit } from '@/lib/security/rate-limit'
import { logger } from '@/lib/logger'
export async function GET(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await apiRateLimit(req)
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    // Authentication (all authenticated users can view categories)
    await requireRole('STAFF')

    const categories = await getCategories()

    return NextResponse.json({ categories })
  } catch (error) {
    logger.error('GET /api/categories error', { error })

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

    // Authentication and authorization (only OWNER can create categories)
    const user = await requireRole('OWNER')

    // Parse and validate request body
    const body = await req.json()
    const validatedData = createCategorySchema.parse(body)

    const category = await createCategory(validatedData, user.id)

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    logger.error('POST /api/categories error', { error })

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
