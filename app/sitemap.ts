// app/sitemap.ts
import { MetadataRoute } from 'next'
import { GUIAS } from '@/lib/guias-data'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://budgets.webistudio.net'
  const now = new Date()

  const paginasFijas: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    // Manual de uso — contenido real y completo, buen candidato a indexar
    {
      url: `${baseUrl}/manual`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    // 👇 nuevo — faltaban del sitemap aunque ya estaban públicas
    {
      url: `${baseUrl}/pricing`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/revendedores`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    // 👇 nuevo — Campus: hub + Glosario (contenido fuerte para SEO, cada
    // término del glosario tiene su propia ancla pero vive en una sola URL)
    {
      url: `${baseUrl}/campus`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/campus/glosario`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/campus/guias`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // Auth & Conversión PLG (Acceso directo a probar la plataforma)
    {
      url: `${baseUrl}/auth/login`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]

  // 👇 nuevo — generadas desde lib/guias-data.ts: cuando se agregue una guía
  // o un capítulo nuevo, el sitemap se actualiza solo, sin tocar este archivo.
  const paginasDeGuias: MetadataRoute.Sitemap = GUIAS.flatMap((guia) => [
    {
      url: `${baseUrl}/campus/guias/${guia.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    ...guia.capitulos.map((capitulo) => ({
      url: `${baseUrl}/campus/guias/${guia.slug}/${capitulo.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    })),
  ])

  return [...paginasFijas, ...paginasDeGuias]
}