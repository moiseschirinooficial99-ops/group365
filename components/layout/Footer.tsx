'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { config, waLink } from '@/lib/config'

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

        {/* Columna 1: Marca + Newsletter */}
        <div>
          <div className="font-playfair text-xl font-bold mb-1">
            <span className="text-[#1B7F6F]">{config.empresa.nombre.split(' ')[0]}</span>
            <span className="bg-gradient-to-r from-[#C9A84C] to-[#E8D5A3] bg-clip-text text-transparent"> {config.empresa.nombre.split(' ')[1]}</span>
          </div>
          <p className="text-[8px] tracking-[0.3em] text-[#8B96A5] uppercase mb-4">{config.empresa.slogan}</p>
          <p className="text-[#8B96A5] text-sm leading-relaxed mb-2">{config.empresa.descripcion}</p>
          <p className="text-[#8B96A5] text-xs mb-2">
            {config.empresa.nombreCompleto} · NIF: {config.empresa.nif}
          </p>
          <p className="text-[#8B96A5] text-xs mb-6">
            {config.contacto.direccion}, {config.contacto.ciudad}, {config.contacto.provincia}
          </p>
          {done ? (
            <p className="text-[#1B7F6F] text-sm">Suscrito. Te mantendremos informado.</p>
          ) : (
            <form onSubmit={subscribe} className="flex gap-2">
              <input
                type="email" placeholder="Tu email" required value={email}
                onChange={e => setEmail(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white placeholder-[#8B96A5] focus:border-[#C9A84C]/40 focus:outline-none transition-colors"
              />
              <button type="submit" className="btn-primary text-xs px-4 py-2 shrink-0">Suscribir</button>
            </form>
          )}
        </div>

        {/* Columna 2: Links */}
        <div>
          <h4 className="text-white font-semibold text-xs tracking-[0.2em] uppercase mb-5">Links Útiles</h4>
          <ul className="space-y-3 text-sm text-[#8B96A5]">
            <li><Link href="/" className="hover:text-white transition-colors">Inicio</Link></li>
            <li><Link href="/compras" className="hover:text-white transition-colors">Compra de Propiedades</Link></li>
            <li><Link href="/alquileres" className="hover:text-white transition-colors">Alquileres Turísticos</Link></li>
            <li><Link href="/inversores" className="hover:text-white transition-colors">Portal Inversores</Link></li>
            <li><Link href="/inversores/register" className="hover:text-white transition-colors">Registro Inversor</Link></li>
            <li><Link href="/privacidad" className="hover:text-white transition-colors">Política de Privacidad</Link></li>
          </ul>
        </div>

        {/* Columna 3: Contacto + Redes */}
        <div>
          <h4 className="text-white font-semibold text-xs tracking-[0.2em] uppercase mb-5">Contacto</h4>
          <ul className="space-y-3 text-sm text-[#8B96A5] mb-8">
            <li className="flex items-start gap-2">
              <span className="text-[#1B7F6F] text-xs font-semibold shrink-0 pt-0.5">@</span>
              <span>{config.contacto.email}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#1B7F6F] text-xs font-semibold shrink-0 pt-0.5">WA</span>
              <a href={waLink()} target="_blank" rel="noopener noreferrer"
                className="hover:text-white transition-colors">{config.contacto.whatsappDisplay}</a>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#1B7F6F] text-xs font-semibold shrink-0 pt-0.5">ES</span>
              <span>{config.contacto.direccion},<br />{config.contacto.ciudad}, {config.contacto.provincia}</span>
            </li>
          </ul>

          <h4 className="text-white font-semibold text-xs tracking-[0.2em] uppercase mb-4">Redes Sociales</h4>
          <ul className="space-y-2.5 text-sm text-[#8B96A5]">
            {config.redes.instagram && (
              <li>
                <a href={config.redes.instagram} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  Instagram
                </a>
              </li>
            )}
            {config.redes.tiktok && (
              <li>
                <a href={config.redes.tiktok} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.79 1.52V6.76a4.85 4.85 0 01-1.02-.07z"/>
                  </svg>
                  TikTok
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* eXp Realty badge */}
      <div className="max-w-7xl mx-auto mb-8 flex items-center gap-4 border border-white/5 rounded-xl px-6 py-4 bg-white/[0.02]">
        <div className="shrink-0">
          <Image
            src="/logo exp.jpeg"
            alt="eXp Realty"
            width={100}
            height={34}
            className="object-contain opacity-90"
          />
        </div>
        <div>
          <p className="text-[10px] tracking-[0.25em] text-[#8B96A5] uppercase mb-0.5">Orgullosos miembros de</p>
          <p className="text-white text-sm font-semibold">eXp Realty</p>
          <p className="text-[#8B96A5] text-xs">Team Leader · Red inmobiliaria global</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-3">
        <p className="text-[#8B96A5] text-xs">
          © 2025-2026 {config.empresa.nombreCompleto} · NIF {config.empresa.nif} · Todos los derechos reservados.
        </p>
        <a href="https://macdestudios.com" target="_blank" rel="noopener noreferrer"
          className="text-xs text-[#8B96A5] hover:text-[#C9A84C] transition-colors">
          Desarrollo y producción por macdestudios.com
        </a>
      </div>
    </footer>
  )
}
