'use client'
import { motion } from 'framer-motion'
import { Bed, Bath, Maximize2, TrendingUp } from 'lucide-react'

const CHANNEL_BADGE: Record<string, { label: string; color: string }> = {
  exp:      { label: 'eXp Realty',    color: 'bg-blue-900/60 text-blue-300' },
  personal: { label: 'Exclusivo',     color: 'bg-purple-900/60 text-purple-300' },
  bancaria: { label: '🏦 Banco -20%', color: 'bg-red-900/60 text-red-300' },
  alquiler: { label: '🏖️ Turístico',  color: 'bg-green-900/60 text-green-300' },
}

export default function PropertyCard({ property }: { property: any }) {
  const badge = CHANNEL_BADGE[property.channel] || CHANNEL_BADGE.exp
  const isExp = property.channel === 'exp'
  const expUrl = `https://www.expglobalspain.com?ref=360group&agent=${process.env.NEXT_PUBLIC_EXP_AGENT_ID || ''}`
  const waText = encodeURIComponent(`Hola, me interesa la propiedad: ${property.title} (€${Number(property.price).toLocaleString('es-ES')})`)
  const waUrl = `https://wa.me/${(process.env.AGENT_WHATSAPP || '34600000000').replace(/\D/g, '')}?text=${waText}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3 }}
      className="card overflow-hidden group"
    >
      <div className="relative h-52 overflow-hidden">
        <img
          src={property.main_image || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800'}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute top-3 left-3">
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${badge.color}`}>
            {badge.label}
          </span>
        </div>
        <div className="absolute top-3 right-3 bg-[#C9A84C] text-[#0A0A0A] text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
          <TrendingUp size={10} /> {property.estimated_roi}%
        </div>
      </div>

      <div className="p-5">
        <h3 className="font-playfair font-bold text-base mb-1 line-clamp-1">{property.title}</h3>
        <p className="text-gray-500 text-sm mb-3">📍 {property.location}</p>

        <div className="flex gap-4 text-sm text-gray-500 mb-4">
          <span className="flex items-center gap-1"><Bed size={13} /> {property.bedrooms}</span>
          <span className="flex items-center gap-1"><Bath size={13} /> {property.bathrooms}</span>
          <span className="flex items-center gap-1"><Maximize2 size={13} /> {property.area_sqm}m²</span>
        </div>

        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="text-xl font-bold gold-text">
              €{Number(property.price).toLocaleString('es-ES')}
            </div>
            {property.yearly_rent && (
              <div className="text-xs text-gray-500">
                ~€{Number(property.yearly_rent).toLocaleString('es-ES')}/año
              </div>
            )}
          </div>
        </div>

        <a
          href={isExp ? expUrl : waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary w-full text-center text-sm py-2.5 block rounded-lg"
        >
          {isExp ? 'Ver en eXp Realty →' : 'Contactar por WhatsApp →'}
        </a>
      </div>
    </motion.div>
  )
}
