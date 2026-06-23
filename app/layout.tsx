import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://group360iniciativas.com'),
  title: 'GROUP 360 INICIATIVAS | Asesoría Patrimonial Inmobiliaria',
  description: 'Asesoría patrimonial inmobiliaria 360°. Alquileres turísticos, activos prime e inversión en España. ROI 4-6% garantizado.',
  icons: {
    icon: '/favicon.ico',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'GROUP 360 INICIATIVAS',
    description: 'Asesoría patrimonial inmobiliaria 360°. Cartera de activos prime e inversión en España.',
    locale: 'es_ES',
    type: 'website',
    images: ['/logo.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
