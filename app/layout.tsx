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
  title: '.budgets - Gestión de presupuestos',
  description: '.budgets: gestión simple de presupuestos y clientes para pymes.',
  generator: 'Webi',
  icons: {
    icon: [
      {
        url: '/favico.ico',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/favico.ico',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/favico.ico',
        type: 'image/svg+xml',
      },
    ],
    apple: '/favico.ico',
  },

  // 🌟 VERIFICACIÓN DE GOOGLE SEARCH CONSOLE AGREGADA AQUÍ:
  verification: {
    google: 'uncQp5acTGHPwkvzaev-cE9qD2F_INbbzjjfrXqvtuc',
  },

  openGraph: {
    title: '.budgets: Tu Gestión de Presupuestos al Instante', // Título diferente o igual
    description: 'Simplifica tus números. Controla tus presupuestos y clientes sin vueltas.', // Descripción más vendedora
    url: 'https://budgets.webistudio.net',
    siteName: '.budgets',
    // 🌟 LA IMAGEN CRUCIAL PARA WHATSAPP 🌟
    // WhatsApp prefiere imágenes cuadradas (al menos 300x300px, máx 1MB).
    // Si usas una imagen rectangular normal (como la de Facebook, 1200x630), WhatsApp la cortará.
    // Lo ideal es tener una imagen OG cuadrada específica para WhatsApp.
    images: [
      {
        url: 'https://budgets.webistudio.net/og-whatsapp.png', // Imagen de 300x300 o similar, en /public
        width: 300,
        height: 300,
        alt: '.budgets - Logo',
      },
      // Puedes incluir la versión estándar rectangular también
      {
        url: 'https://budgets.webistudio.net/og-image.png', // 1200x630, en /public
        width: 1200,
        height: 630,
        alt: '.budgets - Dashboard',
      },
    ],
    locale: 'es_AR', // Tu localidad principal
    type: 'website',
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
