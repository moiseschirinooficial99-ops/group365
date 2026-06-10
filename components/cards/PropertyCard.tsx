'use client'
import { motion } from 'framer-motion'
import { Bed, Bath, Maximize2, MapPin, ArrowRight } from 'lucide-react'

const CHANNEL_LABEL: Record<string, string> = {
  exp:      'Disponible',
  personal: 'Villa',
  bancaria: 'Bancaria',
  alquiler: 'Turístico',
}

export default function PropertyCard({ property }: { property: any }) {
  const label = CHANNEL_LABEL[property.channel] || 'Disponible'
  const waText = encodeURIComponent(`Hola, me interesa la propiedad: ${property.title} (€${Number(property.price).toLocaleString('es-ES')})`)
  const waUrl = `https://wa.me/${(process.env.AGENT_WHATSAPP || '34600000000').replace(/\D/g, '')}?text=${waText}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="card overflow-hidden group"
    >
      <a href={waUrl} target="_blank" rel="noopener noreferrer" className="block">
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
            <div className="w-9 h-9 rounded-full border border-[#C9A84C]/25 flex items-center justify-center shrink-0 group-hover:bg-[#C9A84C] group-hover:border-[#C9A84C] transition-all duration-300">
              <ArrowRight size={14} className="text-[#C9A84C] group-hover:text-[#0F1419] transition-colors" />
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[#8B96A5] text-xs mb-4">
            <MapPin size={11} className="shrink-0" />
            <span className="truncate">{property.location}</span>
          </div>

          <div className="flex gap-5 text-xs text-[#8B96A5] pt-4 border-t border-white/5">
            <span className="flex items-center gap-1.5"><Bed size={12} /> {property.bedrooms}</span>
            <span className="flex items-center gap-1.5"><Bath size={12} /> {property.bathrooms}</span>
            <span className="flex items-center gap-1.5"><Maximize2 size={12} /> {property.area_sqm}m²</span>
          </div>
        </div>
      </a>
    </motion.div>
  )
}
