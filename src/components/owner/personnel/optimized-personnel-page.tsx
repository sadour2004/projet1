'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Users,
  UserPlus,
  MoreHorizontal,
  Edit,
  Trash2,
  Shield,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Activity,
} from 'lucide-react'
import { UserFormDialog } from './user-form-dialog'
import { PasswordChangeDialog } from './password-change-dialog'
import { StaffActionsMenu } from './staff-actions-menu'
import { StaffStatsCards } from './staff-stats-cards'

interface User {
  id: string
  name: string
  email: string
  role: 'OWNER' | 'STAFF'
  isActive: boolean
  createdAt: string
  lastLoginAt?: string
}

interface StaffStats {
  total: number
  active: number
  recent: number
  owner: number
  staff: number
}

export function OptimizedPersonnelPage() {
  const [users, setUsers] = useState<User[]>([])
  const [staffStats, setStaffStats] = useState<StaffStats>({
    total: 0,
    active: 0,
    recent: 0,
    owner: 0,
    staff: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  // Memoize filtered users to prevent unnecessary recalculations
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users
    
    const term = searchTerm.toLowerCase()
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
    )
  }, [users, searchTerm])

  // Memoize stats calculation
  const calculatedStats = useMemo(() => {
    if (users.length === 0) return staffStats

    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    return {
      total: users.length,
      active: users.filter((u) => u.isActive).length,
      recent: users.filter((u) => new Date(u.createdAt) > sevenDaysAgo).length,
      owner: users.filter((u) => u.role === 'OWNER').length,
      staff: users.filter((u) => u.role === 'STAFF').length,
    }
  }, [users])

  // Fetch users data
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true)
        setError('')

        const response = await fetch('/api/users')
        
        if (response.ok) {
          const data = await response.json()
          const userList = Array.isArray(data) ? data : data.users || []
          setUsers(userList)
        } else {
          throw new Error('Failed to fetch users')
        }
      } catch (err) {
        console.error('Failed to fetch users:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch users')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [])

  // Update stats when users change
  useEffect(() => {
    setStaffStats(calculatedStats)
  }, [calculatedStats])

  const handleUserCreated = (newUser: User) => {
    setUsers((prev) => [newUser, ...prev])
    setShowAddDialog(false)
  }

  const handleUserUpdated = (updatedUser: User) => {
    setUsers((prev) =>
      prev.map((user) => (user.id === updatedUser.id ? updatedUser : user))
    )
    setEditingUser(null)
  }

  const handleUserDeleted = (userId: string) => {
    setUsers((prev) => prev.filter((user) => user.id !== userId))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getRoleIcon = (role: string) => {
    return role === 'OWNER' ? Shield : Users
  }

  const getRoleColor = (role: string) => {
    return role === 'OWNER'
      ? 'bg-purple-100 text-purple-800'
      : 'bg-blue-100 text-blue-800'
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <div className="mb-4 text-red-600">
          <h3 className="text-lg font-semibold">Erreur de chargement</h3>
          <p className="text-sm">{error}</p>
        </div>
        <Button onClick={() => window.location.reload()}>
          Réessayer
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Gestion du Personnel
            </h1>
            <p className="mt-2 text-gray-600">
              Gérez votre équipe et créez des comptes employés
            </p>
          </div>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Ajouter un Employé
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <StaffStatsCards stats={staffStats} isLoading={isLoading} />

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Rechercher par nom ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="text-sm text-gray-500">
              {filteredUsers.length} employé(s) trouvé(s)
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Liste des Employés
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="mb-2 h-4 w-full rounded bg-gray-200"></div>
                  <div className="h-3 w-3/4 rounded bg-gray-200"></div>
                </div>
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <Users className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <p>Aucun employé trouvé</p>
              {searchTerm && (
                <Button
                  variant="outline"
                  onClick={() => setSearchTerm('')}
                  className="mt-2"
                >
                  Effacer la recherche
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => {
                const RoleIcon = getRoleIcon(user.role)
                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                        <RoleIcon className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-gray-900">
                            {user.name}
                          </h3>
                          <Badge className={getRoleColor(user.role)}>
                            {user.role === 'OWNER' ? 'Propriétaire' : 'Employé'}
                          </Badge>
                          {user.isActive ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Mail className="h-3 w-3" />
                            <span>{user.email}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>Créé le {formatDate(user.createdAt)}</span>
                          </div>
                          {user.lastLoginAt && (
                            <div className="flex items-center space-x-1">
                              <Activity className="h-3 w-3" />
                              <span>
                                Dernière connexion: {formatDate(user.lastLoginAt)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <StaffActionsMenu
                      user={user}
                      onEdit={() => setEditingUser(user)}
                      onPasswordChange={() => {
                        setSelectedUser(user)
                        setShowPasswordDialog(true)
                      }}
                      onDelete={() => handleUserDeleted(user.id)}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      {showAddDialog && (
        <UserFormDialog
          onClose={() => setShowAddDialog(false)}
          onSuccess={handleUserCreated}
        />
      )}

      {editingUser && (
        <UserFormDialog
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSuccess={handleUserUpdated}
        />
      )}

      {showPasswordDialog && selectedUser && (
        <PasswordChangeDialog
          user={selectedUser}
          onClose={() => {
            setShowPasswordDialog(false)
            setSelectedUser(null)
          }}
        />
      )}
    </div>
  )
}
