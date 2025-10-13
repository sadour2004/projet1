import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import * as argon2 from 'argon2'
import { db } from '@/lib/db'
import { apiRateLimit } from '@/lib/security/rate-limit'
import { logger } from '@/lib/logger'

const resetPasswordSchema = z.object({
  email: z.string().email('Adresse e-mail invalide'),
  newPassword: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
})

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await apiRateLimit(req)
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Trop de tentatives' }, { status: 429 })
    }

    // Parse and validate request body
    const body = await req.json()
    const { email, newPassword } = resetPasswordSchema.parse(body)

    // Find user by email
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        isActive: true,
        role: true,
      },
    })

    if (!user) {
      logger.warn('Password reset attempt with non-existent email', { email })
      return NextResponse.json(
        { error: 'Aucun compte trouvé avec cette adresse e-mail' },
        { status: 404 }
      )
    }

    // Check if user is OWNER - password reset is only available for OWNER role
    if (user.role !== 'OWNER') {
      logger.warn('Password reset attempt by non-OWNER user', {
        userId: user.id,
        email: user.email,
        role: user.role,
      })
      return NextResponse.json(
        { error: 'La réinitialisation du mot de passe n\'est pas disponible pour ce type de compte.' },
        { status: 403 }
      )
    }

    if (!user.isActive) {
      logger.warn('Password reset attempt with inactive user', {
        userId: user.id,
        email: user.email,
      })
      return NextResponse.json(
        { error: 'Ce compte a été désactivé' },
        { status: 403 }
      )
    }

    // Hash the new password using Argon2 (same as in auth config)
    const hashedPassword = await argon2.hash(newPassword)

    // Update user password
    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    })

    logger.info('Password reset successful', {
      userId: user.id,
      email: user.email,
    })

    return NextResponse.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès',
    })
  } catch (error) {
    logger.error('POST /api/auth/reset-password error', { error })

    if (error instanceof z.ZodError) {
      const fieldErrors = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }))
      return NextResponse.json(
        { error: 'Données invalides', details: fieldErrors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
