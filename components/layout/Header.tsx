'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'

const NAV = [
  { href: '/alquileres', label: 'Alquileres' },
  { href: '/compras', label: 'Compras' },
  { href: '/inversores', label: 'Inversores' },
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
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled ? 'bg-[#0F1419]/95 backdrop-blur-md shadow-lg shadow-black/30' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <img src="/logo.png" alt="GROUP 360" width={64} height={64} className="rounded-lg w-[52px] h-[52px] md:w-16 md:h-16" />
          <div className="hidden sm:block">
            <span className="font-playfair font-bold text-lg tracking-wide">
              <span className="text-[#1B7F6F]">GROUP</span>
              <span className="gold-text"> 360</span>
            </span>
            <div className="text-[8px] tracking-[0.25em] text-[#8B96A5] uppercase">Iniciativas</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {NAV.map(item => (
            <Link key={item.href} href={item.href}
              className="text-sm text-[#8B96A5] hover:text-white transition-colors tracking-wide">
              {item.label}
            </Link>
          ))}
          <Link href="/inversores/register" className="btn-primary text-xs px-5 py-2.5 tracking-wider">
            Acceso Inversores
          </Link>
        </nav>

        <button className="md:hidden text-white/60 hover:text-white p-2 transition-colors" onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#0F1419]/98 backdrop-blur-md border-t border-white/5 px-6 py-6 space-y-4"
          >
            {NAV.map(item => (
              <Link key={item.href} href={item.href}
                className="block text-[#8B96A5] hover:text-white py-2 text-sm tracking-wide transition-colors"
                onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
            <Link href="/inversores/register" className="btn-primary block text-center text-sm"
              onClick={() => setOpen(false)}>
              Acceso Inversores
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
