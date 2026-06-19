//app\layout.tsx
import React from "react"
import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'sonner'
import { Inter } from 'next/font/google'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
})


export const metadata: Metadata = {
  title: 'WebiBudgets - Gestión de presupuestos',
  description: 'WebiBudgets: gestión simple de presupuestos y clientes para pymes.',
  generator: 'Webi',
  icons: {
    icon: [
      {
        url: '/favico.ico',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/favico-dark.ico',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/favico.ico',
        type: 'image/svg+xml',
      },
    ],
    apple: '/favico.ico',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${inter.variable}`}>
      <body className={`font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
