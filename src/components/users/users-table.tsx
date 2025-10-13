'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Users,
  Edit,
  Trash2,
  Key,
  AlertTriangle,
  Search,
  Shield,
  ShoppingBag,
} from 'lucide-react'
// Role enum not available in SQLite, using string literals

interface User {
  id: string
  email: string
  name?: string | null
  role: 'OWNER' | 'STAFF'
  createdAt: string
  updatedAt: string
  _count: {
    movements: number
    auditLogs: number
  }
}

export function UsersTable() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append('q', searchQuery)
      params.append('limit', '50')

      const response = await fetch(`/api/users?${params.toString()}`)

      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      } else {
        throw new Error('Échec de la récupération des utilisateurs')
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Échec de la récupération des utilisateurs'
      )
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleDelete = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur?')) {
      return
    }

    setDeletingId(userId)

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchUsers()
      } else {
        const errorData = await response.json()
        throw new Error(
          errorData.error || "Échec de la suppression de l'utilisateur"
        )
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Échec de la suppression de l'utilisateur"
      )
    } finally {
      setDeletingId(null)
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getRoleInfo = (role: 'OWNER' | 'STAFF') => {
    if (role === 'OWNER') {
      return {
        label: 'Propriétaire',
        icon: Shield,
        color: 'bg-blue-100 text-blue-800 border-blue-200',
      }
    }
    return {
      label: 'Personnel',
      icon: ShoppingBag,
      color: 'bg-green-100 text-green-800 border-green-200',
    }
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Users className="h-6 w-6" />
            Gestion du Personnel
          </CardTitle>
          <div className="text-sm">
            {users.length} utilisateur{users.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Search */}
        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <Input
              placeholder="Rechercher par nom ou e-mail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-white/20 bg-white/10 pl-10 text-white placeholder:text-white/60"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="mb-2 h-4 w-full rounded bg-gray-200"></div>
                <div className="h-3 w-3/4 rounded bg-gray-200"></div>
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <Users className="mx-auto mb-4 h-16 w-16 text-gray-300" />
            <p className="text-lg font-medium">Aucun utilisateur trouvé</p>
            <p className="text-sm">Ajoutez votre premier membre du personnel</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Activité</TableHead>
                  <TableHead>Date de création</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const roleInfo = getRoleInfo(user.role)
                  const RoleIcon = roleInfo.icon

                  return (
                    <TableRow key={user.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.name || 'Sans nom'}
                          </p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge
                          className={`${roleInfo.color} border font-medium`}
                        >
                          <RoleIcon className="mr-1 h-3 w-3" />
                          {roleInfo.label}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm text-gray-600">
                          <p>{user._count.movements} mouvements</p>
                          <p>{user._count.auditLogs} actions</p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {formatDateTime(user.createdAt)}
                        </span>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" className="h-8">
                            <Key className="h-3 w-3" />
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            disabled={user.role === 'OWNER'}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(user.id)}
                            disabled={
                              deletingId === user.id || user.role === 'OWNER'
                            }
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
