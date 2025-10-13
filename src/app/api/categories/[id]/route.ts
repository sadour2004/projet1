import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/helpers'
import { updateCategorySchema } from '@/lib/validators/category'
import {
  updateCategory,
  deleteCategory,
  getCategoryById,
} from '@/lib/services/category'
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

    // Authentication (all authenticated users can view categories)
    await requireRole('STAFF')

    const { id } = await params
    const category = await getCategoryById(id)

    return NextResponse.json(category)
  } catch (error) {
    const { id } = await params
    logger.error('GET /api/categories/[id] error', { error, categoryId: id })

    if (error instanceof Error) {
      if (error.message === 'Category not found') {
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

    // Authentication and authorization (only OWNER can update categories)
    const user = await requireRole('OWNER')

    // Parse and validate request body
    const { id } = await params
    const body = await req.json()
    const validatedData = updateCategorySchema.parse({
      ...body,
      id,
    })

    const category = await updateCategory(validatedData, user.id)

    return NextResponse.json(category)
  } catch (error) {
    const { id } = await params
    logger.error('PATCH /api/categories/[id] error', { error, categoryId: id })

    if (error instanceof Error) {
      if (error.message === 'Category not found') {
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

    // Authentication and authorization (only OWNER can delete categories)
    const user = await requireRole('OWNER')
    const { id } = await params

    await deleteCategory(id, user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    const { id } = await params
    logger.error('DELETE /api/categories/[id] error', { error, categoryId: id })

    if (error instanceof Error) {
      if (error.message === 'Category not found') {
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
