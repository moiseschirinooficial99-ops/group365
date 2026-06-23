'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PropertyCard from '@/components/cards/PropertyCard'

const FADE_UP = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

export default function AlquileresPage() {
  const [rentals, setRentals] = useState<any[]>([])
  const [loadingProps, setLoadingProps] = useState(true)
  const [form, setForm] = useState({ name: '', email: '', phone: '', guests: '', dates: '' })
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/properties')
      .then(r => r.json())
      .then((data: any[]) => setRentals(Array.isArray(data) ? data.filter(p => p.channel === 'alquiler') : []))
      .finally(() => setLoadingProps(false))
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, source: 'alquileres', message: `Alquiler: ${form.guests} personas, fechas: ${form.dates}` }),
      })
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main>
      <Header />

      <section className="relative min-h-[60vh] flex items-center justify-center pt-16">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1800" alt="alquileres" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/70 to-[#0A0A0A]" />
        </div>
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <motion.div initial="hidden" animate="show" variants={FADE_UP}>
            <span className="inline-block text-[#1B7F6F] text-xs font-semibold tracking-[0.4em] uppercase mb-6 border border-[#1B7F6F]/30 px-4 py-1.5 rounded-full">
              Alquileres Turísticos Premium
            </span>
            <h1 className="font-playfair text-5xl md:text-6xl font-bold mb-6">
              Villas Exclusivas<br /><span className="gold-text">En España</span>
            </h1>
            <p className="text-gray-300 text-lg mb-8">
              Residencias de lujo con gestión completa. Alta ocupación garantizada.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <motion.div initial="hidden" whileInView="show" variants={FADE_UP} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="font-playfair text-4xl font-bold mb-3">Cartera de Activos</h2>
            <p className="text-gray-500">Gestión completa, rentabilidad neta estimada al máximo</p>
          </motion.div>
          {loadingProps ? (
            <div className="grid md:grid-cols-3 gap-6 mb-16">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="card h-80 animate-pulse bg-white/5 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6 mb-16">
              {rentals.length > 0
                ? rentals.map(p => <PropertyCard key={p.id} property={p} />)
                : <p className="col-span-3 text-center py-12 text-[#8B96A5]">No hay propiedades de alquiler disponibles por el momento.</p>
              }
            </div>
          )}

          <div className="max-w-lg mx-auto">
            <motion.div initial="hidden" whileInView="show" variants={FADE_UP} viewport={{ once: true }} className="text-center mb-8">
              <h2 className="font-playfair text-3xl font-bold mb-2">Solicitar disponibilidad</h2>
              <p className="text-gray-500 text-sm">Te confirmamos fechas en menos de 2 horas</p>
            </motion.div>

            {sent ? (
              <div className="card p-10 text-center">
                <div className="w-14 h-14 rounded-full bg-[#1B7F6F]/15 border border-[#1B7F6F]/30 flex items-center justify-center mx-auto mb-5">
                  <span className="text-[#1B7F6F] text-2xl font-bold">✓</span>
                </div>
                <h3 className="font-playfair text-2xl font-bold mb-2">Solicitud recibida</h3>
                <p className="text-[#8B96A5]">Te contactamos en menos de 2 horas.</p>
              </div>
            ) : (
              <form onSubmit={submit} className="card p-8 space-y-4">
                <input className="input" placeholder="Tu nombre" required
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                <input className="input" type="email" placeholder="Email" required
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                <input className="input" type="tel" placeholder="WhatsApp (+34...)"
                  value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                <input className="input" type="number" placeholder="Capacidad de huéspedes"
                  value={form.guests} onChange={e => setForm({ ...form, guests: e.target.value })} />
                <input className="input" placeholder="Check-in / Check-out (ej: 15-22 agosto)"
                  value={form.dates} onChange={e => setForm({ ...form, dates: e.target.value })} />
                <button type="submit" disabled={loading} className="btn-primary w-full py-4">
                  {loading ? 'Enviando...' : 'Solicitar disponibilidad →'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
