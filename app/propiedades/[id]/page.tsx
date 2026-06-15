'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Bed, Bath, Maximize2, MapPin, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'

function AvailabilityCalendar({ propertyId }: { propertyId: string }) {
  const [bookings, setBookings] = useState<any[]>([])
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    fetch(`/api/rental-availability?property_id=${propertyId}`)
      .then(r => r.json()).then(d => setBookings(Array.isArray(d) ? d : []))
  }, [propertyId])

  const getStatus = (dateStr: string) => {
    for (const b of bookings) {
      if (dateStr >= b.date_start && dateStr < b.date_end) return b.status
    }
    return 'available'
  }

  const months = [0, 1].map(i => {
    const d = new Date()
    d.setMonth(d.getMonth() + offset + i)
    d.setDate(1)
    const first = d.getDay() === 0 ? 6 : d.getDay() - 1
    const days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
    return { year: d.getFullYear(), month: d.getMonth(), first, days, label: d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) }
  })

  return (
    <div className="card p-6">
      <h3 className="font-playfair text-lg font-bold mb-5">Disponibilidad</h3>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setOffset(o => o - 2)} disabled={offset <= 0} className="p-2 text-[#8B96A5] hover:text-white disabled:opacity-30 transition-colors"><ChevronLeft size={16} /></button>
        <div className="flex gap-3 text-xs text-[#8B96A5]">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-500/50 inline-block" /> Disponible</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500/60 inline-block" /> Ocupado</span>
        </div>
        <button onClick={() => setOffset(o => o + 2)} className="p-2 text-[#8B96A5] hover:text-white transition-colors"><ChevronRight size={16} /></button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {months.map(({ year, month, first, days, label }) => {
          const cells = Array(first).fill(null).concat(Array.from({ length: days }, (_, i) => i + 1))
          return (
            <div key={`${year}-${month}`}>
              <p className="text-white text-sm font-medium text-center mb-3 capitalize">{label}</p>
              <div className="grid grid-cols-7 gap-1 text-xs">
                {['L','M','X','J','V','S','D'].map(d => <div key={d} className="text-center text-[#8B96A5] pb-2 text-[10px]">{d}</div>)}
                {cells.map((day, i) => {
                  if (!day) return <div key={`e-${i}`} />
                  const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
                  const isPast = dateStr < new Date().toISOString().split('T')[0]
                  const st = isPast ? 'past' : getStatus(dateStr)
                  return (
                    <div key={dateStr} className={`aspect-square flex items-center justify-center rounded text-[11px] font-medium
                      ${isPast ? 'text-white/20 bg-transparent' : st === 'available' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/30 text-red-300'}`}>
                      {day}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 pt-5 border-t border-white/5 text-center space-y-2">
        <p className="text-[#8B96A5] text-sm">Para reservar o consultar disponibilidad:</p>
        <p className="text-white text-sm">📱 WhatsApp: <span className="text-[#C9A84C]">+34 611 25 18 18</span> · 📧 rentalaya360@gmail.com</p>
        <a href="https://wa.me/34611251818?text=Hola, quiero consultar disponibilidad de esta propiedad de alquiler."
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-3 bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-[#25D366]/20 transition-all">
          <MessageCircle size={15} /> Consultar Disponibilidad en WhatsApp
        </a>
      </div>
    </div>
  )
}

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [property, setProperty] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mainImg, setMainImg] = useState(0)

  useEffect(() => {
    fetch('/api/properties')
      .then(r => r.json())
      .then((data: any[]) => {
        const p = data.find(p => p.id === id)
        setProperty(p || null)
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <main className="min-h-screen bg-[#0F1419]">
      <Header />
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-[#C9A84C] font-playfair animate-pulse">Cargando...</div>
      </div>
    </main>
  )

  if (!property) return (
    <main className="min-h-screen bg-[#0F1419]">
      <Header />
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-[#8B96A5]">Propiedad no encontrada.</p>
        <Link href="/compras" className="btn-primary text-sm px-4 py-2">← Ver propiedades</Link>
      </div>
    </main>
  )

  const images: string[] = property.images?.length ? property.images : [property.main_image].filter(Boolean)
  const waText = encodeURIComponent(`Hola, me interesa la propiedad: ${property.title}`)
  const isRental = property.channel === 'alquiler'

  return (
    <main className="min-h-screen bg-[#0F1419]">
      <Header />

      <div className="max-w-5xl mx-auto px-4 pt-24 pb-16">
        <Link href={isRental ? '/alquileres' : '/compras'} className="text-[#8B96A5] text-sm hover:text-white transition-colors flex items-center gap-1 mb-6">
          <ChevronLeft size={14} /> Volver
        </Link>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Galería */}
          <div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative aspect-[4/3] rounded-xl overflow-hidden mb-3">
              <img src={images[mainImg] || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800'} alt={property.title} className="w-full h-full object-cover" />
              {images.length > 1 && (
                <>
                  <button onClick={() => setMainImg(i => (i - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"><ChevronLeft size={16} className="text-white" /></button>
                  <button onClick={() => setMainImg(i => (i + 1) % images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"><ChevronRight size={16} className="text-white" /></button>
                  <span className="absolute bottom-3 right-3 text-xs bg-black/60 text-white px-2 py-1 rounded">{mainImg + 1}/{images.length}</span>
                </>
              )}
            </motion.div>
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {images.slice(0, 10).map((img, i) => (
                  <button key={i} onClick={() => setMainImg(i)} className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${mainImg === i ? 'border-[#C9A84C]' : 'border-transparent'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs px-3 py-1 rounded-full bg-[#1B7F6F]/15 border border-[#1B7F6F]/30 text-[#1B7F6F] font-medium capitalize">
                  {property.channel === 'alquiler' ? 'Alquiler Turístico' : property.channel === 'bancaria' ? 'Oportunidad Bancaria' : 'Venta'}
                </span>
              </div>

              <h1 className="font-playfair text-2xl lg:text-3xl font-bold text-white mb-3">{property.title}</h1>

              <div className="flex items-center gap-1.5 text-[#8B96A5] text-sm mb-5">
                <MapPin size={14} /><span>{property.location}</span>
              </div>

              <div className="font-playfair text-3xl font-bold gold-text mb-5">
                {Number(property.price) > 0 ? `€${Number(property.price).toLocaleString('es-ES')}` : 'Precio a consultar'}
                {property.price_per_night && <span className="text-[#8B96A5] text-base ml-2 font-sans font-normal">/ noche</span>}
              </div>

              <div className="flex gap-6 text-sm text-[#8B96A5] mb-6 pb-6 border-b border-white/5">
                {property.bedrooms && <span className="flex items-center gap-1.5"><Bed size={14} /> {property.bedrooms} hab.</span>}
                {property.bathrooms && <span className="flex items-center gap-1.5"><Bath size={14} /> {property.bathrooms} baños</span>}
                {property.area_sqm && <span className="flex items-center gap-1.5"><Maximize2 size={14} /> {property.area_sqm}m²</span>}
              </div>

              {property.description && (
                <div className="text-[#8B96A5] text-sm leading-relaxed mb-6 whitespace-pre-line">{property.description}</div>
              )}

              <a href={`https://wa.me/34611251818?text=${waText}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-[#1B7F6F]/10 border border-[#1B7F6F]/25 text-[#1B7F6F] font-medium hover:bg-[#1B7F6F]/20 transition-all">
                <MessageCircle size={16} /> Contactar por WhatsApp
              </a>
            </motion.div>
          </div>
        </div>

        {/* Calendario de disponibilidad (solo alquileres) */}
        {isRental && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-10">
            <AvailabilityCalendar propertyId={property.id} />
          </motion.div>
        )}
      </div>

      {/* Botón flotante móvil */}
      <div className="fixed bottom-6 right-6 z-40 md:hidden">
        <a href={`https://wa.me/34611251818?text=${waText}`} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 bg-[#25D366] text-white text-sm font-medium px-4 py-3 rounded-full shadow-lg">
          <MessageCircle size={16} /> Consultar
        </a>
      </div>

      <Footer />
    </main>
  )
}
