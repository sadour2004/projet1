'use client'

import { useState, useEffect } from 'react'
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
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  User,
  Mail,
  Shield,
  Users,
  Eye,
  EyeOff,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  Key,
  Edit,
} from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  role: 'OWNER' | 'STAFF'
  isActive: boolean
  createdAt: string
}

interface UserFormDialogProps {
  user?: User | null
  onClose: () => void
  onSuccess: (user: User) => void
}

interface FormData {
  name: string
  email: string
  password: string
  role: 'OWNER' | 'STAFF'
  isActive: boolean
}

export function UserFormDialog({
  user,
  onClose,
  onSuccess,
}: UserFormDialogProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    role: 'STAFF',
    isActive: true,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [showGeneratedPassword, setShowGeneratedPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState('')

  const isEditing = !!user

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
        isActive: user.isActive,
      })
    }
  }, [user])

  const generateSecurePassword = () => {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setGeneratedPassword(password)
    setFormData((prev) => ({ ...prev, password }))
    setShowGeneratedPassword(true)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setSuccess('Mot de passe copié dans le presse-papiers')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis'
    }

    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Format d'email invalide"
    }

    if (!isEditing && !formData.password) {
      newErrors.password = 'Le mot de passe est requis'
    }

    if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)
    setErrors({})

    try {
      const url = isEditing ? `/api/users/${user.id}` : '/api/users'
      const method = isEditing ? 'PATCH' : 'POST'

      const payload = isEditing
        ? {
            name: formData.name,
            email: formData.email,
            role: formData.role,
            isActive: formData.isActive,
            ...(formData.password && { password: formData.password }),
          }
        : {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            role: formData.role,
            isActive: formData.isActive,
          }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const result = await response.json()

        if (!isEditing && generatedPassword) {
          setSuccess(
            'Utilisateur créé avec succès ! Mot de passe généré automatiquement.'
          )
        } else {
          setSuccess(
            isEditing
              ? 'Utilisateur mis à jour avec succès'
              : 'Utilisateur créé avec succès'
          )
        }

        setTimeout(() => {
          onSuccess(result)
        }, 1000)
      } else {
        const error = await response.json()
        setErrors({ submit: error.error || 'Une erreur est survenue' })
      }
    } catch (error) {
      console.error('Submit error:', error)
      setErrors({ submit: 'Une erreur est survenue' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {isEditing ? (
              <>
                <Edit className="mr-2 h-5 w-5" />
                Modifier l'utilisateur
              </>
            ) : (
              <>
                <User className="mr-2 h-5 w-5" />
                Nouvel utilisateur
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifiez les informations de l'utilisateur"
              : 'Créez un nouveau compte utilisateur pour votre personnel'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {success && (
            <Alert>
              <Check className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {errors.submit && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.submit}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nom complet</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Jean Dupont"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="jean@example.com"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              Mot de passe
              {!isEditing && (
                <Badge variant="outline" className="ml-2 text-xs">
                  Requis
                </Badge>
              )}
            </Label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  placeholder={
                    isEditing
                      ? 'Laisser vide pour ne pas changer'
                      : 'Mot de passe sécurisé'
                  }
                  className={errors.password ? 'border-red-500' : ''}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {!isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateSecurePassword}
                  className="whitespace-nowrap"
                >
                  <Key className="mr-1 h-4 w-4" />
                  Générer
                </Button>
              )}
            </div>
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          {showGeneratedPassword && generatedPassword && (
            <Alert>
              <Key className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span className="font-mono text-sm">{generatedPassword}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(generatedPassword)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="role">Rôle</Label>
            <Select
              value={formData.role}
              onValueChange={(value: 'OWNER' | 'STAFF') =>
                setFormData((prev) => ({ ...prev, role: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STAFF">
                  <div className="flex items-center">
                    <Users className="mr-2 h-4 w-4" />
                    Employé
                  </div>
                </SelectItem>
                <SelectItem value="OWNER">
                  <div className="flex items-center">
                    <Shield className="mr-2 h-4 w-4" />
                    Propriétaire
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, isActive: checked }))
              }
            />
            <Label htmlFor="isActive">Compte activé</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEditing ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
