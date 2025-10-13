'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  TrendingDown,
  Search,
  Calendar,
  Package,
  User,
  RefreshCw,
  History,
} from 'lucide-react'

interface Adjustment {
  id: string
  productId: string
  type: string
  qty: number
  note: string
  createdAt: string
  product?: {
    id: string
    name: string
    sku?: string
    stockCached: number
  }
  actor?: {
    name: string
    email: string
  }
}

export function SimpleAdjustmentsHistory() {
  const [adjustments, setAdjustments] = useState<Adjustment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('')

  const fetchAdjustments = async () => {
    try {
      setIsLoading(true)
      setError('')

      const params = new URLSearchParams()
      params.append('type', 'ADJUSTMENT')
      params.append('limit', '50')

      const response = await fetch(`/api/movements?${params.toString()}`)
      
      if (response.ok) {
        const data = await response.json()
        
        // Ensure we have a valid array
        const adjustmentsList = Array.isArray(data.movements) ? data.movements : []
        setAdjustments(adjustmentsList)
      } else {
        throw new Error('Failed to fetch adjustments')
      }
    } catch (err) {
      console.error('Failed to fetch adjustments:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch adjustments')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAdjustments()
  }, [])

  // Simple filtering without useMemo to avoid potential issues
  const getFilteredAdjustments = () => {
    let filtered = adjustments || []

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((adj) => {
        if (!adj) return false
        return (
          (adj.product?.name || '').toLowerCase().includes(query) ||
          (adj.product?.sku || '').toLowerCase().includes(query) ||
          (adj.note || '').toLowerCase().includes(query) ||
          (adj.actor?.name || '').toLowerCase().includes(query)
        )
      })
    }

    if (dateFilter) {
      const filterDate = new Date(dateFilter)
      filtered = filtered.filter((adj) => {
        if (!adj?.createdAt) return false
        const adjDate = new Date(adj.createdAt)
        return adjDate.toDateString() === filterDate.toDateString()
      })
    }

    return filtered
  }

  const getAdjustmentBadge = (qty: number) => {
    return qty > 0
      ? {
          color: 'bg-green-100 text-green-800',
          icon: TrendingUp,
          label: 'Augmentation',
        }
      : {
          color: 'bg-red-100 text-red-800',
          icon: TrendingDown,
          label: 'Diminution',
        }
  }

  const formatDateTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return 'Date invalide'
    }
  }

  const formatQuantity = (qty: number) => {
    return qty > 0 ? `+${qty}` : qty.toString()
  }

  const filteredAdjustments = getFilteredAdjustments()

  if (error) {
    return (
      <div className="py-8 text-center">
        <div className="mb-4 text-red-600">
          <h3 className="text-lg font-semibold">Erreur de chargement</h3>
          <p className="text-sm">{error}</p>
        </div>
        <Button onClick={fetchAdjustments}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Réessayer
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Rechercher par produit, SKU, note ou utilisateur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="pl-10"
                />
              </div>
              {dateFilter && (
                <Button
                  variant="outline"
                  onClick={() => setDateFilter('')}
                  className="px-3"
                >
                  Effacer
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Adjustments List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <History className="h-5 w-5" />
              <span>Historique des Ajustements</span>
            </div>
            <Badge variant="secondary">
              {filteredAdjustments.length} résultat(s)
            </Badge>
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
          ) : filteredAdjustments.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <History className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <p>Aucun ajustement trouvé</p>
              {(searchQuery || dateFilter) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('')
                    setDateFilter('')
                  }}
                  className="mt-2"
                >
                  Effacer les filtres
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAdjustments.map((adjustment) => {
                if (!adjustment || !adjustment.id) return null
                
                const badge = getAdjustmentBadge(adjustment.qty || 0)
                const Icon = badge.icon
                
                return (
                  <div
                    key={adjustment.id}
                    className="rounded-lg border p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                          <Icon className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-gray-900">
                              {adjustment.product?.name || 'Produit inconnu'}
                            </h3>
                            {adjustment.product?.sku && (
                              <span className="text-sm text-gray-500">
                                SKU: {adjustment.product.sku}
                              </span>
                            )}
                            <Badge className={badge.color}>
                              {badge.label}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Package className="h-3 w-3" />
                              <span>
                                Stock: {adjustment.product?.stockCached || 0} → {(adjustment.product?.stockCached || 0) + (adjustment.qty || 0)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <User className="h-3 w-3" />
                              <span>Par {adjustment.actor?.name || 'Utilisateur inconnu'}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{adjustment.createdAt ? formatDateTime(adjustment.createdAt) : 'Date inconnue'}</span>
                            </div>
                          </div>
                          {adjustment.note && (
                            <p className="mt-1 text-sm text-gray-600">
                              Note: {adjustment.note}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${(adjustment.qty || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatQuantity(adjustment.qty || 0)}
                        </div>
                        <div className="text-xs text-gray-500">unités</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
