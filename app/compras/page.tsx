'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PropertyCard from '@/components/cards/PropertyCard'

const ALL_PROPERTIES = [
  { id: '1', title: 'Villa Exclusiva Marbella', price: 650000, location: 'Marbella, Málaga', bedrooms: 5, bathrooms: 4, area_sqm: 380, estimated_roi: 6.0, yearly_rent: 39000, channel: 'personal', main_image: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800' },
  { id: '2', title: 'Apartamento Premium Madrid', price: 480000, location: 'Madrid', bedrooms: 3, bathrooms: 2, area_sqm: 145, estimated_roi: 5.0, yearly_rent: 24000, channel: 'exp', main_image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800' },
  { id: '3', title: 'Villa Turística Costa del Sol', price: 380000, location: 'Estepona, Málaga', bedrooms: 4, bathrooms: 3, area_sqm: 250, estimated_roi: 6.0, yearly_rent: 22800, channel: 'alquiler', main_image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800' },
  { id: '4', title: 'Piso Bancario Barcelona', price: 210000, location: 'Barcelona', bedrooms: 2, bathrooms: 1, area_sqm: 85, estimated_roi: 5.7, yearly_rent: 12000, channel: 'bancaria', main_image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800' },
  { id: '5', title: 'Apartamento Valencia Playa', price: 165000, location: 'Valencia', bedrooms: 2, bathrooms: 1, area_sqm: 68, estimated_roi: 6.0, yearly_rent: 9900, channel: 'exp', main_image: 'https://images.unsplash.com/photo-1555636222-cae831e670b3?w=800' },
  { id: '6', title: 'Ático Panorámico Alicante', price: 295000, location: 'Alicante', bedrooms: 3, bathrooms: 2, area_sqm: 120, estimated_roi: 5.1, yearly_rent: 15000, channel: 'personal', main_image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800' },
]

const CHANNELS = ['all', 'exp', 'personal', 'bancaria', 'alquiler']
const FADE_UP = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

export default function ComprasPage() {
  const [channel, setChannel] = useState('all')
  const filtered = channel === 'all' ? ALL_PROPERTIES : ALL_PROPERTIES.filter(p => p.channel === channel)

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
              Cartera eXp Realty, bancarias con descuento y exclusivos off-market.
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
                {c === 'all' ? 'Todas' : c === 'exp' ? 'eXp Realty' : c === 'bancaria' ? '🏦 Bancarias' : c === 'alquiler' ? '🏖️ Turísticas' : '⭐ Exclusivas'}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {filtered.map(p => <PropertyCard key={p.id} property={p} />)}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-500">No hay propiedades en esta categoría por el momento.</div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}
