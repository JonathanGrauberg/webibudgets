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
  }
}