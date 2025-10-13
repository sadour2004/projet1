'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const emailSchema = z.object({
  email: z.string().email('Adresse e-mail invalide'),
})

type EmailForm = z.infer<typeof emailSchema>

export function ForgotPasswordForm() {
  const router = useRouter()
  const [formData, setFormData] = useState<EmailForm>({
    email: '',
  })
  const [errors, setErrors] = useState<Partial<EmailForm>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setErrors({})

    try {
      const validatedData = emailSchema.parse(formData)
      
      // Navigate to verification page with email parameter
      router.push(`/auth/reset-password-verify?email=${encodeURIComponent(validatedData.email)}`)
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Partial<EmailForm> = {}
        err.errors.forEach((error) => {
          if (error.path[0]) {
            fieldErrors[error.path[0] as keyof EmailForm] = error.message
          }
        })
        setErrors(fieldErrors)
      } else {
        setError('Une erreur inattendue s\'est produite')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange =
    (field: keyof EmailForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }))
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }))
      }
    }

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div>
          <Label htmlFor="email">Adresse e-mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="votre@email.com"
            value={formData.email}
            onChange={handleChange('email')}
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Continuer
      </Button>

      <div className="mt-4 text-center">
        <Link
          href="/auth/signin"
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 hover:underline"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Retour à la connexion
        </Link>
      </div>
    </form>
  )
}
