'use client'
import { motion } from 'framer-motion'
import { Bed, Bath, Maximize2, MapPin, MessageCircle } from 'lucide-react'

const CHANNEL_LABEL: Record<string, string> = {
  exp:      'Disponible',
  personal: 'Exclusiva',
  bancaria: 'Bancaria',
  alquiler: 'Turístico',
}

export default function PropertyCard({ property }: { property: any }) {
  const label = CHANNEL_LABEL[property.channel] || 'Disponible'
  const waText = encodeURIComponent(`Hola, me interesa la propiedad: ${property.title} (€${Number(property.price).toLocaleString('es-ES')})`)
  const agentPhone = (process.env.NEXT_PUBLIC_AGENT_WHATSAPP || '34XXXXXXXXX').replace(/\D/g, '')
  const waUrl = `https://wa.me/${agentPhone}?text=${waText}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="card overflow-hidden group"
    >
      {/* Image */}
      <div className="relative h-60 overflow-hidden">
        <img
          src={property.main_image || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800'}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
        <div className="absolute top-4 left-4">
          <span className="text-xs px-3 py-1.5 bg-black/35 backdrop-blur-sm border border-white/12 text-white/85 rounded-full font-medium">
            {label}
          </span>
        </div>
        {property.estimated_roi && (
          <div className="absolute top-4 right-4 bg-[#C9A84C] text-[#0F1419] text-xs font-bold px-2.5 py-1 rounded-full">
            {property.estimated_roi}% ROI
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0">
            <div className="font-playfair text-xl font-bold gold-text leading-none mb-1.5">
              €{Number(property.price).toLocaleString('es-ES')}
            </div>
            <h3 className="font-semibold text-sm text-white line-clamp-1">{property.title}</h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[#8B96A5] text-xs mb-4">
          <MapPin size={11} className="shrink-0" />
          <span className="truncate">{property.location}</span>
        </div>

        <div className="flex gap-5 text-xs text-[#8B96A5] pt-4 border-t border-white/5 mb-4">
          {property.bedrooms && <span className="flex items-center gap-1.5"><Bed size={12} /> {property.bedrooms}</span>}
          {property.bathrooms && <span className="flex items-center gap-1.5"><Bath size={12} /> {property.bathrooms}</span>}
          {property.area_sqm && <span className="flex items-center gap-1.5"><Maximize2 size={12} /> {property.area_sqm}m²</span>}
        </div>

        <a href={waUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-[#1B7F6F]/10 border border-[#1B7F6F]/25 text-[#1B7F6F] text-sm font-medium hover:bg-[#1B7F6F]/20 transition-all">
          <MessageCircle size={14} />
          Contactar por WhatsApp
        </a>
      </div>
    </motion.div>
  )
}
