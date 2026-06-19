import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
// 🌟 Ahora sí lo usamos acá abajo:
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
    // 🎛️ PROVEEDOR 1: GOOGLE
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // 🎛️ PROVEEDOR 2: CREDENCIALES TRADICIONALES
CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      // 🌟 Tipamos explícitamente que devuelve un Promise<any> o Promise<User | null>
      async authorize(credentials): Promise<any> {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email y contraseña requeridos')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
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

        // 🌟 RETORNAMOS CON AS ANY para apagar la alerta de tipado de NextAuth.
        // Esto le pasa el objeto completo a tu callback session() intacto.
        return user as any
      },
    }),
  ],
  callbacks: {
    // Interceptamos antes de crear el usuario de Google para inyectar su Tenant
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email ?? '' },
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
        }
      }
      return true
    },

    // Seteamos la sesión para el frontend
    async session({ session, user }) {
      if (session.user) {
        ;(session.user as any).id = user.id
        ;(session.user as any).role = (user as any).role
        ;(session.user as any).tenantId = (user as any).tenantId
        ;(session.user as any).plan = (user as any).plan
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'database', // Al usar PrismaAdapter, NextAuth prefiere guardar las sesiones en tu tabla Session
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }