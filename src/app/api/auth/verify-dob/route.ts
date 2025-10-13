import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { apiRateLimit } from '@/lib/security/rate-limit'
import { logger } from '@/lib/logger'

const verifyDobSchema = z.object({
  email: z.string().email('Adresse e-mail invalide'),
  dateOfBirth: z.string().min(1, 'Date de naissance requise'),
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
    const { email, dateOfBirth } = verifyDobSchema.parse(body)

    // Find user by email
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        dateOfBirth: true,
        isActive: true,
        role: true,
      },
    })

    if (!user) {
      logger.warn('Date of birth verification attempt with non-existent email', { email })
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
      logger.warn('Date of birth verification attempt with inactive user', {
        userId: user.id,
        email: user.email,
      })
      return NextResponse.json(
        { error: 'Ce compte a été désactivé' },
        { status: 403 }
      )
    }

    // Check if user has date of birth set
    if (!user.dateOfBirth) {
      logger.warn('Date of birth verification attempt for user without date of birth', {
        userId: user.id,
        email: user.email,
      })
      return NextResponse.json(
        { error: 'Aucune date de naissance associée à ce compte' },
        { status: 400 }
      )
    }

    // Compare date of birth (format: YYYY-MM-DD)
    if (user.dateOfBirth !== dateOfBirth) {
      logger.warn('Date of birth verification failed', {
        userId: user.id,
        email: user.email,
      })
      return NextResponse.json(
        { error: 'Date de naissance incorrecte' },
        { status: 400 }
      )
    }

    logger.info('Date of birth verification successful', {
      userId: user.id,
      email: user.email,
    })

    return NextResponse.json({
      success: true,
      message: 'Date de naissance vérifiée avec succès',
    })
  } catch (error) {
    logger.error('POST /api/auth/verify-dob error', { error })

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
