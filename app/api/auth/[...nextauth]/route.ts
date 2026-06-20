// app\api\auth\[...nextauth]\route.ts
import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials' 
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import { resolveMaxUsers, resolveTrialEndsAt } from '@/lib/plan'
import bcrypt from 'bcryptjs'

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<any> {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email y contraseña requeridos')
        }

        // 🌟 Agregamos el include para traer el plan del tenant real en base de datos
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
          include: { tenant: true },
        })

        if (!user || !user.password) {
          throw new Error('Credenciales incorrectas')
        }

        const isValid = await bcrypt.compare(credentials.password, user.password)

        if (!isValid) {
          throw new Error('Credenciales incorrectas')
        }

        if (!user.active) {
          throw new Error('Tu cuenta está desactivada')
        }

        // Inyectamos el plan del Tenant para que viaje al callback JWT
        return {
          ...user,
          plan: user.tenant?.plan ?? 'free'
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email ?? '' },
          include: { tenant: true } // Mantenemos consistencia con el esquema
        })

        if (!existingUser) {
          const companyName = `Empresa de ${user.name ?? 'Invitado'}`
          let slug = generateSlug(companyName)
          
          const existingTenant = await prisma.tenant.findUnique({ where: { slug } })
          if (existingTenant) {
            slug = `${slug}-${Date.now().toString().slice(-4)}`
          }

          const newTenant = await prisma.tenant.create({
            data: {
              name: companyName,
              slug,
              plan: 'starter',
              maxUsers: resolveMaxUsers('starter'),
              trialEndsAt: resolveTrialEndsAt('starter'),
              active: true,
              primaryColor: '#0F172A',
              secondaryColor: '#334155',
              accentColor: '#F59E0B',
            },
          })

          user.tenantId = newTenant.id
          ;(user as any).role = 'admin'
          ;(user as any).plan = newTenant.plan
        } else {
          // Si ya existe de antes por Google, aseguramos su plan actual en la sesión
          ;(user as any).plan = existingUser.tenant?.plan ?? 'free'
        }
      }
      return true
    },
    // 🌟 Mapeamos los datos customizados al Token JWT
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.tenantId = (user as any).tenantId
        token.plan = (user as any).plan
      }
      return token
    },
    // 🌟 Pasamos los datos del Token JWT a la Sesión del cliente
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).id = token.id
        ;(session.user as any).role = token.role
        ;(session.user as any).tenantId = token.tenantId
        ;(session.user as any).plan = token.plan
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
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }