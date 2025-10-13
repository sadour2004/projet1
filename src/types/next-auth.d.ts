// Role enum not available in SQLite, using string literals
import 'next-auth'

declare module 'next-auth' {
  interface User {
    role: 'OWNER' | 'STAFF'
  }

  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string
  }
}
