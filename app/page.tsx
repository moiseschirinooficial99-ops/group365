'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { MapPin, Home, DollarSign, Search, ChevronDown } from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PropertyCard from '@/components/cards/PropertyCard'

const FADE_UP = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] } },
}

const STAGGER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

const STATS = [
  { value: '10K+', label: 'Clientes Satisfechos' },
  { value: '500+', label: 'Propiedades Gestionadas' },
  { value: '€2.4M', label: 'Cartera Activa' },
  { value: '4-6%', label: 'ROI Anual Medio' },
]

const SERVICES = [
  {
    title: 'Alquileres Turísticos',
    subtitle: 'La villa perfecta te espera',
    desc: 'Villas exclusivas en las mejores ubicaciones de España. Alta ocupación, gestión completa y retorno vacacional garantizado desde el primer mes.',
    features: ['Disponibilidad en tiempo real', 'Gestión integral incluida', 'Hasta 12 personas'],
    href: '/alquileres',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200',
  },
  {
    title: 'Compra tu Propiedad',
    subtitle: 'Acceso exclusivo al mejor mercado',
    desc: 'Cartera eXp Realty, propiedades bancarias con hasta un 20% de descuento y exclusivos off-market que no encontrarás en ningún portal público.',
    features: ['Red eXp Realty global', 'Bancarias -20% mercado', 'Off-market exclusivas'],
    href: '/compras',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200',
  },
  {
    title: 'Inversión Premium',
    subtitle: 'Haz crecer tu patrimonio',
    desc: 'ROI del 4-6% anual. Oportunidades seleccionadas que no llegan al mercado abierto, con análisis completo de rentabilidad y seguimiento personalizado.',
    features: ['Dashboard personalizado', 'Análisis de rentabilidad', 'Alertas exclusivas'],
    href: '/inversores',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200',
  },
]

