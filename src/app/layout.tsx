import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { TranslationProvider } from '@/contexts/translation-context'
import { PerformanceMonitor } from '@/components/ui/performance-monitor'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Inventory Management System',
  description:
    'A secure inventory management system with role-based access control',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <TranslationProvider>
          <Providers>
            {children}
            <PerformanceMonitor />
          </Providers>
        </TranslationProvider>
      </body>
    </html>
  )
}
