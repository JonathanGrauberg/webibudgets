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
  title: '.budgets | Presupuestos, Stock y Gestión para Pymes',
  description:
    'Sistema de gestión para pymes: presupuestos, stock, recibos, remitos, órdenes de trabajo, comisiones y clientes, todo en un solo lugar.',
  generator: 'Webi',

  alternates: {
    canonical: 'https://budgets.webistudio.net',
  },

  robots: {
    index: true,
    follow: true,
  },

  icons: {
    icon: [
      { url: '/favico.ico', media: '(prefers-color-scheme: light)' },
      { url: '/favico.ico', media: '(prefers-color-scheme: dark)' },
      // 👈 si no tenés un .svg real, sacá esta entrada — el type no coincidía con el archivo
    ],
    apple: '/favico.ico',
  },

  verification: {
    google: 'uncQp5acTGHPwkvzaev-cE9qD2F_INbbzjjfrXqvtuc',
  },

  openGraph: {
    title: '.budgets: Presupuestos, Stock y Gestión para tu Pyme',
    description:
      'Presupuestos, stock por variante, órdenes de trabajo y comisiones — todo conectado, sin planillas sueltas.',
    url: 'https://budgets.webistudio.net',
    siteName: '.budgets',
    images: [
      {
        url: 'https://budgets.webistudio.net/og-whatsapp.png',
        width: 300,
        height: 300,
        alt: '.budgets - Logo',
      },
      {
        url: 'https://budgets.webistudio.net/og-image.png',
        width: 1200,
        height: 630,
        alt: '.budgets - Dashboard',
      },
    ],
    locale: 'es_AR',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: '.budgets: Presupuestos, Stock y Gestión para tu Pyme',
    description:
      'Presupuestos, stock por variante, órdenes de trabajo y comisiones — todo conectado, sin planillas sueltas.',
    images: ['https://budgets.webistudio.net/og-image.png'],
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
