import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/helpers'
import { createUserSchema, userQuerySchema } from '@/lib/validators/user'
import { createUser, getUsers } from '@/lib/services/user'
import { apiRateLimit } from '@/lib/security/rate-limit'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await apiRateLimit(req)
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    // Authentication and authorization (only OWNER can view users)
    await requireRole('OWNER')

    // Parse query parameters
    const { searchParams } = new URL(req.url)
    const query = {
      search: searchParams.get('search') || undefined,
      role: searchParams.get('role') === 'STAFF' ? 'STAFF' : undefined,
      limit: parseInt(searchParams.get('limit') || '20'),
      cursor: searchParams.get('cursor') || undefined,
    }

    // Validate query parameters
    const validatedQuery = userQuerySchema.parse(query)

    const result = await getUsers(validatedQuery)

    return NextResponse.json(result)
  } catch (error) {
    logger.error('GET /api/users error', { error })

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

    // Authentication and authorization (only OWNER can create users)
    const user = await requireRole('OWNER')

    // Parse and validate request body
    const body = await req.json()
    const validatedData = createUserSchema.parse(body)

    const result = await createUser(validatedData, user.id)

    return NextResponse.json(result.user, { status: 201 })
  } catch (error) {
    logger.error('POST /api/users error', { error })

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
