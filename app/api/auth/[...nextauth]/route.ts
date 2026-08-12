// app/api/auth/[...nextauth]/route.ts
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
        if (!isValid) throw new Error('Credenciales incorrectas')
        if (!user.active) throw new Error('Tu cuenta está desactivada')

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
          plan: user.tenant?.plan ?? 'free',
          trialEndsAt: user.tenant?.trialEndsAt ?? null,
          tenantActive: user.tenant?.active ?? false,
          // isPlatformAdmin: user.isPlatformAdmin ?? false, // 👈 pendiente — activar cuando se agregue el campo a schema.prisma
          isNewAccount: false,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== 'google') return true

      const emailNormalizado = (user.email ?? '').trim().toLowerCase()
      if (!emailNormalizado) {
        throw new Error('El proveedor de Google no devolvió un email válido.')
      }

      // ── Buscar si el usuario ya existe ────────────────────────────────────
      const existingUser = await prisma.user.findFirst({
        where: { email: { equals: emailNormalizado, mode: 'insensitive' } },
        include: { tenant: true },
      })

      if (!existingUser) {
        // ══════════════════════════════════════════════════════════════════
        // ESCENARIO A: USUARIO NUEVO
        // Creamos el tenant Y el user manualmente ANTES de que el adapter
        // tenga oportunidad de crear un user sin tenantId.
        // ══════════════════════════════════════════════════════════════════
        const companyName = `Empresa de ${user.name ?? 'Invitado'}`
        let slug = generateSlug(companyName)

        const slugExists = await prisma.tenant.findUnique({ where: { slug } })
        if (slugExists) slug = `${slug}-${Date.now().toString().slice(-4)}`

        // Transacción: tenant + user en un solo paso atómico
        const newUser = await prisma.$transaction(async (tx) => {
          const newTenant = await tx.tenant.create({
            data: {
              name: companyName,
              slug,
              plan: 'free', // 👈 antes: 'starter' — Free es el plan real de alta gratuita hoy
              maxUsers: resolveMaxUsers('free'),
              trialEndsAt: resolveTrialEndsAt('free'),
              active: true,
              primaryColor: '#0F172A',
              secondaryColor: '#334155',
              accentColor: '#F59E0B',
            },
          })

          return tx.user.create({
            data: {
              // El id lo generamos nosotros para que el adapter no lo duplique.
              // El adapter buscará por email y encontrará este user ya creado.
              name: user.name ?? 'Sin nombre',
              email: emailNormalizado,
              emailVerified: new Date(), // Google ya verificó el email
              image: user.image ?? null,
              role: 'admin',
              tenantId: newTenant.id,
              active: true,
            },
            include: { tenant: true },
          })
        })

        // Propagamos los datos al objeto `user` para que lleguen al jwt callback.
        // En este escenario el adapter verá que el User ya existe (por email)
        // y solo creará el Account (vínculo con Google). No duplicará el User.
        user.id = newUser.id
        ;(user as any).role = newUser.role
        ;(user as any).tenantId = newUser.tenantId
        ;(user as any).plan = newUser.tenant?.plan ?? 'free' // 👈 antes: 'starter'
        ;(user as any).tenantActive = newUser.tenant?.active ?? true
        ;(user as any).isPlatformAdmin = (newUser as any).isPlatformAdmin ?? false // 👈 nuevo
        ;(user as any).isNewAccount = true // 👈 nuevo — recién creado ahora mismo
        user.email = emailNormalizado

        return true
      }

      // ══════════════════════════════════════════════════════════════════════
      // ESCENARIO B: USUARIO YA EXISTE
      // ══════════════════════════════════════════════════════════════════════

      const existingAccount = await prisma.account.findFirst({
        where: { userId: existingUser.id, provider: 'google' },
      })

      if (!existingAccount) {
        // ── B2: Existe pero se registró con contraseña ──────────────────────
        // NO creamos la Account acá: si retornáramos true el PrismaAdapter
        // la crearía también y exploataría con Unique constraint duplicada.
        // Cortamos el flujo y mandamos al login con mensaje claro.
        return `/auth/login?error=AccountExists`
      }

      // ── B1: Existe y ya tiene Google vinculado → login normal ─────────────
      if (!existingUser.tenantId) {
        console.error(`[auth] Usuario ${existingUser.id} sin tenantId — bloqueando login`)
        return `/auth/login?error=NoTenant`
      }

      // Propagamos datos reales al jwt callback
      user.id = existingUser.id
      ;(user as any).role = existingUser.role
      ;(user as any).tenantId = existingUser.tenantId
      ;(user as any).plan = existingUser.tenant?.plan ?? 'free'
      ;(user as any).tenantActive = existingUser.tenant?.active ?? false // 👈 nuevo — antes no se seteaba, caía en el "?? true" del jwt callback
      ;(user as any).isPlatformAdmin = (existingUser as any).isPlatformAdmin ?? false // 👈 nuevo
      ;(user as any).isNewAccount = false // 👈 nuevo — login de retorno, no alta nueva
      user.email = emailNormalizado

      return true
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.tenantId = (user as any).tenantId
        token.plan = (user as any).plan ?? 'free'
        token.trialEndsAt = (user as any).trialEndsAt ?? null
        token.tenantActive = (user as any).tenantActive ?? true
        token.isPlatformAdmin = (user as any).isPlatformAdmin ?? false // 👈 nuevo
        token.isNewAccount = (user as any).isNewAccount ?? false // 👈 nuevo
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).id = token.id
        ;(session.user as any).role = token.role
        ;(session.user as any).tenantId = token.tenantId
        ;(session.user as any).plan = token.plan
        ;(session.user as any).trialEndsAt = token.trialEndsAt ?? null
        ;(session.user as any).tenantActive = token.tenantActive
        ;(session.user as any).isPlatformAdmin = token.isPlatformAdmin ?? false // 👈 nuevo
        ;(session.user as any).isNewAccount = token.isNewAccount ?? false // 👈 nuevo
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