'use client'
import { motion } from 'framer-motion'
import { Bed, Bath, Maximize2, MapPin } from 'lucide-react'

const CHANNEL_LABEL: Record<string, string> = {
  exp:      'eXp Realty',
  personal: 'Exclusivo',
  bancaria: 'Bancaria',
  alquiler: 'Turístico',
}

export default function PropertyCard({ property }: { property: any }) {
  const label = CHANNEL_LABEL[property.channel] || 'eXp Realty'
  const isExp = property.channel === 'exp'
  const expUrl = `https://www.expglobalspain.com?ref=360group&agent=${process.env.NEXT_PUBLIC_EXP_AGENT_ID || ''}`
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
      <div className="relative h-56 overflow-hidden">
        <img
          src={property.main_image || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800'}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute top-4 left-4">
          <span className="text-xs px-2.5 py-1 bg-black/40 backdrop-blur-sm border border-white/10 text-white/80 rounded-full">
            {label}
          </span>
        </div>
        {property.estimated_roi && (
          <div className="absolute top-4 right-4 bg-[#C9A84C] text-[#0F1419] text-xs font-bold px-2.5 py-1 rounded-full">
            {property.estimated_roi}% ROI
          </div>
        )}
        <div className="absolute bottom-4 left-4">
          <div className="font-playfair text-xl font-bold text-white">
            €{Number(property.price).toLocaleString('es-ES')}
          </div>
          {property.yearly_rent && (
            <div className="text-xs text-white/60 mt-0.5">
              ~€{Number(property.yearly_rent).toLocaleString('es-ES')}/año
            </div>
          )}
        </div>
      </div>

      <div className="p-5">
        <h3 className="font-playfair font-bold text-base mb-2 line-clamp-1">{property.title}</h3>
        <div className="flex items-center gap-1.5 text-[#8B96A5] text-sm mb-4">
          <MapPin size={12} />
          <span>{property.location}</span>
        </div>

        <div className="flex gap-5 text-sm text-[#8B96A5] mb-5 pb-4 border-b border-white/5">
          <span className="flex items-center gap-1.5"><Bed size={13} /> {property.bedrooms}</span>
          <span className="flex items-center gap-1.5"><Bath size={13} /> {property.bathrooms}</span>
          <span className="flex items-center gap-1.5"><Maximize2 size={13} /> {property.area_sqm}m²</span>
        </div>

        <a
          href={isExp ? expUrl : waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline w-full text-center text-xs py-2.5 block"
        >
          {isExp ? 'Ver en eXp Realty' : 'Contactar'}
        </a>
      </div>
    </motion.div>
  )
}
