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
              plan: 'starter',
              maxUsers: resolveMaxUsers('starter'),
              trialEndsAt: resolveTrialEndsAt('starter'),
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
        ;(user as any).plan = newUser.tenant?.plan ?? 'starter'
        user.email = emailNormalizado

        return true
      }

      // ══════════════════════════════════════════════════════════════════════
      // ESCENARIO B: USUARIO YA EXISTE
      // ══════════════════════════════════════════════════════════════════════

      // Si no tiene cuenta Google vinculada aún, la creamos nosotros
      const existingAccount = await prisma.account.findFirst({
        where: { userId: existingUser.id, provider: 'google' },
      })

      if (!existingAccount && account) {
        await prisma.account.create({
          data: {
            userId: existingUser.id,
            type: account.type,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            refresh_token: account.refresh_token ?? null,
            access_token: account.access_token ?? null,
            expires_at: account.expires_at ?? null,
            token_type: account.token_type ?? null,
            scope: account.scope ?? null,
            id_token: account.id_token ?? null,
          },
        })
      }

      // Si el usuario existente NO tiene tenant (caso raro de DB corrupta), bloqueamos
      if (!existingUser.tenantId) {
        console.error(`[auth] Usuario ${existingUser.id} sin tenantId — bloqueando login`)
        return `/auth/login?error=NoTenant`
      }

      // Propagamos datos reales al jwt callback
      user.id = existingUser.id
      ;(user as any).role = existingUser.role
      ;(user as any).tenantId = existingUser.tenantId
      ;(user as any).plan = existingUser.tenant?.plan ?? 'free'
      user.email = emailNormalizado

      return true
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.tenantId = (user as any).tenantId
        token.plan = (user as any).plan ?? 'free'
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