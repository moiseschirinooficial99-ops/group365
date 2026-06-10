'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PropertyCard from '@/components/cards/PropertyCard'

const FADE_UP = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

const STAGGER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
}

const STATS = [
  { value: '500+', label: 'Agentes eXp España' },
  { value: '€2.4M', label: 'Propiedades gestionadas' },
  { value: '4-6%', label: 'ROI anual garantizado' },
  { value: '<2h', label: 'Respuesta garantizada' },
]

const SERVICES = [
  {
    icon: '🏖️', title: 'Alquileres Turísticos',
    desc: 'Villas exclusivas en España. Alta ocupación y retorno vacacional.',
    href: '/alquileres',
    features: ['Disponibilidad en tiempo real', 'Gestión completa', 'Hasta 12 personas'],
  },
  {
    icon: '🏠', title: 'Compra tu Propiedad',
    desc: 'Cartera eXp, propiedades bancarias y exclusivos off-market.',
    href: '/compras',
    features: ['Cartera eXp Realty global', 'Bancarias -20% mercado', 'Off-market exclusivas'],
  },
  {
    icon: '💰', title: 'Inversión Premium',
    desc: 'ROI del 4-6% anual. Oportunidades que no llegan al mercado.',
    href: '/inversores',
    features: ['Dashboard personalizado', 'Análisis de rentabilidad', 'Alertas exclusivas'],
  },
]

