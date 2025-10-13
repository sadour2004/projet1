import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Unauthorized | Inventory Management',
  description: 'You do not have permission to access this page',
}

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 text-center">
        <div>
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Access Denied
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            You don&apos;t have permission to access this page.
          </p>
        </div>

        <div className="space-y-4">
          <Button asChild>
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>

          <div>
            <Button variant="outline" asChild>
              <Link href="/auth/signin">Sign In with Different Account</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
