import type { MetadataRoute } from 'next'

const base = 'https://group360iniciativas.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const pages: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
    { path: '/', priority: 1.0, changeFrequency: 'weekly' },
    { path: '/compras', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/alquileres', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/inversores', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/inversores/register', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/privacidad', priority: 0.3, changeFrequency: 'yearly' },
  ]

  return pages.map(p => ({
    url: `${base}${p.path}`,
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }))
}
