'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PropertyCard from '@/components/cards/PropertyCard'

const CHANNELS = ['all', 'personal', 'bancaria', 'alquiler']

const FADE_UP = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

export default function ComprasPage() {
  const [channel, setChannel] = useState('all')
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/properties')
      .then(r => r.json())
      .then(data => setProperties(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [])

  const filtered = channel === 'all'
    ? properties
    : properties.filter(p => p.channel === channel)

  return (
    <main>
      <Header />

      <section className="relative min-h-[50vh] flex items-center justify-center pt-16">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=1800" alt="compras" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/70 to-[#0A0A0A]" />
        </div>
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <motion.div initial="hidden" animate="show" variants={FADE_UP}>
            <span className="inline-block text-[#1B7F6F] text-xs font-semibold tracking-[0.4em] uppercase mb-6 border border-[#1B7F6F]/30 px-4 py-1.5 rounded-full">
              Compra de Propiedades
            </span>
            <h1 className="font-playfair text-5xl md:text-6xl font-bold mb-6">
              Tu Propiedad Ideal<br /><span className="gold-text">En España</span>
            </h1>
            <p className="text-gray-300 text-lg">
              Propiedades premium, bancarias con descuento y exclusivos off-market.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="flex gap-2 flex-wrap justify-center mb-10">
            {CHANNELS.map(c => (
              <button key={c} onClick={() => setChannel(c)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all capitalize ${
                  channel === c ? 'bg-[#C9A84C] text-[#0A0A0A] font-bold' : 'bg-[#111827] text-gray-400 hover:text-white border border-[#C9A84C]/10'
                }`}>
                {c === 'all' ? 'Todas' : c === 'bancaria' ? '🏦 Bancarias' : c === 'alquiler' ? '🏖️ Turísticas' : '⭐ Exclusivas'}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card h-80 animate-pulse bg-white/5 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {filtered.map(p => <PropertyCard key={p.id} property={p} />)}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-16 text-gray-500">No hay propiedades en esta categoría por el momento.</div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}
