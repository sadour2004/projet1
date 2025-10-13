'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MoreHorizontal,
  Edit,
  Key,
  Trash2,
  UserCheck,
  UserX,
  AlertTriangle,
} from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  role: 'OWNER' | 'STAFF'
  isActive: boolean
}

interface StaffActionsMenuProps {
  user: User
  onEdit: () => void
  onPasswordChange: () => void
  onDelete: () => void
}

export function StaffActionsMenu({
  user,
  onEdit,
  onPasswordChange,
  onDelete,
}: StaffActionsMenuProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (user.role === 'OWNER') {
      alert('Impossible de supprimer le compte propriétaire')
      return
    }

    if (
      !confirm(
        `Êtes-vous sûr de vouloir supprimer l'utilisateur "${user.name}" ?`
      )
    ) {
      return
    }

    try {
      setIsDeleting(true)
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        onDelete()
      } else {
        const error = await response.json()
        alert(error.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Erreur lors de la suppression')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggleStatus = async () => {
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !user.isActive,
        }),
      })

      if (response.ok) {
        // Refresh the page or update the user state
        window.location.reload()
      } else {
        const error = await response.json()
        alert(error.error || 'Erreur lors de la modification')
      }
    } catch (error) {
      console.error('Toggle status error:', error)
      alert('Erreur lors de la modification')
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={onEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Modifier
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onPasswordChange}>
          <Key className="mr-2 h-4 w-4" />
          Changer mot de passe
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleToggleStatus}
          className={user.isActive ? 'text-red-600' : 'text-green-600'}
        >
          {user.isActive ? (
            <>
              <UserX className="mr-2 h-4 w-4" />
              Désactiver
            </>
          ) : (
            <>
              <UserCheck className="mr-2 h-4 w-4" />
              Activer
            </>
          )}
        </DropdownMenuItem>

        {user.role !== 'OWNER' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-red-600 focus:text-red-600"
            >
              {isDeleting ? (
                <>
                  <AlertTriangle className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </>
              )}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
