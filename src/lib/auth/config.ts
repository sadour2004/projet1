import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import * as argon2 from 'argon2'
import { z } from 'zod'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { env } from '@/lib/env'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

// Helper function to safely initialize Prisma adapter
const createPrismaAdapter = () => {
  try {
    // Only use Prisma adapter if DATABASE_URL is properly configured
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL === 'file:./prisma/dev.db') {
      logger.warn('Skipping Prisma adapter - DATABASE_URL not configured for production')
      return undefined
    }
    return PrismaAdapter(db)
  } catch (error) {
    logger.error('Failed to initialize Prisma adapter', { error })
    return undefined
  }
}

// Helper function to filter providers based on environment variables
const createProviders = () => {
  const providers = []

  // Always include Credentials provider as it doesn't require external env vars
  providers.push(
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const { email, password } = loginSchema.parse(credentials)

          const user = await db.user.findUnique({
            where: { email },
          })

          if (!user) {
            logger.warn('Login attempt with non-existent email', { email })
            return null
          }

          if (!user.isActive) {
            logger.warn('Login attempt with inactive user', {
              userId: user.id,
              email: user.email,
            })
            return null
          }

          const isValidPassword = await argon2.verify(user.password, password)

          if (!isValidPassword) {
            logger.warn('Login attempt with invalid password', {
              userId: user.id,
              email: user.email,
            })
            return null
          }

          // Update last login time
          await db.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          })

          logger.info('Successful login', {
            userId: user.id,
            email: user.email,
            role: user.role,
          })

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role as 'OWNER' | 'STAFF',
          }
        } catch (error) {
          logger.error('Login error', { error })
          return null
        }
      },
    })
  )

  // Add Google OAuth provider only if required environment variables are present
  // Required: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    const GoogleProvider = require('next-auth/providers/google').default
    providers.push(
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      })
    )
    logger.info('Google OAuth provider initialized')
  } else {
    logger.info('Google OAuth provider skipped - missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET')
  }

  // Add GitHub OAuth provider only if required environment variables are present
  // Required: GITHUB_ID, GITHUB_SECRET
  if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
    const GitHubProvider = require('next-auth/providers/github').default
    providers.push(
      GitHubProvider({
        clientId: process.env.GITHUB_ID,
        clientSecret: process.env.GITHUB_SECRET,
      })
    )
    logger.info('GitHub OAuth provider initialized')
  } else {
    logger.info('GitHub OAuth provider skipped - missing GITHUB_ID or GITHUB_SECRET')
  }

  return providers
}

export const authOptions: NextAuthOptions = {
  // Only use Prisma adapter if it initializes successfully
  adapter: createPrismaAdapter(),
  providers: createProviders(),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  debug: process.env.NODE_ENV === 'development',
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      logger.info('User signed in', {
        userId: user.id,
        email: user.email,
        provider: account?.provider,
        isNewUser,
      })
    },
    async signOut({ session, token }) {
      logger.info('User signed out', {
        userId: session?.user?.id || token?.sub,
        email: session?.user?.email,
      })
    },
    async createUser({ user }) {
      logger.info('New user created', {
        userId: user.id,
        email: user.email,
      })
    },
  },
  logger: {
    error(code, metadata) {
      logger.error('NextAuth error', { code, metadata })
    },
    warn(code) {
      logger.warn('NextAuth warning', { code })
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV === 'development') {
        logger.debug('NextAuth debug', { code, metadata })
      }
    },
  },
}
