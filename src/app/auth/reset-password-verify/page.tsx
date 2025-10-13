import { Metadata } from 'next'
import { ResetPasswordVerifyForm } from '@/components/auth/reset-password-verify-form'
import { getCurrentUser } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Vérification et réinitialisation | Gestion d\'inventaire',
  description: 'Vérifiez votre identité et réinitialisez votre mot de passe',
}

export default async function ResetPasswordVerifyPage() {
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="mb-2 text-3xl font-bold text-gray-900">Vérification et réinitialisation</h2>
            <p className="text-gray-600">
              Vérifiez votre identité pour réinitialiser votre mot de passe
            </p>
          </div>
          <ResetPasswordVerifyForm />
        </div>
      </div>
    </div>
  )
}
