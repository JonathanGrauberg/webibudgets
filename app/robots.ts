import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/auth/login', '/register'],
      disallow: ['/dashboard', '/api/', '/admin/'], // ⛔ Blindamos las zonas privadas
    },
    sitemap: 'https://budgets.webistudio.net/sitemap.xml',
  }
}