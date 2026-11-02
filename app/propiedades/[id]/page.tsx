import type { Metadata } from 'next'
import { cache } from 'react'
import { supabaseAdmin } from '@/lib/supabase'
import PropertyDetail from './PropertyDetail'

// Ficha de propiedad renderizada en el servidor: Google indexa cada
// inmueble con su título, precio y foto, y al compartir el enlace por
// WhatsApp/redes sale la foto real del inmueble.
export const revalidate = 600 // se regenera como mucho cada 10 min

const BASE = 'https://www.group360iniciativas.com'

const getProperty = cache(async (id: string) => {
  if (!/^[0-9a-f-]{8,64}$/i.test(id)) return null
  const { data } = await supabaseAdmin
    .from('properties')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .maybeSingle()
  return data
})

function priceText(p: any): string {
  if (Number(p.price_per_night) > 0) return `${Number(p.price_per_night).toLocaleString('es-ES')} €/noche`
  if (Number(p.price) > 0) return `${Number(p.price).toLocaleString('es-ES')} €`
  return 'Precio a consultar'
}

function plain(text: string | null | undefined, max: number): string {
  const t = (text || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const p = await getProperty(params.id)
  if (!p) return { title: 'Propiedad no disponible', robots: { index: false } }

  const facts = [
    p.bedrooms ? `${p.bedrooms} hab.` : null,
    p.bathrooms ? `${p.bathrooms} baños` : null,
    p.area_sqm ? `${p.area_sqm} m²` : null,
  ].filter(Boolean).join(' · ')
  const title = `${p.title}${p.location ? ` en ${p.location}` : ''} — ${priceText(p)}`
  const description = plain(`${facts ? facts + '. ' : ''}${p.description}`, 158)
  const image = p.main_image || p.images?.[0]
  const url = `${BASE}/propiedades/${p.id}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      title,
      description,
      images: image ? [{ url: image, alt: p.title }] : undefined,
    },
    twitter: { card: 'summary_large_image', title, description, images: image ? [image] : undefined },
  }
}

export default async function PropertyPage({ params }: { params: { id: string } }) {
  const p = await getProperty(params.id)

  const jsonLd = p ? {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: p.title,
    url: `${BASE}/propiedades/${p.id}`,
    image: p.images?.length ? p.images : p.main_image ? [p.main_image] : undefined,
    description: plain(p.description, 500),
    offers: Number(p.price) > 0 ? {
      '@type': 'Offer',
      price: Number(p.price),
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
    } : undefined,
    address: p.location ? { '@type': 'PostalAddress', addressLocality: p.location, addressCountry: 'ES' } : undefined,
  } : null

  return (
    <>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      )}
      <PropertyDetail property={p} />
    </>
  )
}
