import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-[#111827] border-t border-[#C9A84C]/10 py-12 px-4">
      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
        <div>
          <div className="font-playfair text-xl font-bold mb-2">
            <span className="green-text">GROUP</span>
            <span className="gold-text"> 360</span>
          </div>
          <p className="text-xs text-gray-500 tracking-widest uppercase mb-4">Iniciativas</p>
          <p className="text-gray-400 text-sm">Visión 360° del mercado inmobiliario en España.</p>
        </div>
        <div>
          <h4 className="text-[#C9A84C] font-semibold mb-3 text-sm">Servicios</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><Link href="/alquileres" className="hover:text-[#C9A84C]">Alquileres Turísticos</Link></li>
            <li><Link href="/compras" className="hover:text-[#C9A84C]">Compra de Propiedades</Link></li>
            <li><Link href="/inversores" className="hover:text-[#C9A84C]">Portal Inversores</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-[#C9A84C] font-semibold mb-3 text-sm">Contacto</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>📱 WhatsApp directo</li>
            <li>📧 info@group360.es</li>
            <li>📍 España</li>
          </ul>
        </div>
        <div>
          <h4 className="text-[#C9A84C] font-semibold mb-3 text-sm">Redes</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><a href="#" className="hover:text-[#C9A84C]">Instagram</a></li>
            <li><a href="#" className="hover:text-[#C9A84C]">TikTok</a></li>
            <li><a href="#" className="hover:text-[#C9A84C]">LinkedIn</a></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-[#C9A84C]/10 text-center text-gray-600 text-xs">
        © 2024 GROUP 360 INICIATIVAS. Visión 360° del Mercado Inmobiliario. Todos los derechos reservados.
      </div>
    </footer>
  )
}
