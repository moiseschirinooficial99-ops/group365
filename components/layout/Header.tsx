'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'

const NAV = [
  { href: '/alquileres', label: '🏖️ Alquileres' },
  { href: '/compras', label: '🏠 Compras' },
  { href: '/inversores', label: '💰 Inversores' },
]

export default function Header() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-[#0A0A0A]/95 backdrop-blur-md shadow-lg shadow-black/50' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <img src="/logo.png" alt="360GROUP" width={40} height={40} className="rounded-lg" />
          <div className="hidden sm:block">
            <span className="font-playfair font-bold text-lg">
              <span className="green-text">GROUP</span>
              <span className="gold-text"> 360</span>
            </span>
            <div className="text-[9px] tracking-[0.2em] text-gray-500 uppercase">Iniciativas</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {NAV.map(item => (
            <Link key={item.href} href={item.href}
              className="text-sm text-gray-300 hover:text-[#C9A84C] transition-colors">
              {item.label}
            </Link>
          ))}
          <Link href="/inversores/register" className="btn-primary text-sm px-5 py-2">
            Acceso Inversores
          </Link>
        </nav>

        <button className="md:hidden text-white p-2" onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#111827] border-t border-[#C9A84C]/10 px-4 py-4 space-y-3"
          >
            {NAV.map(item => (
              <Link key={item.href} href={item.href}
                className="block text-gray-300 hover:text-[#C9A84C] py-2"
                onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
            <Link href="/inversores/register" className="btn-primary block text-center"
              onClick={() => setOpen(false)}>
              Acceso Inversores
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
