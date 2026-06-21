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
        // 🔒 Normalización total para evitar duplicados por minúsculas/mayúsculas o espacios
        const emailNormalizado = (user.email ?? '').trim().toLowerCase()

        if (!emailNormalizado) {
          throw new Error('El proveedor de Google no devolvió un email válido.')
        }

        // Buscamos si ya existe el usuario por su email único
        const existingUser = await prisma.user.findFirst({
          where: { 
            email: {
              equals: emailNormalizado,
              mode: 'insensitive' // Hace que Prisma ignore mayúsculas/minúsculas de forma nativa
            }
          },
          include: { tenant: true }
        })

        if (!existingUser) {
          // =================================================================
          // ESCENARIO A: El usuario es 100% NUEVO en el sistema
          // =================================================================
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

          // Asignamos los campos requeridos por tu modelo User para el nuevo registro
          user.tenantId = newTenant.id
          ;(user as any).role = 'admin'
          user.email = emailNormalizado // Aseguramos que NextAuth guarde el mail limpio
        } else {
          // =================================================================
          // ESCENARIO B: El usuario YA EXISTE (No creamos ningún Tenant nuevo)
          // =================================================================
          
          // Verificamos si este usuario ya tiene enlazada esta cuenta de Google
          const existingAccount = await prisma.account.findFirst({
            where: {
              userId: existingUser.id,
              provider: 'google',
            },
          })

          // Si no la tiene vinculada (porque se registró vía Credenciales antes), la enlazamos en caliente
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

          // 🌟 CRÍTICO: Pisamos los datos en memoria de NextAuth con los del usuario real de la DB.
          // Esto evita que el adaptador intente generar un usuario duplicado.
          user.id = existingUser.id
          user.tenantId = existingUser.tenantId
          user.email = existingUser.email
          user.name = existingUser.name
          ;(user as any).role = existingUser.role
        }
      }
      return true
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.tenantId = (user as any).tenantId
        
        if ((user as any).plan) {
          token.plan = (user as any).plan
        }
      } 
      
      // Busqueda reactiva del plan usando el email limpio del token
      if (token.email && !token.plan) {
        const dbUser = await prisma.user.findFirst({
          where: { 
            email: {
              equals: token.email.trim().toLowerCase(),
              mode: 'insensitive'
            }
          },
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