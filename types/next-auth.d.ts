import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface User {
    id: string
    email: string
    name: string | null
    role: string
    tenantId: string
  }

  interface Session {
    user: {
      id: string
      email: string
      name: string | null
      role: string
      tenantId: string
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
  }
}
