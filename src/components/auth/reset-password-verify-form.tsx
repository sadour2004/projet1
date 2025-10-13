'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react'
import Link from 'next/link'

const dateOfBirthSchema = z.object({
  dateOfBirth: z.string().min(1, 'Date de naissance requise'),
})

const passwordResetSchema = z.object({
  newPassword: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  confirmPassword: z.string().min(1, 'Confirmation du mot de passe requise'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
})

type DateOfBirthForm = z.infer<typeof dateOfBirthSchema>
type PasswordResetForm = z.infer<typeof passwordResetSchema>

export function ResetPasswordVerifyForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')

  const [step, setStep] = useState<'dob' | 'password'>('dob')
  const [dobData, setDobData] = useState<DateOfBirthForm>({
    dateOfBirth: '',
  })
  const [passwordData, setPasswordData] = useState<PasswordResetForm>({
    newPassword: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<Partial<DateOfBirthForm & PasswordResetForm>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Redirect if no email provided
  useEffect(() => {
    if (!email) {
      router.push('/auth/forgot-password')
    }
  }, [email, router])

  const handleDateOfBirthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setErrors({})

    try {
      const validatedData = dateOfBirthSchema.parse(dobData)

      const response = await fetch('/api/auth/verify-dob', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          dateOfBirth: validatedData.dateOfBirth,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la vérification')
      }

      setSuccess('Date de naissance vérifiée avec succès')
      setStep('password')
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Partial<DateOfBirthForm> = {}
        err.errors.forEach((error) => {
          if (error.path[0]) {
            fieldErrors[error.path[0] as keyof DateOfBirthForm] = error.message
          }
        })
        setErrors(fieldErrors)
      } else {
        setError(err instanceof Error ? err.message : 'Erreur lors de la vérification')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setErrors({})

    try {
      const validatedData = passwordResetSchema.parse(passwordData)

      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          newPassword: validatedData.newPassword,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la réinitialisation')
      }

      setSuccess('Mot de passe réinitialisé avec succès')
      
      // Redirect to sign in after 2 seconds
      setTimeout(() => {
        router.push('/auth/signin?message=password-reset-success')
      }, 2000)
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Partial<PasswordResetForm> = {}
        err.errors.forEach((error) => {
          if (error.path[0]) {
            fieldErrors[error.path[0] as keyof PasswordResetForm] = error.message
          }
        })
        setErrors(fieldErrors)
      } else {
        setError(err instanceof Error ? err.message : 'Erreur lors de la réinitialisation')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDobData((prev) => ({ ...prev, dateOfBirth: e.target.value }))
    if (errors.dateOfBirth) {
      setErrors((prev) => ({ ...prev, dateOfBirth: undefined }))
    }
  }

  const handlePasswordChange = (field: keyof PasswordResetForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData((prev) => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  if (!email) {
    return null
  }

  return (
    <div className="mt-8 space-y-6">
      {step === 'dob' ? (
        <form onSubmit={handleDateOfBirthSubmit} className="space-y-4">
          <div>
            <Label htmlFor="dateOfBirth">Date de naissance</Label>
            <Input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              required
              value={dobData.dateOfBirth}
              onChange={handleDobChange}
              className={errors.dateOfBirth ? 'border-red-500' : ''}
            />
            {errors.dateOfBirth && (
              <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Vérifier
          </Button>
        </form>
      ) : (
        <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
          <div>
            <Label htmlFor="newPassword">Nouveau mot de passe</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              value={passwordData.newPassword}
              onChange={handlePasswordChange('newPassword')}
              className={errors.newPassword ? 'border-red-500' : ''}
            />
            {errors.newPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
            )}
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange('confirmPassword')}
              className={errors.confirmPassword ? 'border-red-500' : ''}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Réinitialiser
          </Button>
        </form>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <div className="mt-4 text-center">
        <Link
          href="/auth/signin"
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 hover:underline"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Retour à la connexion
        </Link>
      </div>
    </div>
  )
}
