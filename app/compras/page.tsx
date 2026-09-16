'use client'
import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { MapPin } from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PropertyCard from '@/components/cards/PropertyCard'
import { PROPERTY_TYPE_GROUPS } from '@/lib/propertyTypes'

const CHANNELS = ['all', 'personal', 'bancaria', 'alquiler']

const FADE_UP = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

export default function ComprasPage() {
  const [channel, setChannel] = useState('all')
  const [zone, setZone] = useState('all')
  const [type, setType] = useState('all')
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/properties')
      .then(r => r.json())
      .then(data => setProperties(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [])

  // Los filtros también viven en la URL para sobrevivir a un back/forward del
  // navegador: al volver desde la ficha de una propiedad, Next.js puede
  // remontar esta página desde cero y perder el estado local si no está aquí.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const c = params.get('canal')
    const z = params.get('zona')
    const t = params.get('tipo')
    if (c) setChannel(c)
    if (z) setZone(z)
    if (t) setType(t)
  }, [])

  const updateUrlParam = (key: string, value: string) => {
    const params = new URLSearchParams(window.location.search)
    if (value === 'all') params.delete(key)
    else params.set(key, value)
    const qs = params.toString()
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname)
  }

  // Las zonas salen de la cartera real, no de una lista fija a mano — si se
  // trabajan más zonas (o se importan más provincias), aparecen solas aquí.
  const zoneCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const p of properties) {
      const city = (p.city || '').trim()
      if (!city) continue
      counts.set(city, (counts.get(city) || 0) + 1)
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
  }, [properties])

  const filtered = properties
    .filter(p => channel === 'all' || p.channel === channel)
    .filter(p => zone === 'all' || (p.city || '').trim() === zone)
    .filter(p => type === 'all' || p.property_type === type)

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
          <div className="flex gap-2 flex-wrap justify-center mb-4">
            {CHANNELS.map(c => (
              <button key={c} onClick={() => { setChannel(c); updateUrlParam('canal', c) }}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all capitalize ${
                  channel === c ? 'bg-[#C9A84C] text-[#0A0A0A] font-bold' : 'bg-[#111827] text-gray-400 hover:text-white border border-[#C9A84C]/10'
                }`}>
                {c === 'all' ? 'Todas' : c === 'bancaria' ? '🏦 Bancarias' : c === 'alquiler' ? '🏖️ Turísticas' : '⭐ Exclusivas'}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 mb-4">
            <label htmlFor="zona-propiedad" className="flex items-center gap-1.5 text-[#8B96A5] text-xs">
              <MapPin size={12} /> Zona
            </label>
            <select
              id="zona-propiedad"
              value={zone}
              onChange={e => { setZone(e.target.value); updateUrlParam('zona', e.target.value) }}
              className="bg-[#111827] text-gray-300 text-sm border border-[#1B7F6F]/15 rounded-full px-4 py-1.5 focus:outline-none focus:border-[#1B7F6F]/40"
            >
              <option value="all">Toda la región ({properties.length})</option>
              {zoneCounts.map(([city, count]) => (
                <option key={city} value={city}>{city} ({count})</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-center gap-2 mb-10">
            <label htmlFor="tipo-propiedad" className="text-[#8B96A5] text-xs">Tipo</label>
            <select
              id="tipo-propiedad"
              value={type}
              onChange={e => { setType(e.target.value); updateUrlParam('tipo', e.target.value) }}
              className="bg-[#111827] text-gray-300 text-sm border border-[#C9A84C]/10 rounded-full px-4 py-1.5 focus:outline-none focus:border-[#C9A84C]/40"
            >
              <option value="all">Todos los tipos</option>
              {PROPERTY_TYPE_GROUPS.map(g => (
                <optgroup key={g.bucket} label={g.label}>
                  {g.types.map(t => (
                    <option key={t} value={g.bucket}>{t}</option>
                  ))}
                </optgroup>
              ))}
            </select>
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
