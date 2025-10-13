'use client'

import { useState, useEffect, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Package, Plus, History } from 'lucide-react'
import { AdjustmentForm } from './adjustment-form'
import { SimpleAdjustmentsHistory } from './simple-adjustments-history'

export function OptimizedStockAdjustmentsPage() {
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form')

  const tabs = [
    {
      id: 'form' as const,
      label: 'Nouvel Ajustement',
      icon: Plus,
      description: "Ajuster le stock d'un produit",
      badge: null,
    },
    {
      id: 'history' as const,
      label: 'Historique',
      icon: History,
      description: "Consulter l'historique des ajustements",
      badge: null,
    },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Ajustements de Stock
            </h1>
            <p className="mt-2 text-gray-600">
              Gérez les ajustements d'inventaire et suivez les modifications
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              <Package className="mr-1 h-4 w-4" />
              Inventaire
            </Badge>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white">
        <div className="flex">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-1 items-center justify-center space-x-3 border-b-2 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <Icon className="h-5 w-5" />
                <div className="text-left">
                  <div className="flex items-center space-x-2">
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {tab.badge}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs opacity-75">{tab.description}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'form' && <AdjustmentForm />}
        {activeTab === 'history' && <SimpleAdjustmentsHistory />}
      </div>
    </div>
  )
}
