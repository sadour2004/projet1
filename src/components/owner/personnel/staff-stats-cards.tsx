'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  UserCheck,
  UserPlus,
  Shield,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'

interface StaffStats {
  total: number
  active: number
  recent: number
  owner: number
  staff: number
}

interface StaffStatsCardsProps {
  stats: StaffStats
  isLoading: boolean
}

export function StaffStatsCards({ stats, isLoading }: StaffStatsCardsProps) {
  const cards = [
    {
      title: 'Total Personnel',
      value: stats.total,
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      description: 'Utilisateurs enregistrés',
    },
    {
      title: 'Employés Actifs',
      value: stats.active,
      icon: UserCheck,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      description: 'Comptes activés',
    },
    {
      title: 'Nouveaux (7j)',
      value: stats.recent,
      icon: UserPlus,
      color: 'bg-amber-500',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
      description: 'Ajoutés cette semaine',
    },
    {
      title: 'Employés',
      value: stats.staff,
      icon: Users,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700',
      description: 'Personnel de vente',
    },
  ]

  if (isLoading) {
    return (
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="mr-4 h-12 w-12 rounded-lg bg-gray-200"></div>
                <div className="flex-1">
                  <div className="mb-2 h-4 rounded bg-gray-200"></div>
                  <div className="h-6 w-16 rounded bg-gray-200"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.title} className="transition-shadow hover:shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div
                  className={`h-12 w-12 ${card.bgColor} mr-4 flex items-center justify-center rounded-lg`}
                >
                  <Icon
                    className={`h-6 w-6 ${card.color.replace('bg-', 'text-')}`}
                  />
                </div>
                <div className="flex-1">
                  <p className="mb-1 text-sm font-medium text-gray-600">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total === 0 && card.title === 'Total Personnel'
                      ? '0'
                      : card.value}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {card.description}
                  </p>
                </div>
              </div>

              {/* Special indicators */}
              {card.title === 'Employés Actifs' && stats.total > 0 && (
                <div className="mt-3 flex items-center">
                  <div className="h-2 flex-1 rounded-full bg-gray-200">
                    <div
                      className="h-2 rounded-full bg-green-500 transition-all duration-300"
                      style={{
                        width: `${(stats.active / stats.total) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <span className="ml-2 text-xs text-gray-600">
                    {Math.round((stats.active / stats.total) * 100)}%
                  </span>
                </div>
              )}

              {card.title === 'Nouveaux (7j)' && stats.recent > 0 && (
                <div className="mt-3">
                  <Badge
                    variant="secondary"
                    className="bg-amber-100 text-amber-800"
                  >
                    <TrendingUp className="mr-1 h-3 w-3" />+{stats.recent}
                  </Badge>
                </div>
              )}

              {card.title === 'Total Personnel' && stats.total === 0 && (
                <div className="mt-3">
                  <Badge
                    variant="outline"
                    className="border-amber-200 text-amber-700"
                  >
                    <AlertCircle className="mr-1 h-3 w-3" />
                    Aucun personnel
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
