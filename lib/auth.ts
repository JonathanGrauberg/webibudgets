import { PrismaAdapter } from '@next-auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import NextAuth, { type NextAuthOptions, type Session } from 'next-auth'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import type { User as PrismaUser } from '@prisma/client'
import type { JWT } from 'next-auth/jwt'

interface Token extends JWT {
  tenantId?: string
  role?: string
}

type AuthUser = {
  id: string
  email: string
  name: string | null
  tenantId: string
  role: string
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
        })

        if (!user) return null

        if (!user.password) return null

        const match = await bcrypt.compare(credentials.password, user.password)
        if (!match) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? null,
          tenantId: user.tenantId,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt(params) {
      const token = params.token as Token
      const user = params.user as Partial<AuthUser> | undefined
      if (user) {
        token.tenantId = user.tenantId
        token.role = user.role
        token.sub = token.sub ?? user.id
      }
      return token
    },
    async session(params) {
      const session = params.session as Session
      const token = params.token as Token
      if (session.user) {
        ;(session.user as any).tenantId = token.tenantId
        ;(session.user as any).role = token.role
        ;(session.user as any).id = token.sub ?? token?.id
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
