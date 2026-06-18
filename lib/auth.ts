// lib/auth.ts
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import NextAuth, { type NextAuthOptions, type Session } from 'next-auth'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import { isTrialExpired } from './plan'

type AuthUser = {
  id: string
  email: string
  name: string | null
  tenantId: string
  role: string
  tenantActive: boolean
  trialEndsAt: string | null
  plan: string // 👈 1. Agregamos el tipo acá
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<AuthUser | null> {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            tenant: {
              select: { active: true, plan: true, trialEndsAt: true },
            },
          },
        })

        if (!user || !user.password) return null

        const match = await bcrypt.compare(credentials.password, user.password)
        if (!match) return null

        // Bloquear si el usuario está inactivo
        if (!user.active) return null

        // Owners del sistema (plan business) siempre pueden entrar
        const isSystemOwner = user.role === 'owner' && user.tenant?.plan === 'business'

        if (!isSystemOwner) {
          // Bloquear si el tenant está inactivo
          if (!user.tenant?.active) return null

          // Bloquear si el trial venció
          if (isTrialExpired(user.tenant?.plan, user.tenant?.trialEndsAt)) return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? null,
          tenantId: user.tenantId,
          role: user.role,
          tenantActive: user.tenant?.active ?? false,
          trialEndsAt: user.tenant?.trialEndsAt
            ? user.tenant.trialEndsAt.toISOString()
            : null,
          plan: user.tenant?.plan || 'starter', // 👈 2. Lo inyectamos en el objeto que retorna el login
        }
      },
    }),
  ],
  callbacks: {
    async jwt(params) {
      const token = params.token as any
      const user = params.user as Partial<AuthUser> | undefined
      if (user) {
        token.tenantId = user.tenantId
        token.role = user.role
        token.id = token.sub ?? user.id
        token.tenantActive = user.tenantActive
        token.trialEndsAt = user.trialEndsAt
        token.plan = user.plan // 👈 3. Lo metemos en el JWT
      }
      return token
    },
    async session(params) {
      const session = params.session as Session
      const token = params.token as any
      if (session.user) {
        ;(session.user as any).tenantId = token.tenantId
        ;(session.user as any).role = token.role
        ;(session.user as any).id = token.id
        ;(session.user as any).tenantActive = token.tenantActive
        ;(session.user as any).trialEndsAt = token.trialEndsAt
        ;(session.user as any).plan = token.plan // 👈 4. Lo exponemos en la sesión final del cliente
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || 'dev-secret',
}

export default NextAuth(authOptions)