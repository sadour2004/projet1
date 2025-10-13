'use client'

import { ReactNode, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Package,
  BarChart3,
  ShoppingCart,
  Users,
  Settings,
  Menu,
  X,
  Home,
  TrendingUp,
  LogOut,
  ChevronRight,
} from 'lucide-react'

interface ProfessionalOwnerLayoutProps {
  children: ReactNode
}

const navigation = [
  {
    name: 'Tableau de Bord',
    href: '/owner/dashboard',
    icon: Home,
    description: 'Toutes les fonctionnalités en un seul endroit',
  },
  {
    name: 'Produits & Catégories',
    href: '/owner/products',
    icon: Package,
    description: 'Gestion des produits',
    children: [
      { name: 'Tous les Produits', href: '/owner/products' },
      { name: 'Catégories', href: '/owner/categories' },
    ],
  },
  {
    name: 'Analyses & Rapports',
    href: '/owner/dashboard',
    icon: BarChart3,
    description: 'Statistiques et performances',
  },
  {
    name: 'Opérations Stock',
    href: '/owner/movements',
    icon: ShoppingCart,
    description: "Mouvements d'inventaire",
    children: [
      { name: 'Mouvements', href: '/owner/movements' },
      { name: 'Ajustements', href: '/owner/stock-adjustments' },
    ],
  },
  {
    name: 'Personnel',
    href: '/owner/personnel',
    icon: Users,
    description: 'Gestion du personnel',
  },
  {
    name: 'Paramètres',
    href: '/owner/settings',
    icon: Settings,
    description: 'Configuration système',
  },
]

export function ProfessionalOwnerLayout({
  children,
}: ProfessionalOwnerLayoutProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' })
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 flex-shrink-0 transform bg-white shadow-xl transition-transform duration-300 ease-in-out lg:static lg:inset-0 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-6">
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-blue-700">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Inventory</h1>
              <p className="text-xs text-gray-500">Management</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive =
              pathname === item.href ||
              (item.children &&
                item.children.some((child) => pathname === child.href))

            return (
              <div key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-r-2 border-blue-600 bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{item.name}</div>
                    <div className="truncate text-xs text-gray-500">
                      {item.description}
                    </div>
                  </div>
                  {item.children && (
                    <ChevronRight className="h-4 w-4 flex-shrink-0" />
                  )}
                </Link>

                {/* Sub-navigation */}
                {item.children && isActive && (
                  <div className="ml-6 mt-2 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.name}
                        href={child.href}
                        className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                          pathname === child.href
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-gray-200 p-4">
          <div className="mb-3 flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-blue-600">
              <span className="text-sm font-medium text-white">
                {session?.user?.name?.charAt(0) || 'O'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-gray-900">
                {session?.user?.name || 'Propriétaire'}
              </div>
              <div className="truncate text-xs text-gray-500">
                {session?.user?.email || 'owner@inventory.com'}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              <Users className="mr-1 h-3 w-3" />
              Propriétaire
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-gray-500 hover:text-gray-700"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col lg:ml-0">
        {/* Top header */}
        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white shadow-sm">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="ml-4 lg:ml-0">
                <h2 className="text-xl font-semibold text-gray-900">
                  {navigation.find(
                    (item) =>
                      item.href === pathname ||
                      (item.children &&
                        item.children.some((child) => child.href === pathname))
                  )?.name || 'Tableau de Bord'}
                </h2>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden items-center space-x-3 sm:flex">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {session?.user?.name || 'Propriétaire'}
                  </div>
                  <div className="text-xs text-gray-500">Propriétaire</div>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-blue-600">
                  <span className="text-sm font-medium text-white">
                    {session?.user?.name?.charAt(0) || 'O'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
