'use client'

import { memo, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Package,
  Calendar,
  Filter,
} from 'lucide-react'
import {
  MovementType,
  MOVEMENT_TYPE_COLORS,
  MOVEMENT_TYPE_LABELS,
} from '@/types/movement'

interface Movement {
  id: string
  type: MovementType
  qty: number
  unitPriceCents?: number | null
  note?: string | null
  createdAt: string
  product: {
    id: string
    name: string
    sku?: string | null
  }
  actor: {
    id: string
    name?: string | null
    email: string
  } | null
}

interface OptimizedMovementsTableProps {
  movements?: Movement[]
  isLoading?: boolean
  onDateFilter?: (date: string) => void
  onTypeFilter?: (type: string) => void
}

const OptimizedMovementsTableComponent = ({ 
  movements = [],
  isLoading = false,
  onDateFilter,
  onTypeFilter,
}: OptimizedMovementsTableProps) => {
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedType, setSelectedType] = useState('')

  // Handle date change
  const handleDateChange = useCallback((date: string) => {
    setSelectedDate(date)
    if (onDateFilter) {
      onDateFilter(date)
    }
  }, [onDateFilter])

  // Handle type change
  const handleTypeChange = useCallback((type: string) => {
    setSelectedType(type)
    if (onTypeFilter) {
      onTypeFilter(type)
    }
  }, [onTypeFilter])

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSelectedDate('')
    setSelectedType('')
    if (onDateFilter) {
      onDateFilter('')
    }
    if (onTypeFilter) {
      onTypeFilter('')
    }
  }, [onDateFilter, onTypeFilter])

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Liste des Mouvements</span>
          </div>
          <Badge variant="secondary">
            {movements.length} mouvement(s)
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Date Filter */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Date:</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-40"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Type Filter */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Type:</label>
              <Select value={selectedType} onValueChange={handleTypeChange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous les types</SelectItem>
                  <SelectItem value="SALE_OFFLINE">Vente</SelectItem>
                  <SelectItem value="RETURN">Retour</SelectItem>
                  <SelectItem value="ADJUSTMENT">Ajustement</SelectItem>
                  <SelectItem value="CANCEL_SALE">Annulation</SelectItem>
                  <SelectItem value="LOSS">Perte</SelectItem>
                </SelectContent>
              </Select>
            </div>
              </div>

          {/* Filter Actions */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDateChange(new Date().toISOString().split('T')[0])}
            >
              Aujourd'hui
            </Button>
            {(selectedDate || selectedType) && (
              <Button variant="outline" size="sm" onClick={clearAllFilters}>
                  <Filter className="mr-2 h-4 w-4" />
                Effacer tous
                </Button>
              )}
          </div>
        </div>

        {/* Movements Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Quantité</TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="h-4 w-32 animate-pulse rounded bg-gray-200"></div>
                        <div className="h-3 w-24 animate-pulse rounded bg-gray-200"></div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="h-6 w-20 animate-pulse rounded bg-gray-200"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-12 animate-pulse rounded bg-gray-200"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-24 animate-pulse rounded bg-gray-200"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-28 animate-pulse rounded bg-gray-200"></div>
                    </TableCell>
                  </TableRow>
                ))
              ) : movements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="text-gray-500">
                      <Package className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2">Aucun mouvement trouvé</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                movements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{movement.product.name}</div>
                        {movement.product.sku && (
                          <div className="text-sm text-gray-500">SKU: {movement.product.sku}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={MOVEMENT_TYPE_COLORS[movement.type]}>
                        {MOVEMENT_TYPE_LABELS[movement.type]}
                      </Badge>
                    </TableCell>
                    <TableCell className={`font-medium ${movement.qty > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {movement.qty > 0 ? `+${movement.qty}` : movement.qty}
                    </TableCell>
                    <TableCell>
                      {movement.actor ? (
                        <div>
                          <div className="font-medium">{movement.actor.name || 'Utilisateur'}</div>
                          <div className="text-sm text-gray-500">{movement.actor.email}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Système</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{formatDate(movement.createdAt)}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

      </CardContent>
    </Card>
  )
}

export const OptimizedMovementsTable = memo(OptimizedMovementsTableComponent)