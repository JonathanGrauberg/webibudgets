// app/layout.tsx
import React from "react"
import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'sonner'
import { Inter } from 'next/font/google'
import { DifyChatbot } from '@/components/dify-chatbot'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: '.budgets | Software de Gestión, Presupuestos y Órdenes de Trabajo',
  description:
    'Ecosistema integral para PYMEs: presupuestos medibles por m², órdenes de trabajo con QR, tablero Kanban, control de stock y repartija de ganancias.',
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
    ],
    apple: '/favico.ico',
  },

  verification: {
    google: 'uncQp5acTGHPwkvzaev-cE9qD2F_INbbzjjfrXqvtuc',
  },

  openGraph: {
    title: '.budgets | Presupuestos, Órdenes de Trabajo y Gestión Integral',
    description:
      'Presupuestos dinámicos, stock por variante, órdenes de trabajo con QR, tablero Kanban y repartija de ganancias — todo conectado.',
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
    title: '.budgets | Sistema de Gestión Operativa y Financiera',
    description:
      'Cotizaciones por m², seguimiento de obras con QR, Kanban y comisiones en tiempo real.',
    images: ['https://budgets.webistudio.net/og-image.png'],
  },
}

// 🚀 Esquema de datos estructurados para Google (JSON-LD)
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  'name': '.budgets',
  'operatingSystem': 'Web, Android, iOS (PWA)',
  'applicationCategory': 'BusinessApplication',
  'url': 'https://budgets.webistudio.net',
  'description': 'Sistema integral de gestión operativa y financiera para PYMEs, talleres, imprentas y freelancers. Incluye presupuestos dinámicos por m², órdenes de trabajo con QR, tablero Kanban, control de stock y cálculo de rendimientos.',
  'publisher': {
    '@type': 'Organization',
    'name': 'Webi Studio',
    'url': 'https://webistudio.net'
  },
  'offers': {
    '@type': 'Offer',
    'price': '0',
    'priceCurrency': 'ARS',
    'availability': 'https://schema.org/InStock'
  },
  'featureList': [
    'Cotizador automático por m² y volumen (superficies, cartelería, obras)',
    'Generación de Órdenes de Trabajo con código QR y link a Google Maps',
    'Tablero Kanban de tareas vinculado a documentos financieros',
    'Módulo de Rendimientos y repartija automática de ganancias entre vendedores/socios',
    'Control de stock en tiempo real con alertas y variantes (color, talle, medida)',
    'Gestión de comprobantes: presupuestos, remitos, recibos y órdenes',
    'Dashboard de Business Intelligence con métricas de ventas e ingresos'
  ]
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${inter.variable}`}>
      <head>
        {/* 🤖 Inyectamos el JSON-LD en la cabecera */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster />
          <DifyChatbot />
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}