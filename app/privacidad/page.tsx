import Link from 'next/link'

export default function Privacidad() {
  return (
    <main className="bg-[#0F1419] min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-20 text-gray-300">
        <Link href="/" className="text-[#C9A84C] text-sm hover:underline mb-8 inline-block">← Volver al inicio</Link>
        <h1 className="font-playfair text-3xl font-bold text-white mb-8">Política de Privacidad</h1>
        <p className="mb-4 text-sm text-[#8B96A5]">Última actualización: junio 2026</p>
        <p className="mb-6">GROUP 360 INICIATIVAS se compromete a proteger tu privacidad y a tratar tus datos personales conforme al Reglamento General de Protección de Datos (RGPD) y la normativa española vigente.</p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">Responsable del tratamiento</h2>
        <p className="mb-4">GRUPO 360 INICIATIVAS S.L. · NIF B13911979 · Passeig de Les Palmeres 16, Reus, Tarragona · info@group360iniciativas.com</p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">Datos que recopilamos</h2>
        <p className="mb-4">Nombre, email, teléfono y preferencias de inversión inmobiliaria facilitados voluntariamente a través de nuestros formularios de contacto o portal de inversores.</p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">Uso de los datos</h2>
        <p className="mb-4">Los datos se usan exclusivamente para contactarte sobre oportunidades inmobiliarias, gestionar tu cuenta de inversor y enviarte comunicaciones relacionadas con nuestros servicios.</p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">Base legal</h2>
        <p className="mb-4">El tratamiento se basa en tu consentimiento expreso y/o en la ejecución de una relación precontractual o contractual.</p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">Conservación de datos</h2>
        <p className="mb-4">Los datos se conservan mientras sea necesario para la prestación del servicio y durante los plazos legales aplicables.</p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">Tus derechos</h2>
        <p className="mb-4">Puedes solicitar acceso, rectificación, eliminación, limitación u oposición al tratamiento de tus datos escribiendo a <span className="text-[#C9A84C]">info@group360iniciativas.com</span></p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">Contacto</h2>
        <p>GROUP 360 INICIATIVAS · España · WhatsApp: <a href="https://wa.me/34611251818" className="text-[#C9A84C] hover:underline">+34 611 25 18 18</a></p>
      </div>
    </main>
  )
}
