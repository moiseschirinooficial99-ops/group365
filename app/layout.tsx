import type { Metadata } from 'next'
import { config } from '@/lib/config'
import './globals.css'

const SITE = 'https://group360iniciativas.com'

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: 'GROUP 360 INICIATIVAS | Asesoría Patrimonial Inmobiliaria en Reus, Tarragona',
    template: '%s | GROUP 360 INICIATIVAS',
  },
  description:
    'Asesoría patrimonial inmobiliaria 360° en Reus, Tarragona. Compra de activos prime, alquileres turísticos e inversión inmobiliaria en España con ROI 4-6%.',
  keywords: [
    'inmobiliaria Reus',
    'inmobiliaria Tarragona',
    'inversión inmobiliaria España',
    'asesoría patrimonial inmobiliaria',
    'alquileres turísticos',
    'compra de propiedades',
    'activos prime',
    'GROUP 360 INICIATIVAS',
  ],
  authors: [{ name: 'GRUPO 360 INICIATIVAS S.L.' }],
  creator: 'GRUPO 360 INICIATIVAS S.L.',
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'GROUP 360 INICIATIVAS | Asesoría Patrimonial Inmobiliaria',
    description:
      'Asesoría patrimonial inmobiliaria 360° en Reus, Tarragona. Cartera de activos prime e inversión en España.',
    url: SITE,
    siteName: 'GROUP 360 INICIATIVAS',
    locale: 'es_ES',
    type: 'website',
    images: [{ url: '/logo.png', alt: 'GROUP 360 INICIATIVAS' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GROUP 360 INICIATIVAS | Asesoría Patrimonial Inmobiliaria',
    description:
      'Asesoría patrimonial inmobiliaria 360° en Reus, Tarragona. Activos prime e inversión en España.',
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  // Rellena con el código de Google Search Console (meta verification) vía env.
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'RealEstateAgent',
  name: config.empresa.nombreCompleto,
  alternateName: config.empresa.nombre,
  description: config.empresa.descripcion,
  url: SITE,
  logo: `${SITE}/logo.png`,
  image: `${SITE}/logo.png`,
  telephone: `+${config.contacto.whatsapp}`,
  email: config.contacto.email,
  foundingDate: config.empresa.fundada,
  areaServed: config.zonas,
  address: {
    '@type': 'PostalAddress',
    addressLocality: config.contacto.ciudad,
    addressRegion: config.contacto.provincia,
    addressCountry: 'ES',
  },
  sameAs: [
    config.redes.instagram,
    config.redes.tiktok,
    config.redes.facebook,
    config.redes.linkedin,
    config.redes.youtube,
  ].filter(Boolean),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
