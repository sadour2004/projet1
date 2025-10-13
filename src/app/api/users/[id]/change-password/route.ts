import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/helpers'
import {
  changePasswordSchema,
  resetPasswordSchema,
} from '@/lib/validators/user'
import { changeUserPassword, resetUserPassword } from '@/lib/services/user'
import { apiRateLimit } from '@/lib/security/rate-limit'
import { logger } from '@/lib/logger'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    // Rate limiting
    const rateLimitResult = await apiRateLimit(req)
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    // Authentication and authorization (only OWNER can change passwords)
    const user = await requireRole('OWNER')

    // Parse and validate request body
    const body = await req.json()

    // Check if it's a password change or reset
    const { id } = await params
    if (body.newPassword) {
      // Change password with provided new password
      changePasswordSchema.parse({
        id,
        newPassword: body.newPassword,
      })

      await changeUserPassword(id, body.newPassword, user.id)

      return NextResponse.json({ success: true })
    } else {
      // Reset password (generate new random password)
      resetPasswordSchema.parse({
        id,
      })

      const result = await resetUserPassword(id, user.id)

      return NextResponse.json({
        success: true,
        newPassword: result.newPassword,
      })
    }
  } catch (error) {
    const { id } = await params
    logger.error('POST /api/users/[id]/change-password error', {
      error,
      userId: id,
    })

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
