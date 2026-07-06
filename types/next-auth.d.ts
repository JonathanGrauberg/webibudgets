// types/next-auth.d.ts
import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface User {
    id: string
    email: string
    name: string | null
    role: string
    tenantId: string
    tenantActive: boolean
    trialEndsAt: string | null
    plan: string // 👈 nuevo
  }

  interface Session {
    user: {
      id: string
      email: string
      name: string | null
      role: string
      tenantId: string
      tenantActive: boolean
      trialEndsAt: string | null
      plan: string // 👈 nuevo
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    sub: string
    email: string
    name: string | null
    role: string
    tenantId: string
    tenantActive: boolean
    trialEndsAt: string | null
    plan: string // 👈 nuevo
  }
}