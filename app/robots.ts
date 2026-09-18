import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/auth/login', '/register', '/manual', '/pricing', '/revendedores', '/campus', '/que-es'], // 👈 nuevo — Qué es, explícito
      disallow: ['/dashboard', '/api/', '/admin/', '/p/', '/c/'], // ⛔ Blindamos las zonas privadas — /p/ y /c/ son links de presupuestos/cobros de clientes, no páginas públicas del sitio
    },
    sitemap: 'https://budgets.webistudio.net/sitemap.xml',
  }
}