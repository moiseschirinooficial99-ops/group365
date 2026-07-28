import type { MetadataRoute } from 'next'

const base = 'https://www.group360iniciativas.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Rutas privadas / sin valor SEO: no indexar
      disallow: ['/admin', '/inversores/dashboard', '/inversores/login', '/api'],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