const PROPERTIES = [
  { id: '1', title: 'Villa Exclusiva Marbella', price: 650000, location: 'Marbella, Costa del Sol', bedrooms: 5, bathrooms: 4, area_sqm: 380, estimated_roi: 6.0, yearly_rent: 39000, channel: 'personal', main_image: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800' },
  { id: '2', title: 'Apartamento Premium Madrid', price: 480000, location: 'Madrid, Salamanca', bedrooms: 3, bathrooms: 2, area_sqm: 145, estimated_roi: 5.0, yearly_rent: 24000, channel: 'exp', main_image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800' },
  { id: '3', title: 'Atico Frente al Mar', price: 890000, location: 'Barcelona, Barceloneta', bedrooms: 4, bathrooms: 3, area_sqm: 220, estimated_roi: 5.5, yearly_rent: 48900, channel: 'personal', main_image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800' },
  { id: '4', title: 'Villa Turistica Costa del Sol', price: 380000, location: 'Estepona, Malaga', bedrooms: 4, bathrooms: 3, area_sqm: 250, estimated_roi: 6.0, yearly_rent: 22800, channel: 'alquiler', main_image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800' },
]

const TESTIMONIALS = [
  {
    name: 'Carlos M.',
    location: 'Madrid',
    text: 'Invertí €180.000 en Madrid y obtengo €750 al mes. El proceso fue completamente transparente y el equipo siempre estuvo disponible.',
    roi: '5%',
  },
  {
    name: 'Ana García',
    location: 'Valencia',
    text: 'Encontré mi villa ideal en la Costa del Sol. Atención excepcional desde el primer contacto y una gestión verdaderamente impecable.',
    roi: '6%',
  },
  {
    name: 'Roberto L.',
    location: 'Barcelona',
    text: 'La propiedad bancaria que compramos estaba 20% por debajo del precio de mercado. Nadie más tenía acceso a esa operación.',
    roi: '5.7%',
  },
]

export default function HomePage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', type: 'inversion' })
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState({ location: '', type: '', price: '' })

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
    <main className="bg-[#0F1419]">
      <Header />

      {/* HERO */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1613977257592-4871e5fcd7c4?w=1920"
            alt="Propiedad premium"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0F1419]/55 via-[#0F1419]/45 to-[#0F1419]" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto w-full">
          <motion.div variants={STAGGER} initial="hidden" animate="show" className="space-y-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
              className="flex justify-center"
            >
              <motion.img
                src="/logo.png"
                alt="GROUP 360"
                width={200}
                height={200}
                animate={{
                  y: [0, -10, 0],
                  rotateY: [0, 5, 0, -5, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{
                  filter: 'drop-shadow(0 0 20px rgba(201,168,76,0.4))',
                  mixBlendMode: 'lighten',
                  width: 200,
                  height: 200,
                }}
                className="rounded-2xl"
              />
            </motion.div>

            <motion.p variants={FADE_UP}
              className="text-[#1B7F6F] text-xs font-semibold tracking-[0.5em] uppercase">
              GROUP 360 INICIATIVAS &middot; eXp Realty España
            </motion.p>

            <motion.h1 variants={FADE_UP} className="font-playfair font-bold leading-[0.92] text-white">
              <span className="block text-[clamp(3rem,9vw,96px)]">Visión 360°</span>
              <span className="block text-[clamp(2.5rem,7.5vw,82px)] text-[#C9A84C]">del Mercado</span>
              <span className="block text-[clamp(3rem,9vw,96px)]">Inmobiliario</span>
            </motion.h1>

            <motion.p variants={FADE_UP}
              className="text-gray-300 text-lg md:text-xl font-light max-w-2xl mx-auto pt-2">
              Alquileres turísticos, compras exclusivas e inversiones premium en España.
            </motion.p>
          </motion.div>

          {/* SEARCH BAR */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.7 }}
            className="mt-14 mx-auto max-w-3xl"
          >
            <div className="bg-white/8 backdrop-blur-md border border-white/12 rounded-2xl p-2 flex flex-col md:flex-row gap-2">
              <div className="flex-1 flex items-center gap-2 bg-white/5 rounded-xl px-4 py-3">
                <MapPin size={15} className="text-[#C9A84C] shrink-0" />
                <input
                  type="text"
                  placeholder="Ubicación"
                  className="bg-transparent text-white placeholder-white/35 text-sm w-full outline-none"
                  value={search.location}
                  onChange={e => setSearch({ ...search, location: e.target.value })}
                />
              </div>
              <div className="flex-1 flex items-center gap-2 bg-white/5 rounded-xl px-4 py-3">
                <Home size={15} className="text-[#C9A84C] shrink-0" />
                <select
                  className="bg-transparent text-white/50 text-sm w-full outline-none appearance-none cursor-pointer"
                  value={search.type}
                  onChange={e => setSearch({ ...search, type: e.target.value })}
                >
                  <option value="" className="bg-[#161D26]">Tipo de operación</option>
                  <option value="alquiler" className="bg-[#161D26]">Alquiler turístico</option>
                  <option value="compra" className="bg-[#161D26]">Compra</option>
                  <option value="inversion" className="bg-[#161D26]">Inversión</option>
                </select>
              </div>
              <div className="flex-1 flex items-center gap-2 bg-white/5 rounded-xl px-4 py-3">
                <DollarSign size={15} className="text-[#C9A84C] shrink-0" />
                <select
                  className="bg-transparent text-white/50 text-sm w-full outline-none appearance-none cursor-pointer"
                  value={search.price}
                  onChange={e => setSearch({ ...search, price: e.target.value })}
                >
                  <option value="" className="bg-[#161D26]">Precio máximo</option>
                  <option value="300000" className="bg-[#161D26]">Hasta €300.000</option>
                  <option value="600000" className="bg-[#161D26]">Hasta €600.000</option>
                  <option value="1000000" className="bg-[#161D26]">Hasta €1.000.000</option>
                  <option value="max" className="bg-[#161D26]">Sin límite</option>
                </select>
              </div>
              <Link href="/compras" className="btn-primary flex items-center justify-center gap-2 px-6 py-3 rounded-xl whitespace-nowrap text-sm">
                <Search size={15} />
                Buscar
              </Link>
            </div>
          </motion.div>
        </div>

        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
        >
          <ChevronDown size={22} className="text-white/25" />
        </motion.div>
      </section>

      {/* STATS */}
      <section className="py-16 px-4 border-y border-white/5">
        <div className="container">
          <motion.div
            variants={STAGGER} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
          >
            {STATS.map((s, i) => (
              <motion.div key={i} variants={FADE_UP}>
                <div className="font-playfair text-4xl font-bold gold-text mb-2">{s.value}</div>
                <div className="text-[#8B96A5] text-sm tracking-wide">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* SERVICIOS — ASIMÉTRICO */}
      <section className="py-28 px-4">
        <div className="container">
          <motion.div
            initial="hidden" whileInView="show" variants={FADE_UP} viewport={{ once: true }}
            className="mb-20"
          >
            <p className="text-[#1B7F6F] text-xs font-semibold tracking-[0.4em] uppercase mb-3">Nuestros Servicios</p>
            <h2 className="font-playfair text-4xl md:text-5xl font-bold">¿Qué buscas?</h2>
          </motion.div>

          <div className="space-y-28">
            {SERVICES.map((service, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="show"
                variants={STAGGER}
                viewport={{ once: true, margin: '-80px' }}
                className={`grid md:grid-cols-5 gap-0 items-center ${i % 2 === 1 ? 'direction-rtl' : ''}`}
              >
                <motion.div
                  variants={FADE_UP}
                  className={`md:col-span-3 relative h-[360px] md:h-[480px] overflow-hidden rounded-xl ${
                    i % 2 === 1 ? 'md:order-2' : ''
                  }`}
                >
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-${i % 2 === 1 ? 'l' : 'r'} from-transparent to-[#0F1419]/30`} />
                </motion.div>

                <motion.div
                  variants={FADE_UP}
                  className={`md:col-span-2 py-8 md:py-0 ${
                    i % 2 === 1
                      ? 'md:order-1 md:pr-14 md:pl-0'
                      : 'md:pl-14 md:pr-0'
                  }`}
                >
                  <p className="text-[#1B7F6F] text-xs tracking-[0.35em] uppercase mb-4">{service.subtitle}</p>
                  <h3 className="font-playfair text-3xl md:text-4xl font-bold mb-5">{service.title}</h3>
                  <p className="text-[#8B96A5] leading-relaxed mb-8">{service.desc}</p>
                  <ul className="space-y-3 mb-10">
                    {service.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-3 text-sm text-gray-300">
                        <span className="w-px h-4 bg-[#C9A84C] shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href={service.href} className="btn-primary inline-flex items-center gap-2 text-sm">
                    Explorar servicio
                  </Link>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PROPIEDADES DESTACADAS */}
      <section className="py-24 px-4 bg-[#161D26]/40">
        <div className="container">
          <motion.div
            initial="hidden" whileInView="show" variants={STAGGER} viewport={{ once: true }}
            className="flex items-end justify-between mb-14"
          >
            <motion.div variants={FADE_UP}>
              <p className="text-[#1B7F6F] text-xs font-semibold tracking-[0.4em] uppercase mb-3">Cartera Exclusiva</p>
              <h2 className="font-playfair text-4xl md:text-5xl font-bold">Propiedades Destacadas</h2>
            </motion.div>
            <motion.div variants={FADE_UP} className="hidden md:block">
              <Link href="/compras" className="btn-outline text-sm">
                Ver todas
              </Link>
            </motion.div>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PROPERTIES.map(p => <PropertyCard key={p.id} property={p} />)}
          </div>

          <div className="text-center mt-10 md:hidden">
            <Link href="/compras" className="btn-outline text-sm px-8 py-3 inline-block">
              Ver todas las propiedades
            </Link>
          </div>
        </div>
      </section>

      {/* SOBRE NOSOTROS */}
      <section className="py-28 px-4">
        <div className="container">
          <motion.div
            initial="hidden" whileInView="show" variants={STAGGER} viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-20 items-center"
          >
            <motion.div variants={FADE_UP} className="relative">
              <div className="aspect-[4/3] rounded-xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=1200"
                  alt="Equipo GROUP 360"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-5 -right-5 bg-[#1B7F6F] text-white p-6 rounded-xl shadow-2xl hidden md:block">
                <div className="font-playfair text-3xl font-bold">15+</div>
                <div className="text-sm opacity-80 mt-1">años de experiencia</div>
              </div>
            </motion.div>

            <motion.div variants={FADE_UP}>
              <p className="text-[#1B7F6F] text-xs font-semibold tracking-[0.4em] uppercase mb-4">Sobre Nosotros</p>
              <h2 className="font-playfair text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Expertos en el mercado<br />
                <span className="gold-text">inmobiliario español</span>
              </h2>
              <p className="text-[#8B96A5] leading-relaxed mb-10 text-base">
                Somos una agencia premium integrada en la red eXp Realty, la mayor inmobiliaria del mundo.
                Combinamos tecnología, acceso exclusivo y atención personalizada para ofrecerte las mejores
                oportunidades del mercado.
              </p>
              <div className="grid grid-cols-2 gap-6 mb-10">
                {[
                  { value: '10K+', label: 'Clientes atendidos' },
                  { value: '500+', label: 'Propiedades gestionadas' },
                  { value: '€50M+', label: 'En transacciones' },
                  { value: '<2h', label: 'Tiempo de respuesta' },
                ].map((stat, i) => (
                  <div key={i} className="border-l border-[#C9A84C]/25 pl-4">
                    <div className="font-playfair text-2xl font-bold gold-text">{stat.value}</div>
                    <div className="text-[#8B96A5] text-xs mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
              <Link href="/inversores" className="btn-primary inline-flex items-center gap-2 text-sm">
                Conocer más
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section className="py-24 px-4 bg-[#161D26]/40">
        <div className="container">
          <motion.div
            initial="hidden" whileInView="show" variants={FADE_UP} viewport={{ once: true }}
            className="mb-16"
          >
            <p className="text-[#1B7F6F] text-xs font-semibold tracking-[0.4em] uppercase mb-3">Testimonios</p>
            <h2 className="font-playfair text-4xl md:text-5xl font-bold">Resultados Reales</h2>
          </motion.div>

          <motion.div
            variants={STAGGER} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8"
          >
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={i} variants={FADE_UP} className="card p-8 relative overflow-hidden">
                <div className="font-playfair text-[120px] text-[#C9A84C]/8 leading-none absolute -top-2 left-4 select-none pointer-events-none">
                  "
                </div>
                <div className="relative z-10">
                  <div className="inline-block bg-[#C9A84C]/10 border border-[#C9A84C]/20 text-[#C9A84C] text-xs font-bold px-3 py-1 rounded-full mb-6">
                    ROI {t.roi}
                  </div>
                  <p className="text-gray-300 leading-relaxed mb-8 text-sm">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div className="border-t border-white/5 pt-5">
                    <div className="font-semibold text-sm text-white">{t.name}</div>
                    <div className="text-[#8B96A5] text-xs mt-0.5">{t.location}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="relative py-40 px-4 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1800"
            alt="Encuentra tu propiedad ideal"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-[#0F1419]/72" />
        </div>
        <div className="relative z-10 text-center max-w-2xl mx-auto">
          <motion.div
            initial="hidden" whileInView="show" variants={STAGGER} viewport={{ once: true }}
          >
            <motion.p variants={FADE_UP}
              className="text-[#1B7F6F] text-xs font-semibold tracking-[0.5em] uppercase mb-5">
              Empieza hoy
            </motion.p>
            <motion.h2 variants={FADE_UP} className="font-playfair text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Encuentra tu<br />
              <span className="gold-text">propiedad ideal</span>
            </motion.h2>
            <motion.p variants={FADE_UP} className="text-gray-300 mb-12 text-lg font-light">
              Te contactamos en menos de 2 horas.
            </motion.p>
            <motion.div variants={FADE_UP} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/compras" className="btn-primary text-base px-10 py-4">
                Ver propiedades
              </Link>
              <Link href="/inversores/register" className="btn-outline text-base px-10 py-4">
                Área de inversores
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CONTACTO */}
      <section className="section bg-[#161D26]/40">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-16 items-start max-w-5xl mx-auto">
            <motion.div
              initial="hidden" whileInView="show" variants={STAGGER} viewport={{ once: true }}
            >
              <motion.p variants={FADE_UP} className="text-[#1B7F6F] text-xs font-semibold tracking-[0.4em] uppercase mb-3">
                Contacto
              </motion.p>
              <motion.h2 variants={FADE_UP} className="font-playfair text-4xl font-bold mb-6">Hablemos</motion.h2>
              <motion.p variants={FADE_UP} className="text-[#8B96A5] leading-relaxed mb-10">
                Nuestro equipo responde en menos de 2 horas.
                Cuéntanos qué buscas y encontraremos la mejor opción para ti.
              </motion.p>
              <motion.div variants={FADE_UP} className="space-y-5">
                <a href="https://wa.me/34600000000" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-lg bg-[#1B7F6F]/10 border border-[#1B7F6F]/20 flex items-center justify-center">
                    <span className="text-[#1B7F6F] text-xs font-bold">WA</span>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#8B96A5] uppercase tracking-widest">WhatsApp</div>
                    <div className="text-sm text-white group-hover:text-[#C9A84C] transition-colors">+34 600 000 000</div>
                  </div>
                </a>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#1B7F6F]/10 border border-[#1B7F6F]/20 flex items-center justify-center">
                    <span className="text-[#1B7F6F] text-xs font-bold">@</span>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#8B96A5] uppercase tracking-widest">Email</div>
                    <div className="text-sm text-white">info@group360.es</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            <motion.div initial="hidden" whileInView="show" variants={FADE_UP} viewport={{ once: true }}>
              {sent ? (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="card p-10 text-center flex flex-col items-center justify-center min-h-[320px]"
                >
                  <div className="w-14 h-14 rounded-full bg-[#1B7F6F]/15 border border-[#1B7F6F]/30 flex items-center justify-center mb-5">
                    <span className="text-[#1B7F6F] text-xl font-bold">✓</span>
                  </div>
                  <h3 className="font-playfair text-2xl font-bold mb-3">Mensaje recibido</h3>
                  <p className="text-[#8B96A5]">Te contactamos en menos de 2 horas por WhatsApp.</p>
                </motion.div>
              ) : (
                <form onSubmit={submit} className="card p-8 space-y-4">
                  <input className="input" placeholder="Nombre completo" required
                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                  <input className="input" type="email" placeholder="Email" required
                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  <input className="input" type="tel" placeholder="WhatsApp (+34...)"
                    value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                  <select className="input"
                    value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    <option value="inversion">Quiero invertir</option>
                    <option value="compra">Quiero comprar</option>
                    <option value="alquiler">Quiero alquilar</option>
                    <option value="bancaria">Propiedad bancaria</option>
                  </select>
                  <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-base tracking-wide">
                    {loading ? 'Enviando...' : 'Solicitar contacto'}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
