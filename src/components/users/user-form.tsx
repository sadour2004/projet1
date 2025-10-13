'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Loader2,
  UserPlus,
  Copy,
  RefreshCw,
  Check,
  ShoppingBag,
  Shield,
  AlertTriangle,
} from 'lucide-react'
import { useTranslation } from '@/contexts/translation-context'

const userFormSchema = z.object({
  email: z.string().email('Adresse e-mail invalide').max(254),
  name: z.string().min(1, 'Le nom est requis').max(100, 'Nom trop long'),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .max(100),
  role: z.enum(['OWNER', 'STAFF']),
})

type UserForm = z.infer<typeof userFormSchema>

export function UserForm() {
  const { t } = useTranslation()
  const router = useRouter()
  const [formData, setFormData] = useState<UserForm>({
    email: '',
    name: '',
    password: '',
    role: 'STAFF',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [passwordCopied, setPasswordCopied] = useState(false)

  const generatePassword = () => {
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%'
    let password = ''
    const length = 12
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)

    for (let i = 0; i < length; i++) {
      password += charset[array[i] % charset.length]
    }

    setFormData((prev) => ({ ...prev, password }))
    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors.password
      return newErrors
    })
  }

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(formData.password)
      setPasswordCopied(true)
      setTimeout(() => setPasswordCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy password:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')
    setErrors({})

    try {
      const validatedData = userFormSchema.parse(formData)

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Échec de la création de l'utilisateur")
      }

      setSuccess(
        `Utilisateur créé avec succès! Mot de passe: ${formData.password}`
      )

      // Reset form
      setFormData({
        email: '',
        name: '',
        password: '',
        role: 'STAFF',
      })

      // Refresh the page to update users table
      router.refresh()
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {}
        err.errors.forEach((error) => {
          if (error.path[0] && typeof error.path[0] === 'string') {
            fieldErrors[error.path[0]] = error.message
          }
        })
        setErrors(fieldErrors)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Une erreur inattendue s'est produite")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: keyof UserForm) => (value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white">
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Ajouter un Membre du Personnel
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <Label htmlFor="name" className="text-sm font-medium">
              Nom Complet
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name')(e.target.value)}
              className={`mt-1 ${errors.name ? 'border-red-500' : ''}`}
              placeholder="Ex: Ahmed Bennani"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email" className="text-sm font-medium">
              Adresse E-mail
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email')(e.target.value)}
              className={`mt-1 ${errors.email ? 'border-red-500' : ''}`}
              placeholder="exemple@magasin.ma"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Role */}
          <div>
            <Label htmlFor="role" className="text-sm font-medium">
              Rôle
            </Label>
            <Select value={formData.role} onValueChange={handleChange('role')}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Sélectionner un rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STAFF">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4" />
                    Personnel (Ventes & Stock)
                  </div>
                </SelectItem>
                <SelectItem value="OWNER">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Propriétaire (Accès Complet)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <Label htmlFor="password" className="text-sm font-medium">
              Mot de Passe
            </Label>
            <div className="mt-1 flex gap-2">
              <Input
                id="password"
                type="text"
                value={formData.password}
                onChange={(e) => handleChange('password')(e.target.value)}
                className={`flex-1 ${errors.password ? 'border-red-500' : ''}`}
                placeholder="Générer ou saisir un mot de passe"
              />
              <Button
                type="button"
                variant="outline"
                onClick={generatePassword}
                className="px-3"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              {formData.password && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={copyPassword}
                  className="px-3"
                >
                  {passwordCopied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Cliquez sur <RefreshCw className="inline h-3 w-3" /> pour générer
              un mot de passe sécurisé
            </p>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          {formData.password && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertDescription className="text-sm">
                ⚠️ <strong>Important:</strong> Partagez ce mot de passe avec
                l'utilisateur de manière sécurisée. L'utilisateur pourra le
                changer après sa première connexion.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">
                {success}
              </AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-green-600 to-green-700 py-6 font-medium text-white hover:from-green-700 hover:to-green-800"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <UserPlus className="mr-2 h-4 w-4" />
            Créer l'Utilisateur
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
