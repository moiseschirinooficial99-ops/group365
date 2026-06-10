import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GROUP 360 INICIATIVAS | Visión 360° del Mercado Inmobiliario',
  description: 'Alquileres turísticos, compras exclusivas e inversiones premium en España. ROI 4-6% garantizado.',
  icons: { icon: '/favicon.ico' },
  openGraph: {
    title: 'GROUP 360 INICIATIVAS',
    description: 'Visión 360° del Mercado Inmobiliario',
    locale: 'es_ES',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
