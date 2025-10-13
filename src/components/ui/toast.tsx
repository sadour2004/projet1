'use client'

import { useEffect } from 'react'
import { AlertCircle, CheckCircle, X } from 'lucide-react'
import { Button } from './button'

interface ToastProps {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'destructive'
  onDismiss: (id: string) => void
}

export function Toast({ id, title, description, variant = 'default', onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(id)
    }, 5000)

    return () => clearTimeout(timer)
  }, [id, onDismiss])

  const isDestructive = variant === 'destructive'

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm w-full bg-white border rounded-lg shadow-lg animate-in slide-in-from-right-full ${
      isDestructive ? 'border-red-200' : 'border-green-200'
    }`}>
      <div className="flex items-start p-4">
        <div className={`flex-shrink-0 ${
          isDestructive ? 'text-red-600' : 'text-green-600'
        }`}>
          {isDestructive ? (
            <AlertCircle className="h-5 w-5" />
          ) : (
            <CheckCircle className="h-5 w-5" />
          )}
        </div>
        
        <div className="ml-3 flex-1">
          <h4 className={`text-sm font-medium ${
            isDestructive ? 'text-red-900' : 'text-green-900'
          }`}>
            {title}
          </h4>
          {description && (
            <p className={`mt-1 text-sm ${
              isDestructive ? 'text-red-700' : 'text-green-700'
            }`}>
              {description}
            </p>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDismiss(id)}
          className={`ml-2 p-1 h-auto ${
            isDestructive ? 'text-red-400 hover:text-red-600' : 'text-green-400 hover:text-green-600'
          }`}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

interface ToastContainerProps {
  toasts: Array<{
    id: string
    title: string
    description?: string
    variant?: 'default' | 'destructive'
  }>
  onDismiss: (id: string) => void
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  )
}
