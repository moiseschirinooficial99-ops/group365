import type { Metadata } from 'next'
import Link from 'next/link'
import { config, waLink } from '@/lib/config'

export const metadata: Metadata = {
  title: 'Aviso legal',
  description: `Aviso legal de ${config.empresa.nombreCompleto}: datos del titular y condiciones de uso de la web.`,
}

const H2 = 'text-xl font-bold text-white mt-8 mb-4'

export default function AvisoLegal() {
  const e = config.empresa
  const c = config.contacto
  return (
    <main className="bg-[#0F1419] min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-20 text-gray-300">
        <Link href="/" className="text-[#C9A84C] text-sm hover:underline mb-8 inline-block">← Volver al inicio</Link>
        <h1 className="font-playfair text-3xl font-bold text-white mb-8">Aviso legal</h1>
        <p className="mb-4 text-sm text-[#8B96A5]">Última actualización: noviembre 2026</p>

        <h2 className={H2}>Titular del sitio web</h2>
        <p className="mb-2">En cumplimiento de la Ley 34/2002, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se informa:</p>
        <ul className="mb-4 list-disc pl-6 space-y-1">
          <li>Titular: {e.nombreCompleto}</li>
          <li>NIF: {e.nif}</li>
          <li>Domicilio: {c.ciudad}, {c.provincia} ({c.pais})</li>
          <li>Email: <a href={`mailto:${c.email}`} className="text-[#C9A84C] hover:underline">{c.email}</a></li>
          <li>WhatsApp: <a href={waLink()} className="text-[#C9A84C] hover:underline">{c.whatsappDisplay}</a></li>
          <li>Web: {c.web}</li>
        </ul>

        <h2 className={H2}>Objeto</h2>
        <p className="mb-4">Este sitio web ofrece información sobre los servicios de asesoría patrimonial inmobiliaria, compraventa, alquiler e inversión de {e.nombre}. El acceso y uso de la web atribuye la condición de usuario e implica la aceptación de este aviso legal.</p>

        <h2 className={H2}>Información sobre inmuebles e inversiones</h2>
        <p className="mb-4">Los datos de los inmuebles (precios, superficies, características, disponibilidad) y las rentabilidades mostradas son orientativos, pueden cambiar sin previo aviso y no constituyen una oferta vinculante. Las rentabilidades pasadas o estimadas no garantizan resultados futuros. Toda operación se formaliza mediante el documento contractual correspondiente.</p>

        <h2 className={H2}>Propiedad intelectual</h2>
        <p className="mb-4">Los textos, diseños, logotipos y demás contenidos de esta web pertenecen a {e.nombreCompleto} o a sus legítimos titulares. Queda prohibida su reproducción sin autorización.</p>

        <h2 className={H2}>Responsabilidad</h2>
        <p className="mb-4">{e.nombre} no se responsabiliza del mal uso que se haga de los contenidos ni de los daños derivados de interrupciones técnicas ajenas a su control. Los enlaces a sitios de terceros se ofrecen a título informativo.</p>

        <h2 className={H2}>Protección de datos y cookies</h2>
        <p className="mb-4">El tratamiento de datos personales se rige por nuestra <Link href="/privacidad" className="text-[#C9A84C] hover:underline">Política de privacidad</Link> y el uso de cookies por la <Link href="/cookies" className="text-[#C9A84C] hover:underline">Política de cookies</Link>.</p>

        <h2 className={H2}>Legislación aplicable</h2>
        <p className="mb-4">Este aviso legal se rige por la legislación española.</p>
      </div>
    </main>
  )
}