const PROPERTIES = [
  { id: '1', title: 'Villa Exclusiva Marbella', price: 650000, location: 'Marbella, Costa del Sol', bedrooms: 5, bathrooms: 4, area_sqm: 380, estimated_roi: 6.0, yearly_rent: 39000, channel: 'personal', main_image: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800' },
  { id: '2', title: 'Apartamento Premium Madrid', price: 480000, location: 'Madrid, Salamanca', bedrooms: 3, bathrooms: 2, area_sqm: 145, estimated_roi: 5.0, yearly_rent: 24000, channel: 'exp', main_image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800' },
  { id: '3', title: 'Villa Turística Costa del Sol', price: 380000, location: 'Estepona, Málaga', bedrooms: 4, bathrooms: 3, area_sqm: 250, estimated_roi: 6.0, yearly_rent: 22800, channel: 'alquiler', main_image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800' },
]

const TESTIMONIALS = [
  { name: 'Carlos M.', location: 'Madrid', text: 'Invertí €180.000 en Madrid y obtengo €750/mes. El proceso fue completamente transparente.', roi: '5%', initials: 'CM' },
  { name: 'Ana García', location: 'Valencia', text: 'Encontré mi villa ideal en la Costa del Sol. Atención excepcional y gestión impecable.', roi: '6%', initials: 'AG' },
  { name: 'Roberto L.', location: 'Barcelona', text: 'La propiedad bancaria que compramos estaba 20% por debajo del precio de mercado.', roi: '5.7%', initials: 'RL' },
]

export default function HomePage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', type: 'inversion' })
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, source: 'landing' }),
      })
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main>
      <Header />

      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1800"
            alt="hero"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/75 via-[#0A0A0A]/60 to-[#0A0A0A]" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.div variants={STAGGER} initial="hidden" animate="show">
            <motion.div variants={FADE_UP}>
              <span className="inline-block text-[#1B7F6F] text-xs font-semibold tracking-[0.4em] uppercase mb-6 border border-[#1B7F6F]/30 px-4 py-1.5 rounded-full">
                GROUP 360 INICIATIVAS · eXp Realty España
              </span>
            </motion.div>

            <motion.h1 variants={FADE_UP} className="font-playfair text-5xl md:text-7xl font-bold leading-tight mb-6">
              Visión 360° del<br />
              <span className="gold-text">Mercado Inmobiliario</span>
            </motion.h1>

            <motion.p variants={FADE_UP} className="text-lg text-gray-300 mb-10 max-w-xl mx-auto">
              Alquileres turísticos, compras exclusivas e inversiones con ROI garantizado del 4-6% anual en España.
            </motion.p>

            <motion.div variants={FADE_UP} className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/inversores" className="btn-primary text-base px-8 py-3.5">
                💰 Quiero Invertir
              </Link>
              <Link href="/compras" className="btn-outline text-base px-8 py-3.5">
                🏠 Ver Propiedades
              </Link>
              <Link href="/alquileres" className="btn-outline text-base px-8 py-3.5">
                🏖️ Alquilar Villa
              </Link>
            </motion.div>
          </motion.div>
        </div>

        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <div className="w-5 h-8 border-2 border-[#C9A84C]/40 rounded-full flex justify-center pt-1.5">
            <div className="w-0.5 h-2 bg-[#C9A84C]/60 rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* STATS */}
      <section className="py-12 bg-[#111827] border-y border-[#C9A84C]/10">
        <div className="container">
          <motion.div
            variants={STAGGER} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center"
          >
            {STATS.map((s, i) => (
              <motion.div key={i} variants={FADE_UP}>
                <div className="font-playfair text-3xl font-bold gold-text">{s.value}</div>
                <div className="text-gray-500 text-sm mt-1">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* SERVICIOS */}
      <section className="section">
        <div className="container">
          <motion.div
            initial="hidden" whileInView="show" variants={FADE_UP} viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="font-playfair text-4xl font-bold mb-3">¿Qué buscas?</h2>
            <p className="text-gray-500">Tres caminos hacia tu propiedad ideal</p>
          </motion.div>

          <motion.div
            variants={STAGGER} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-6"
          >
            {SERVICES.map((s, i) => (
              <motion.div key={i} variants={FADE_UP} className="card p-8 hover:-translate-y-2 transition-transform duration-300">
                <div className="text-4xl mb-5">{s.icon}</div>
                <h3 className="font-playfair text-xl font-bold mb-3">{s.title}</h3>
                <p className="text-gray-400 text-sm mb-5">{s.desc}</p>
                <ul className="space-y-2 mb-7">
                  {s.features.map((f, j) => (
                    <li key={j} className="text-sm text-gray-400 flex items-center gap-2">
                      <span className="text-[#C9A84C] text-xs">✦</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href={s.href} className="btn-primary block text-center text-sm">
                  Explorar →
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* PROPIEDADES */}
      <section className="section bg-[#111827]/50">
        <div className="container">
          <motion.div
            initial="hidden" whileInView="show" variants={FADE_UP} viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="font-playfair text-4xl font-bold mb-3">Propiedades Destacadas</h2>
            <p className="text-gray-500">Selección exclusiva del mes</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {PROPERTIES.map(p => <PropertyCard key={p.id} property={p} />)}
          </div>
          <div className="text-center mt-10">
            <Link href="/compras" className="btn-outline px-10 py-3">
              Ver todas las propiedades →
            </Link>
          </div>
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section className="section">
        <div className="container">
          <motion.div
            initial="hidden" whileInView="show" variants={FADE_UP} viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="font-playfair text-4xl font-bold mb-3">Resultados Reales</h2>
          </motion.div>
          <motion.div
            variants={STAGGER} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-6"
          >
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={i} variants={FADE_UP} className="card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-full bg-[#1B7F6F] flex items-center justify-center font-bold text-sm">
                    {t.initials}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.location}</div>
                  </div>
                  <div className="ml-auto gold-text font-bold text-sm">{t.roi} ROI</div>
                </div>
                <p className="text-gray-400 text-sm italic">"{t.text}"</p>
                <div className="text-[#C9A84C] mt-3 text-xs">⭐⭐⭐⭐⭐</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CONTACTO */}
      <section className="section bg-[#111827]/50">
        <div className="max-w-lg mx-auto">
          <motion.div
            initial="hidden" whileInView="show" variants={FADE_UP} viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="font-playfair text-4xl font-bold mb-3">¿Listo para empezar?</h2>
            <p className="text-gray-500">Te contactamos en menos de 2 horas</p>
          </motion.div>

          {sent ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="card p-10 text-center"
            >
              <div className="text-5xl mb-4">✅</div>
              <h3 className="font-playfair text-2xl font-bold mb-2">¡Recibido!</h3>
              <p className="text-gray-400">Te contactamos en menos de 2 horas por WhatsApp.</p>
            </motion.div>
          ) : (
            <form onSubmit={submit} className="card p-8 space-y-4">
              <input className="input" placeholder="Tu nombre completo" required
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <input className="input" type="email" placeholder="Email" required
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              <input className="input" type="tel" placeholder="WhatsApp (+34...)"
                value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              <select className="input"
                value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="inversion">💰 Quiero invertir</option>
                <option value="compra">🏠 Quiero comprar</option>
                <option value="alquiler">🏖️ Quiero alquilar</option>
                <option value="bancaria">🏦 Propiedad bancaria</option>
              </select>
              <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-base">
                {loading ? 'Enviando...' : 'Que me contacten ahora →'}
              </button>
            </form>
          )}

          <div className="text-center mt-6">
            <a href="https://wa.me/34600000000?text=Hola, me interesa una propiedad de 360GROUP"
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-green-600 hover:bg-green-500 text-white font-semibold px-8 py-3.5 rounded-lg transition-colors">
              <span className="text-xl">💬</span> Contactar por WhatsApp
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
