import { Metadata } from 'next'
import { SignInForm } from '@/components/auth/signin-form'
import { getCurrentUser } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Sign In | Inventory Management',
  description: 'Sign in to your inventory management account',
}

export default async function SignInPage() {
  const user = await getCurrentUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="rounded-2xl border border-white/20 bg-white/80 p-8 shadow-xl backdrop-blur-sm">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
              <svg
                className="h-8 w-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <h2 className="mb-2 text-3xl font-bold text-gray-900">Connexion</h2>
            <p className="text-gray-600">
              Accédez à votre système de gestion d&apos;inventaire
            </p>
          </div>
          <SignInForm />
        </div>
      </div>
    </div>
  )
}
