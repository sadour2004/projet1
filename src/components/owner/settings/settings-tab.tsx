'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Shield, Database, Clock, Globe, Mail, Lock } from 'lucide-react'

export function SettingsTab() {
  const [systemSettings, setSystemSettings] = useState({
    autoBackup: true,
    sessionTimeout: 30,
    language: 'fr',
    timezone: 'Europe/Paris',
  })

  const [securitySettings, setSecuritySettings] = useState({
    twoFactor: false,
    passwordPolicy: true,
    sessionManagement: true,
    auditLogs: true,
  })

  const handleSaveSettings = async (category: string) => {
    // TODO: Implement settings save
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Paramètres Système</h2>
        <p className="mt-1 text-gray-600">
          Configurez les préférences et le comportement du système
        </p>
      </div>

      {/* System Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Database className="mr-2 h-5 w-5" />
            Configuration Système
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">
                    Sauvegarde automatique
                  </Label>
                  <p className="text-sm text-gray-500">
                    Sauvegarde quotidienne des données
                  </p>
                </div>
                <Switch
                  checked={systemSettings.autoBackup}
                  onCheckedChange={(checked) =>
                    setSystemSettings((prev) => ({
                      ...prev,
                      autoBackup: checked,
                    }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="sessionTimeout" className="text-sm font-medium">
                  Timeout de session (minutes)
                </Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={systemSettings.sessionTimeout}
                  onChange={(e) =>
                    setSystemSettings((prev) => ({
                      ...prev,
                      sessionTimeout: parseInt(e.target.value) || 30,
                    }))
                  }
                  className="mt-1"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="language" className="text-sm font-medium">
                  Langue
                </Label>
                <select
                  id="language"
                  value={systemSettings.language}
                  onChange={(e) =>
                    setSystemSettings((prev) => ({
                      ...prev,
                      language: e.target.value,
                    }))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                >
                  <option value="fr">Français</option>
                  <option value="ar">العربية</option>
                </select>
              </div>

              <div>
                <Label htmlFor="timezone" className="text-sm font-medium">
                  Fuseau horaire
                </Label>
                <select
                  id="timezone"
                  value={systemSettings.timezone}
                  onChange={(e) =>
                    setSystemSettings((prev) => ({
                      ...prev,
                      timezone: e.target.value,
                    }))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                >
                  <option value="Europe/Paris">Europe/Paris</option>
                  <option value="Africa/Casablanca">Africa/Casablanca</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
            </div>
          </div>

          <Button
            onClick={() => handleSaveSettings('system')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Sauvegarder la Configuration
          </Button>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Shield className="mr-2 h-5 w-5" />
            Sécurité
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">
                    Authentification à deux facteurs
                  </Label>
                  <p className="text-sm text-gray-500">
                    Sécurité renforcée pour les connexions
                  </p>
                </div>
                <Switch
                  checked={securitySettings.twoFactor}
                  onCheckedChange={(checked) =>
                    setSecuritySettings((prev) => ({
                      ...prev,
                      twoFactor: checked,
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">
                    Politique de mot de passe
                  </Label>
                  <p className="text-sm text-gray-500">
                    Exiger des mots de passe complexes
                  </p>
                </div>
                <Switch
                  checked={securitySettings.passwordPolicy}
                  onCheckedChange={(checked) =>
                    setSecuritySettings((prev) => ({
                      ...prev,
                      passwordPolicy: checked,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">
                    Gestion des sessions
                  </Label>
                  <p className="text-sm text-gray-500">
                    Surveillance des connexions actives
                  </p>
                </div>
                <Switch
                  checked={securitySettings.sessionManagement}
                  onCheckedChange={(checked) =>
                    setSecuritySettings((prev) => ({
                      ...prev,
                      sessionManagement: checked,
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">
                    Journaux d'audit
                  </Label>
                  <p className="text-sm text-gray-500">
                    Enregistrer toutes les activités
                  </p>
                </div>
                <Switch
                  checked={securitySettings.auditLogs}
                  onCheckedChange={(checked) =>
                    setSecuritySettings((prev) => ({
                      ...prev,
                      auditLogs: checked,
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <Button
            onClick={() => handleSaveSettings('security')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Sauvegarder la Sécurité
          </Button>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Database className="mr-2 h-5 w-5" />
            Informations Système
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 p-3">
                <Database className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-900">Base de données</h3>
              <p className="text-sm text-gray-500">SQLite</p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 p-3">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-medium text-gray-900">Uptime</h3>
              <p className="text-sm text-gray-500">99.9%</p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 p-3">
                <Globe className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-medium text-gray-900">Version</h3>
              <p className="text-sm text-gray-500">v1.0.0</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
