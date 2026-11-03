// Limpia las variables de Supabase antes de que Next las incruste en el código.
// En Vercel la clave pública llegó con un carácter invisible (BOM, ﻿) al
// pegarla, y el navegador rechaza esa cabecera: fallaban la subida de PDF del
// panel y todo lo que llama a Supabase desde el navegador.
for (const k of ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']) {
  if (process.env[k]) process.env[k] = process.env[k].replace(/[﻿​\s]/g, '')
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // El SDK de Anthropic se carga tal cual desde node_modules: al empaquetarlo,
  // Next 14.1 rompe una expresión regular interna ("Range out of order").
  experimental: {
    serverComponentsExternalPackages: ['@anthropic-ai/sdk'],
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'api.telegram.org' },
      { protocol: 'https', hostname: 'ldlppnavezugvkskvlab.supabase.co' },
    ],
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'group365.vercel.app' }],
        destination: 'https://group360iniciativas.com/:path*',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
