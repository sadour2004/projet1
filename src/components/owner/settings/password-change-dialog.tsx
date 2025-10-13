'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Lock, Key, Eye, EyeOff } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
  updatedAt: string
}

interface PasswordChangeDialogProps {
  user: User
  onClose: () => void
  onSuccess: () => void
}

export function PasswordChangeDialog({
  user,
  onClose,
  onSuccess,
}: PasswordChangeDialogProps) {
  const [action, setAction] = useState<'change' | 'reset'>('change')
  const [newPassword, setNewPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/users/${user.id}/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPassword: action === 'change' ? newPassword : undefined,
        }),
      })

      if (response.ok) {
        const result = await response.json()

        if (action === 'reset' && result.newPassword) {
          setGeneratedPassword(result.newPassword)
          setSuccess('Mot de passe réinitialisé avec succès')
        } else {
          setSuccess('Mot de passe modifié avec succès')
          setTimeout(() => {
            onSuccess()
          }, 1500)
        }
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Une erreur est survenue')
      }
    } catch (error) {
      console.error('Failed to change password:', error)
      setError('Erreur de connexion')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">
            Gestion du Mot de Passe
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 rounded-lg bg-gray-50 p-3">
            <p className="text-sm text-gray-600">
              <strong>Employé:</strong> {user.name}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Email:</strong> {user.email}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded border border-green-200 bg-green-50 px-4 py-3 text-green-700">
                {success}
              </div>
            )}

            <div className="space-y-3">
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant={action === 'change' ? 'default' : 'outline'}
                  onClick={() => setAction('change')}
                  className="flex-1"
                >
                  <Key className="mr-2 h-4 w-4" />
                  Modifier
                </Button>
                <Button
                  type="button"
                  variant={action === 'reset' ? 'default' : 'outline'}
                  onClick={() => setAction('reset')}
                  className="flex-1"
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Réinitialiser
                </Button>
              </div>
            </div>

            {action === 'change' && (
              <div>
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Minimum 8 caractères
                </p>
              </div>
            )}

            {action === 'reset' && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Attention:</strong> Cette action générera un nouveau
                  mot de passe aléatoire. Assurez-vous de le communiquer à
                  l'employé de manière sécurisée.
                </p>
              </div>
            )}

            {generatedPassword && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <Label className="text-sm font-medium text-blue-900">
                  Nouveau mot de passe généré:
                </Label>
                <div className="mt-2 rounded border border-blue-300 bg-white p-2 text-center font-mono text-lg">
                  {generatedPassword}
                </div>
                <p className="mt-2 text-xs text-blue-700">
                  Copiez ce mot de passe et communiquez-le à l'employé de
                  manière sécurisée.
                </p>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Fermer
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || (action === 'change' && !newPassword)}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting
                  ? 'Traitement...'
                  : action === 'change'
                    ? 'Modifier le Mot de Passe'
                    : 'Réinitialiser le Mot de Passe'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
