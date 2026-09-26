// app/layout.tsx
import React from "react"
import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'sonner'
import { Inter } from 'next/font/google'
import { PwaRegister } from '@/components/pwa-register'
import { InstallPwaBanner } from '@/components/install-pwa-banner' // 👈 nuevo // 👈 nuevo

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: '.budgets | Presupuestos, Cobros y Gestión para tu Negocio',
  description:
    'Sistema de gestión para negocios y profesionales independientes que cotizan y venden: presupuestos, seguimiento de clientes, cobro online con Mercado Pago y documentos, todo en un solo lugar. Para el que además maneja stock o trabajo en campo, suma calculadora por m², control de stock y órdenes de trabajo con QR.',
  generator: 'Webi',

  alternates: {
    canonical: 'https://budgets.webistudio.net',
  },

  robots: {
    index: true,
    follow: true,
  },

  manifest: '/manifest.json', // 👈 nuevo — conecta la PWA general

  icons: {
    icon: [
      { url: '/favico.ico', media: '(prefers-color-scheme: light)' },
      { url: '/favico.ico', media: '(prefers-color-scheme: dark)' },
    ],
    apple: '/icon-general-192-maskable.png', // 👈 antes: versión cuadrada — ver nota sobre iOS en la conversación
  },

  verification: {
    google: 'uncQp5acTGHPwkvzaev-cE9qD2F_INbbzjjfrXqvtuc',
  },

  openGraph: {
    title: '.budgets | Presupuestos, Cobros y Gestión Integral',
    description:
      'Comenzá gratis. Presupuestos profesionales, cobro online con Mercado Pago y seguimiento de clientes — para profesionales independientes y PyMEs. Con calculadora por m², control de stock y órdenes de trabajo con QR para el que también maneja obra o taller.',
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
    title: '.budgets | Presupuestos y Gestión para tu Negocio',
    description:
      'Plataforma freemium para profesionales independientes y PyMEs: presupuestos, cobro online con Mercado Pago, clientes, y para el que lo necesite, stock y órdenes de trabajo con QR.',
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
  'description': 'Sistema de gestión comercial para profesionales independientes, freelancers y PyMEs de servicios que cotizan y venden: presupuestos, seguimiento de clientes, cobro online con Mercado Pago y documentos. Para negocios que además manejan stock o trabajo en campo (talleres, imprentas, constructoras), suma cotizador por m², control de stock y órdenes de trabajo con QR.',
  'publisher': {
    '@type': 'Organization',
    'name': 'Webi Studio',
    'url': 'https://webistudio.net'
  },
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
    'Presupuestos profesionales en segundos, con seguimiento de clientes y estado de cada cotización',
    'Cobro online integrado con Mercado Pago: link de pago, seña o total, directo a la cuenta del negocio',
    'CRM de Clientes con historial financiero unificado',
    'Gestión de documentos: recibos, remitos y comprobantes en PDF profesional',
    'Módulo de Rendimientos e Historial de Repartija de Ganancias entre socios y vendedores',
    'Dashboard con métricas clave de facturación y rentabilidad',
    'Cotizador automático por m², lineal y volumen (superficies, cartelería, obras y vidrios) para quien cobra por medida',
    'Control de stock en tiempo real con alertas de mínimo y variantes (color, talle, medida)',
    'Generación de Órdenes de Trabajo con código QR y geolocalización para equipos en campo',
    'Tablero Kanban de tareas operativo e integrado a presupuestos',
    'Modo Kiosco: pantalla táctil para tableros por proyecto y prioridades visuales'
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
        <PwaRegister /> {/* 👈 registra el Service Worker apenas carga cualquier página */}
        <InstallPwaBanner /> {/* 👈 nuevo — el cartel/botón de instalar */}
        <Analytics />
      </body>
    </html>
  )
}