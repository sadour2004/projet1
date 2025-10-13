'use client'

import { useEffect, useState } from 'react'

interface PerformanceMetrics {
  pageLoadTime: number
  apiResponseTime?: number
  renderTime: number
  memoryUsage?: number
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return

    // Monitor page load performance
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()

      entries.forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming
          setMetrics(
            (prev) =>
              ({
                ...prev,
                pageLoadTime: navEntry.loadEventEnd - navEntry.fetchStart,
                renderTime:
                  navEntry.domContentLoadedEventEnd - navEntry.fetchStart,
              }) as PerformanceMetrics
          )
        }
      })
    })

    observer.observe({ entryTypes: ['navigation'] })

    // Monitor memory usage (if available)
    if ('memory' in performance) {
      const memory = (performance as any).memory
      setMetrics(
        (prev) =>
          ({
            ...prev,
            memoryUsage: memory.usedJSHeapSize / 1024 / 1024, // MB
          }) as PerformanceMetrics
      )
    }

    return () => observer.disconnect()
  }, [])

  // API response time monitoring
  useEffect(() => {
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const start = performance.now()
      const response = await originalFetch(...args)
      const end = performance.now()

      setMetrics(
        (prev) =>
          ({
            ...prev,
            apiResponseTime: end - start,
          }) as PerformanceMetrics
      )

      return response
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [])

  if (process.env.NODE_ENV !== 'development' || !metrics) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-lg transition-colors hover:bg-blue-700"
      >
        Performance
      </button>

      {isVisible && (
        <div className="absolute bottom-12 right-0 w-64 rounded-lg border border-gray-200 bg-white p-4 shadow-xl">
          <h3 className="mb-3 font-semibold text-gray-900">
            Performance Metrics
          </h3>

          <div className="space-y-2 text-sm">
            {metrics.pageLoadTime && (
              <div className="flex justify-between">
                <span className="text-gray-600">Page Load:</span>
                <span
                  className={`font-medium ${
                    metrics.pageLoadTime < 1000
                      ? 'text-green-600'
                      : metrics.pageLoadTime < 3000
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  }`}
                >
                  {metrics.pageLoadTime.toFixed(0)}ms
                </span>
              </div>
            )}

            {metrics.apiResponseTime && (
              <div className="flex justify-between">
                <span className="text-gray-600">API Response:</span>
                <span
                  className={`font-medium ${
                    metrics.apiResponseTime < 200
                      ? 'text-green-600'
                      : metrics.apiResponseTime < 500
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  }`}
                >
                  {metrics.apiResponseTime.toFixed(0)}ms
                </span>
              </div>
            )}

            {metrics.renderTime && (
              <div className="flex justify-between">
                <span className="text-gray-600">Render Time:</span>
                <span
                  className={`font-medium ${
                    metrics.renderTime < 500
                      ? 'text-green-600'
                      : metrics.renderTime < 1500
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  }`}
                >
                  {metrics.renderTime.toFixed(0)}ms
                </span>
              </div>
            )}

            {metrics.memoryUsage && metrics.memoryUsage > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Memory:</span>
                <span
                  className={`font-medium ${
                    metrics.memoryUsage < 50
                      ? 'text-green-600'
                      : metrics.memoryUsage < 100
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  }`}
                >
                  {metrics.memoryUsage.toFixed(1)}MB
                </span>
              </div>
            )}
          </div>

          <div className="mt-3 border-t border-gray-200 pt-3">
            <p className="text-xs text-gray-500">
              🚀 Optimizations Applied:
              <br />• Code Splitting
              <br />• React.memo
              <br />• API Caching
              <br />• DB Indexes
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
