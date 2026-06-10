'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function Footer() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, type: 'newsletter', source: 'footer' }),
    })
    setDone(true)
  }

  return (
    <footer className="bg-[#0D1117] border-t border-white/5 pt-16 pb-8 px-4">
      <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-12 mb-12">

        {/* Column 1: Brand + Newsletter */}
        <div>
          <div className="font-playfair text-xl font-bold mb-1">
            <span className="text-[#1B7F6F]">GROUP</span>
            <span className="bg-gradient-to-r from-[#C9A84C] to-[#E8D5A3] bg-clip-text text-transparent"> 360</span>
          </div>
          <p className="text-[8px] tracking-[0.3em] text-[#8B96A5] uppercase mb-4">Iniciativas</p>
          <p className="text-[#8B96A5] text-sm leading-relaxed mb-2">
            Visión 360° del mercado inmobiliario. Propiedades premium, inversiones y alquileres en España.
          </p>
          <p className="text-[#8B96A5] text-xs mb-6">
            GRUPO 360 INICIATIVAS S.L. · NIF: B13911979
          </p>
          {done ? (
            <p className="text-[#1B7F6F] text-sm">Suscrito. Te mantendremos informado.</p>
          ) : (
            <form onSubmit={subscribe} className="flex gap-2">
              <input
                type="email"
                placeholder="Tu email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white placeholder-[#8B96A5] focus:border-[#C9A84C]/40 focus:outline-none transition-colors"
              />
              <button type="submit" className="btn-primary text-xs px-4 py-2 shrink-0">
                Suscribir
              </button>
            </form>
          )}
        </div>

        {/* Column 2: Links */}
        <div>
          <h4 className="text-white font-semibold text-xs tracking-[0.2em] uppercase mb-5">Links Útiles</h4>
          <ul className="space-y-3 text-sm text-[#8B96A5]">
            <li><Link href="/" className="hover:text-white transition-colors">Inicio</Link></li>
            <li><Link href="/compras" className="hover:text-white transition-colors">Compra de Propiedades</Link></li>
            <li><Link href="/alquileres" className="hover:text-white transition-colors">Alquileres Turísticos</Link></li>
            <li><Link href="/inversores" className="hover:text-white transition-colors">Portal Inversores</Link></li>
            <li><Link href="/inversores/register" className="hover:text-white transition-colors">Registro Inversor</Link></li>
          </ul>
        </div>

        {/* Column 3: Contact + Social */}
        <div>
          <h4 className="text-white font-semibold text-xs tracking-[0.2em] uppercase mb-5">Contacto</h4>
          <ul className="space-y-3 text-sm text-[#8B96A5] mb-8">
            <li className="flex items-start gap-2">
              <span className="text-[#1B7F6F] text-xs font-semibold shrink-0 pt-0.5">@</span>
              <span>info@group360.es</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#1B7F6F] text-xs font-semibold shrink-0 pt-0.5">WA</span>
              <a href="https://wa.me/34600000000" target="_blank" rel="noopener noreferrer"
                className="hover:text-white transition-colors">+34 600 000 000</a>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#1B7F6F] text-xs font-semibold shrink-0 pt-0.5">ES</span>
              <span>Passeig de Les Palmeres 16,<br />Reus, Tarragona</span>
            </li>
          </ul>
          <h4 className="text-white font-semibold text-xs tracking-[0.2em] uppercase mb-4">Redes Sociales</h4>
          <ul className="space-y-2.5 text-sm text-[#8B96A5]">
            <li>
              <a href="https://www.instagram.com/group360iniciativas" target="_blank" rel="noopener noreferrer"
                className="hover:text-white transition-colors">Instagram</a>
            </li>
            <li>
              <a href="https://www.tiktok.com/@group360iniciativas" target="_blank" rel="noopener noreferrer"
                className="hover:text-white transition-colors">TikTok</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-3">
        <p className="text-[#8B96A5] text-xs">
          © 2024 GRUPO 360 INICIATIVAS S.L. Todos los derechos reservados.
        </p>
        <a href="https://macdestudios.com" target="_blank" rel="noopener noreferrer"
          className="text-[#8B96A5] text-xs hover:text-[#C9A84C] transition-colors">
          Desarrollo y producción por macdestudios.com
        </a>
      </div>
    </footer>
  )
}
