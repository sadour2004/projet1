import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { apiRateLimit } from '@/lib/security/rate-limit'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const updateDobSchema = z.object({
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
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
    const { dateOfBirth } = updateDobSchema.parse(body)

    // Validate that the date is not in the future
    const dobDate = new Date(dateOfBirth)
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset time to start of day for accurate comparison

    if (dobDate > today) {
      return NextResponse.json(
        { error: 'Date of birth cannot be in the future' },
        { status: 400 }
      )
    }

    // Validate that the user is not too young (minimum age 13)
    const ageInYears = today.getFullYear() - dobDate.getFullYear()
    const monthDiff = today.getMonth() - dobDate.getMonth()
    const actualAge =
      monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())
        ? ageInYears - 1
        : ageInYears

    if (actualAge < 13) {
      return NextResponse.json(
        { error: 'User must be at least 13 years old' },
        { status: 400 }
      )
    }

    // Update user date of birth
    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: { dateOfBirth },
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
    logger.error('PUT /api/user/profile/dateOfBirth error', { error })

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
