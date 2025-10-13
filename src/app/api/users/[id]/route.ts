import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/helpers'
import { updateUserSchema } from '@/lib/validators/user'
import { updateUser, deleteUser, getUserById } from '@/lib/services/user'
import { apiRateLimit } from '@/lib/security/rate-limit'
import { logger } from '@/lib/logger'

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

    // Authentication and authorization (only OWNER can view user details)
    await requireRole('OWNER')

    const { id } = await params
    const user = await getUserById(id)

    return NextResponse.json(user)
  } catch (error) {
    const { id } = await params
    logger.error('GET /api/users/[id] error', { error, userId: id })

    if (error instanceof Error) {
      if (error.message === 'User not found') {
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

    // Authentication and authorization (only OWNER can update users)
    const user = await requireRole('OWNER')

    // Parse and validate request body
    const { id } = await params
    const body = await req.json()
    const validatedData = updateUserSchema.parse({
      ...body,
      id,
    })

    const updatedUser = await updateUser(validatedData, user.id)

    return NextResponse.json(updatedUser)
  } catch (error) {
    const { id } = await params
    logger.error('PATCH /api/users/[id] error', { error, userId: id })

    if (error instanceof Error) {
      if (error.message === 'User not found') {
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

    // Authentication and authorization (only OWNER can delete users)
    const user = await requireRole('OWNER')
    const { id } = await params

    await deleteUser(id, user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    const { id } = await params
    logger.error('DELETE /api/users/[id] error', { error, userId: id })

    if (error instanceof Error) {
      if (error.message === 'User not found') {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }

      if (error.message.includes('Cannot delete owner')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }

      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
