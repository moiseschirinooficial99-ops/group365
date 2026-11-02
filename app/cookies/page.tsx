import type { Metadata } from 'next'
import Link from 'next/link'
import { config } from '@/lib/config'
import CookieSettingsButton from '@/components/CookieSettingsButton'

export const metadata: Metadata = {
  title: 'Política de cookies',
  description: `Qué cookies usa la web de ${config.empresa.nombre} y cómo gestionarlas.`,
}

const H2 = 'text-xl font-bold text-white mt-8 mb-4'

export default function Cookies() {
  return (
    <main className="bg-[#0F1419] min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-20 text-gray-300">
        <Link href="/" className="text-[#C9A84C] text-sm hover:underline mb-8 inline-block">← Volver al inicio</Link>
        <h1 className="font-playfair text-3xl font-bold text-white mb-8">Política de cookies</h1>
        <p className="mb-4 text-sm text-[#8B96A5]">Última actualización: noviembre 2026</p>

        <p className="mb-6">Una cookie es un pequeño archivo que la web guarda en tu navegador. Solo usamos cookies de medición y publicidad si nos das tu consentimiento en el aviso de cookies.</p>

        <h2 className={H2}>Cookies técnicas (siempre activas)</h2>
        <p className="mb-4">Necesarias para que la web funcione: inicio de sesión del portal de inversores y del panel, y recordar tu elección sobre cookies. No requieren consentimiento.</p>

        <h2 className={H2}>Cookies de análisis y publicidad (con tu consentimiento)</h2>
        <ul className="mb-4 list-disc pl-6 space-y-2">
          <li><strong className="text-white">Google Analytics</strong> (Google): mide visitas y uso de la web de forma agregada.</li>
          <li><strong className="text-white">Meta Pixel</strong> (Meta Platforms): mide la eficacia de nuestros anuncios en Facebook e Instagram y permite mostrarte anuncios relevantes.</li>
          <li><strong className="text-white">TikTok Pixel</strong> (TikTok): mide la eficacia de nuestros anuncios en TikTok.</li>
        </ul>
        <p className="mb-4">Estos proveedores pueden tratar datos fuera del Espacio Económico Europeo conforme a sus propias políticas de privacidad.</p>

        <h2 className={H2}>Cómo cambiar tu elección</h2>
        <p className="mb-4">Puedes aceptar o rechazar estas cookies cuando quieras:</p>
        <CookieSettingsButton />
        <p className="mt-4 mb-4">También puedes borrarlas desde la configuración de tu navegador.</p>

        <h2 className={H2}>Más información</h2>
        <p className="mb-4">Consulta nuestra <Link href="/privacidad" className="text-[#C9A84C] hover:underline">Política de privacidad</Link> o escríbenos a <span className="text-[#C9A84C]">{config.contacto.email}</span>.</p>
      </div>
    </main>
  )
}
