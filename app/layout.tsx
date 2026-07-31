// app/layout.tsx
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
  title: '.budgets | Software de Gestión, Presupuestos y Órdenes de Trabajo',
  description:
    'Ecosistema integral para PYMEs y profesionales: cotizador por m², órdenes de trabajo con QR, tablero Kanban, control de stock, clientes y repartija de ganancias.',
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
      'Comenzá gratis. Cotizaciones por m², control de stock, órdenes de trabajo con QR, tablero Kanban y repartija de ganancias en tiempo real.',
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
      'Plataforma Freemium: cotizaciones por m², seguimiento de obras con QR, Kanban, stock y comisiones en tiempo real.',
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
  'description': 'Sistema integral de gestión operativa y financiera para PYMEs, talleres, imprentas, constructoras y freelancers. Cotizador por m², órdenes de trabajo con QR, tablero Kanban, control de stock, CRM de clientes y cálculo de rendimientos.',
  'publisher': {
    '@type': 'Organization',
    'name': 'Webi Studio',
    'url': 'https://webistudio.net'
  },
  // Modelo PLG (Freemium: Plan Free y Plan Pro)
  'offers': {
    '@type': 'AggregateOffer',
    'priceCurrency': 'ARS',
    'lowPrice': '0',
    'offerCount': '2',
    'offers': [
      {
        '@type': 'Offer',
        'name': 'Plan Free',
        'price': '0',
        'priceCurrency': 'ARS',
        'availability': 'https://schema.org/InStock'
      },
      {
        '@type': 'Offer',
        'name': 'Plan Pro',
        'priceCurrency': 'ARS',
        'availability': 'https://schema.org/InStock'
      }
    ]
  },
  'featureList': [
    'Cotizador automático por m², lineal y volumen (superficies, cartelería, obras y vidrios)',
    'Generación de Órdenes de Trabajo con código QR y geolocalización',
    'Tablero Kanban de tareas operativo e integrado a presupuestos',
    'Módulo de Rendimientos e Historial de Repartija de Ganancias entre socios y vendedores',
    'Control de stock en tiempo real con alertas de mínimo y variantes (color, talle, medida)',
    'Gestión completa de comprobantes: presupuestos, remitos, recibos y órdenes de compra',
    'CRM de Clientes y Proveedores con historial financiero unificado',
    'Exportación rápida de presupuestos y comprobantes en PDF profesional',
    'Dashboard con métricas clave de facturación y rentabilidad'
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
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}