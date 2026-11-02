import type { MetadataRoute } from 'next'
import { supabaseAdmin } from '@/lib/supabase'

const base = 'https://www.group360iniciativas.com'

// Se regenera cada hora: así cada propiedad nueva entra sola en el mapa
// del sitio que lee Google.
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const pages: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
    { path: '/', priority: 1.0, changeFrequency: 'weekly' },
    { path: '/compras', priority: 0.9, changeFrequency: 'daily' },
    { path: '/alquileres', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/inversores', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/inversores/register', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/aviso-legal', priority: 0.2, changeFrequency: 'yearly' },
    { path: '/privacidad', priority: 0.2, changeFrequency: 'yearly' },
    { path: '/cookies', priority: 0.2, changeFrequency: 'yearly' },
  ]

  const staticEntries = pages.map(p => ({
    url: `${base}${p.path}`,
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }))

  let propertyEntries: MetadataRoute.Sitemap = []
  try {
    const { data } = await supabaseAdmin
      .from('properties')
      .select('id, imported_at, created_at')
      .eq('is_active', true)
    propertyEntries = (data || []).map((p: any) => ({
      url: `${base}/propiedades/${p.id}`,
      lastModified: new Date(p.imported_at || p.created_at || now),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  } catch {
    // Si la base de datos no responde, al menos se publican las páginas fijas.
  }

  return [...staticEntries, ...propertyEntries]
}
