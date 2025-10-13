'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { User, Mail, Lock, Calendar, Edit3, Save, Check, X } from 'lucide-react'

interface UserProfile {
  id: string
  name: string
  email: string
  dateOfBirth?: string
}

export function ProfessionalSettingsPage() {
  const { data: session, update } = useSession()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Field editing states
  const [editingName, setEditingName] = useState(false)
  const [editingEmail, setEditingEmail] = useState(false)
  const [editingPassword, setEditingPassword] = useState(false)
  const [editingDob, setEditingDob] = useState(false)

  // Form values
  const [nameValue, setNameValue] = useState('')
  const [emailValue, setEmailValue] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [dobValue, setDobValue] = useState('')

  // Loading states
  const [savingName, setSavingName] = useState(false)
  const [savingEmail, setSavingEmail] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [savingDob, setSavingDob] = useState(false)

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/users/profile')
      if (!response.ok) throw new Error('Failed to fetch profile')

      const userData = await response.json()
      setUser(userData)
      setNameValue(userData.name || '')
      setEmailValue(userData.email || '')
      setDobValue(userData.dateOfBirth || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const saveField = async (field: string, value: string) => {
    try {
      const response = await fetch(`/api/user/profile/${field}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: value }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update profile')
      }

      const updatedData = await response.json()
      setUser(updatedData)
      setSuccess('Profil mis à jour avec succès')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    }
  }

  const handleSaveName = async () => {
    if (!nameValue.trim()) {
      setError('Le nom ne peut pas être vide')
      return
    }

    setSavingName(true)
    try {
      await saveField('name', nameValue.trim())
      setEditingName(false)
    } finally {
      setSavingName(false)
    }
  }

  const handleSaveEmail = async () => {
    if (!emailValue.trim() || !emailValue.includes('@')) {
      setError('Veuillez entrer une adresse email valide')
      return
    }

    setSavingEmail(true)
    try {
      await saveField('email', emailValue.trim())
      setEditingEmail(false)
      // Update session with new email
      await update({ email: emailValue.trim() })
    } finally {
      setSavingEmail(false)
    }
  }

  const handleSavePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Tous les champs de mot de passe sont requis')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Les nouveaux mots de passe ne correspondent pas')
      return
    }

    if (newPassword.length < 6) {
      setError('Le nouveau mot de passe doit contenir au moins 6 caractères')
      return
    }

    setSavingPassword(true)
    try {
      const response = await fetch('/api/user/profile/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update password')
      }

      setSuccess('Mot de passe mis à jour avec succès')
      setEditingPassword(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password')
    } finally {
      setSavingPassword(false)
    }
  }

  const handleSaveDob = async () => {
    if (!dobValue) {
      setError('La date de naissance est requise')
      return
    }

    setSavingDob(true)
    try {
      await saveField('dateOfBirth', dobValue)
      setEditingDob(false)
    } finally {
      setSavingDob(false)
    }
  }

  const cancelEdit = (field: string) => {
    switch (field) {
      case 'name':
        setNameValue(user?.name || '')
        setEditingName(false)
        break
      case 'email':
        setEmailValue(user?.email || '')
        setEditingEmail(false)
        break
      case 'password':
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setEditingPassword(false)
        break
      case 'dob':
        setDobValue(user?.dateOfBirth || '')
        setEditingDob(false)
        break
    }
    setError('')
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="text-gray-600">Chargement du profil...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Paramètres du Profil
        </h1>
        <p className="mt-2 text-gray-600">
          Gérez vos informations personnelles et paramètres de compte
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <X className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {/* Name Field */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Nom
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Input
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  disabled={!editingName}
                  placeholder="Votre nom complet"
                />
              </div>
              <div className="flex space-x-2">
                {editingName ? (
                  <>
                    <Button
                      onClick={handleSaveName}
                      disabled={savingName}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {savingName ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      onClick={() => cancelEdit('name')}
                      disabled={savingName}
                      variant="outline"
                      size="sm"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => setEditingName(true)}
                    variant="outline"
                    size="sm"
                  >
                    <Edit3 className="mr-1 h-4 w-4" />
                    Modifier
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Field */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="mr-2 h-5 w-5" />
              Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Input
                  type="email"
                  value={emailValue}
                  onChange={(e) => setEmailValue(e.target.value)}
                  disabled={!editingEmail}
                  placeholder="votre@email.com"
                />
              </div>
              <div className="flex space-x-2">
                {editingEmail ? (
                  <>
                    <Button
                      onClick={handleSaveEmail}
                      disabled={savingEmail}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {savingEmail ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      onClick={() => cancelEdit('email')}
                      disabled={savingEmail}
                      variant="outline"
                      size="sm"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => setEditingEmail(true)}
                    variant="outline"
                    size="sm"
                  >
                    <Edit3 className="mr-1 h-4 w-4" />
                    Modifier
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Password Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="mr-2 h-5 w-5" />
              Mot de passe
            </CardTitle>
          </CardHeader>
          <CardContent>
            {editingPassword ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Entrez votre mot de passe actuel"
                  />
                </div>
                <div>
                  <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Entrez votre nouveau mot de passe"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">
                    Confirmer le nouveau mot de passe
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirmez votre nouveau mot de passe"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleSavePassword}
                    disabled={savingPassword}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {savingPassword ? (
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Enregistrer
                  </Button>
                  <Button
                    onClick={() => cancelEdit('password')}
                    disabled={savingPassword}
                    variant="outline"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Annuler
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => setEditingPassword(true)}
                variant="outline"
              >
                <Lock className="mr-2 h-4 w-4" />
                Changer le mot de passe
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Date of Birth Field */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Date de naissance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Input
                    type="date"
                    value={dobValue}
                    onChange={(e) => setDobValue(e.target.value)}
                    disabled={!editingDob}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Utilisée pour la récupération du compte. Assurez-vous
                    qu'elle est correcte.
                  </p>
                </div>
                <div className="flex space-x-2">
                  {editingDob ? (
                    <>
                      <Button
                        onClick={handleSaveDob}
                        disabled={savingDob}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {savingDob ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        onClick={() => cancelEdit('dob')}
                        disabled={savingDob}
                        variant="outline"
                        size="sm"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => setEditingDob(true)}
                      variant="outline"
                      size="sm"
                    >
                      <Edit3 className="mr-1 h-4 w-4" />
                      Modifier
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
