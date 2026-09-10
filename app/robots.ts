import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/auth/login', '/register'],
      disallow: ['/dashboard', '/api/', '/admin/', '/p/'], // ⛔ Blindamos las zonas privadas — /p/ son links de presupuestos de clientes, no páginas públicas del sitio
    },
    sitemap: 'https://budgets.webistudio.net/sitemap.xml',
  }
}