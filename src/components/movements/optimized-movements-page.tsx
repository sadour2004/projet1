'use client'

import { useState, useEffect } from 'react'
import { OptimizedMovementsHeader } from './optimized-movements-header'
import { OptimizedMovementsTable } from './optimized-movements-table'
import { MovementType } from '@/types/movement'

interface Movement {
  id: string
  productId: string
  type: MovementType
  qty: number
  unitPriceCents?: number
  note?: string
  actorId?: string
  createdAt: string
  product: {
    id: string
    name: string
    slug: string
    priceCents: number
    stockCached: number
    images: Array<{
      id: string
      url: string
      alt?: string
    }>
  }
  actor: {
    id: string
    name?: string | null
    email: string
  } | null
}

interface TodayStats {
  totalMovements: number
  sales: number
  returns: number
}

interface OptimizedMovementsPageProps {
  searchParams?: any
}

export function OptimizedMovementsPage({ searchParams }: OptimizedMovementsPageProps) {
  const [movements, setMovements] = useState<Movement[]>([])
  const [todayStats, setTodayStats] = useState<TodayStats>({
    totalMovements: 0,
    sales: 0,
    returns: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedType, setSelectedType] = useState('')

  // Function to convert date to ISO range
  const dateToISO = (dateString: string) => {
    if (!dateString) return { startDate: '', endDate: '' }
    
    const startDate = new Date(dateString + 'T00:00:00.000Z').toISOString()
    const endDate = new Date(dateString + 'T23:59:59.999Z').toISOString()
    
    return { startDate, endDate }
  }

  // Function to fetch movements
  const fetchMovements = async (filterDate?: string, filterType?: string) => {
    try {
      setIsLoading(true)
      setError('')

      let url = '/api/movements?limit=100'
      
      if (filterDate) {
        const { startDate, endDate } = dateToISO(filterDate)
        url += `&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
      }
      
      if (filterType && filterType !== 'ALL') {
        url += `&type=${encodeURIComponent(filterType)}`
      }

      const response = await fetch(url)

      if (response.ok) {
        const data = await response.json()
        const movementsData = data.movements || []
        
        setMovements(movementsData)
        
        // Calculate stats
        const totalMovements = movementsData.length
        const sales = movementsData.filter((m: any) => m.type === 'SALE_OFFLINE').length
        const returns = movementsData.filter((m: any) => m.type === 'RETURN').length
        
        setTodayStats({
          totalMovements,
          sales,
          returns,
        })
        
      } else {
        throw new Error('Failed to fetch movements')
      }
    } catch (err) {
      console.error('Error fetching movements:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch movements')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle date filter change
  const handleDateFilter = (date: string) => {
    setSelectedDate(date)
    fetchMovements(date, selectedType)
  }

  // Handle type filter change
  const handleTypeFilter = (type: string) => {
    setSelectedType(type)
    fetchMovements(selectedDate, type)
  }

  // Load movements on component mount
  useEffect(() => {
    fetchMovements()
  }, [])

  if (error) {
    return (
      <div className="py-8 text-center">
        <div className="mb-4 text-red-600">
          <h3 className="text-lg font-semibold">Erreur de chargement</h3>
          <p className="text-sm">{error}</p>
        </div>
        <button 
          onClick={() => fetchMovements()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <>
      <OptimizedMovementsHeader 
        todayStats={todayStats} 
        isLoading={isLoading}
      />
      
      <div className="mt-8">
        <OptimizedMovementsTable 
          movements={movements}
          isLoading={isLoading}
          onDateFilter={handleDateFilter}
          onTypeFilter={handleTypeFilter}
        />
      </div>
    </>
  )
}