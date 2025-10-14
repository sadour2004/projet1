import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/helpers'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Système de Gestion de Stock',
  description: 'Gérez votre inventaire efficacement avec notre système moderne',
}

export default async function HomePage() {
  const user = await getCurrentUser()

  if (user) {
    // Redirect authenticated users to their appropriate dashboard
    if (user.role === 'OWNER') {
      redirect('/owner/dashboard')
    } else {
      redirect('/staff/dashboard')
    }
  }

  // Show public landing page for visitors
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Système de Gestion de Stock
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Gérez votre inventaire efficacement avec notre système moderne et intuitif. 
            Suivez vos produits, contrôlez vos stocks et optimisez vos ventes.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <a
              href="/auth/signin"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
            >
              Se connecter
            </a>
            <a
              href="/browse"
              className="bg-white hover:bg-gray-50 text-gray-900 font-semibold py-3 px-8 rounded-lg border border-gray-300 transition-colors"
            >
              Parcourir les produits
            </a>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-blue-600 text-3xl mb-4">📦</div>
              <h3 className="text-xl font-semibold mb-2">Gestion d'Inventaire</h3>
              <p className="text-gray-600">
                Suivez vos produits en temps réel avec des mises à jour automatiques.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-blue-600 text-3xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-2">Analytics Avancés</h3>
              <p className="text-gray-600">
                Obtenez des insights précieux sur vos ventes et performances.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-blue-600 text-3xl mb-4">👥</div>
              <h3 className="text-xl font-semibold mb-2">Gestion d'Équipe</h3>
              <p className="text-gray-600">
                Gérez les accès et permissions de votre équipe facilement.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
