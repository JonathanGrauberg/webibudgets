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
      allowDangerousEmailAccountLinking: true, 
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

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
          plan: user.tenant?.plan ?? 'free'
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const emailNormalizado = (user.email ?? '').toLowerCase().trim()

        const existingUser = await prisma.user.findUnique({
          where: { email: emailNormalizado },
          include: { tenant: true }
        })

        if (!existingUser) {
          // ESCENARIO A: Usuario 100% nuevo de Google
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

          // 🌟 ASIGNACIÓN ESTRICTA: Solo inyectamos lo que Prisma SÍ tiene mapeado en su tabla User.
          // El 'plan' NO se toca acá para que el adapter no explote.
          user.tenantId = newTenant.id
          ;(user as any).role = 'admin'
        } else {
          // ESCENARIO B: El usuario ya existía por credenciales manuales
          const existingAccount = await prisma.account.findFirst({
            where: {
              userId: existingUser.id,
              provider: 'google',
            },
          })

          if (!existingAccount && account) {
            await prisma.account.create({
              data: {
                userId: existingUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refresh_token: account.refresh_token,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
              },
            })
          }

          user.id = existingUser.id
          user.tenantId = existingUser.tenantId
          ;(user as any).role = existingUser.role
        }
      }
      return true
    },

    async jwt({ token, user }) {
      // Si el login acaba de suceder, NextAuth nos da el objeto user
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.tenantId = (user as any).tenantId
        
        // Si vino de Credenciales, ya trae el plan armado.
        if ((user as any).plan) {
          token.plan = (user as any).plan
        }
      } 
      
      // 🌟 SOLUCIÓN REAL: Buscamos el plan del Tenant de manera segura para la sesión del JWT.
      // Esto corre fuera del alcance del PrismaAdapter y jamás romperá la base de datos.
      if (token.email && !token.plan) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email.toLowerCase().trim() },
          include: { tenant: true }
        })
        if (dbUser) {
          token.id = dbUser.id
          token.role = dbUser.role
          token.tenantId = dbUser.tenantId
          token.plan = dbUser.tenant?.plan ?? 'starter'
        }
      }
      return token
    },

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
    error: '/auth/login', 
  },
  session: {
    strategy: 'jwt',
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }