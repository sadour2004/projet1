import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { apiRateLimit } from '@/lib/security/rate-limit'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const updateEmailSchema = z.object({
  email: z.string().email('Invalid email address').max(100, 'Email too long'),
})

export async function PUT(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await apiRateLimit(req)
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    // Get current user session
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await req.json()
    const { email } = updateEmailSchema.parse(body)

    // Check if email is already taken by another user
    const existingUser = await db.user.findFirst({
      where: {
        email,
        id: { not: session.user.id },
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email is already in use by another account' },
        { status: 409 }
      )
    }

    // Update user email
    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: { email },
      select: {
        id: true,
        name: true,
        email: true,
        dateOfBirth: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    logger.error('PUT /api/user/profile/email error', { error })

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
