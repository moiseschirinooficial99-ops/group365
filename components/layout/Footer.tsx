import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-[#0D1117] border-t border-white/5 py-16 px-4">
      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12 mb-12">
        <div className="md:col-span-1">
          <div className="font-playfair text-xl font-bold mb-1">
            <span className="text-[#1B7F6F]">GROUP</span>
            <span className="bg-gradient-to-r from-[#C9A84C] to-[#E8D5A3] bg-clip-text text-transparent"> 360</span>
          </div>
          <p className="text-[8px] tracking-[0.3em] text-[#8B96A5] uppercase mb-5">Iniciativas</p>
          <p className="text-[#8B96A5] text-sm leading-relaxed mb-4">
            Visión 360° del mercado inmobiliario. Alquileres, compras e inversiones premium en España.
          </p>
          <p className="text-[#8B96A5] text-xs">Miembro de la red eXp Realty</p>
        </div>

        <div>
          <h4 className="text-white font-semibold text-xs tracking-[0.2em] uppercase mb-5">Servicios</h4>
          <ul className="space-y-3 text-sm text-[#8B96A5]">
            <li><Link href="/alquileres" className="hover:text-white transition-colors">Alquileres Turísticos</Link></li>
            <li><Link href="/compras" className="hover:text-white transition-colors">Compra de Propiedades</Link></li>
            <li><Link href="/inversores" className="hover:text-white transition-colors">Portal Inversores</Link></li>
            <li><Link href="/inversores/register" className="hover:text-white transition-colors">Registro Inversor</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold text-xs tracking-[0.2em] uppercase mb-5">Contacto</h4>
          <ul className="space-y-3 text-sm text-[#8B96A5]">
            <li className="flex items-center gap-2">
              <span className="text-[#1B7F6F] text-xs font-semibold">WA</span>
              <span>+34 600 000 000</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#1B7F6F] text-xs font-semibold">@</span>
              <span>info@group360.es</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#1B7F6F] text-xs font-semibold">ES</span>
              <span>España</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold text-xs tracking-[0.2em] uppercase mb-5">Redes Sociales</h4>
          <ul className="space-y-3 text-sm text-[#8B96A5]">
            <li><a href="#" className="hover:text-white transition-colors">Instagram</a></li>
            <li><a href="#" className="hover:text-white transition-colors">TikTok</a></li>
            <li><a href="#" className="hover:text-white transition-colors">LinkedIn</a></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-[#8B96A5] text-xs">
          © 2024 GROUP 360 INICIATIVAS. Todos los derechos reservados.
        </p>
        <p className="text-[#8B96A5] text-xs tracking-widest uppercase">
          Visión 360° del Mercado Inmobiliario
        </p>
      </div>
    </footer>
  )
}
