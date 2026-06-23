'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Cpu, Shield, MapPin, Users, Tag,
  ArrowRight, Check, Phone,
  ChevronLeft, ChevronRight, Star,
} from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PropertyCard from '@/components/cards/PropertyCard'
import { config, waLink } from '@/lib/config'

/* ─── Casos de Éxito ─── */
function CasosDeExito() {
  const [cases, setCases] = useState<any[]>([])
  useEffect(() => {
    fetch('/api/properties?success=true')
      .then(r => r.json())
      .then(d => setCases(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [])

  if (cases.length === 0) return null

  return (
    <section className="section bg-[#0D1117]">
      <div className="container">
        <motion.div initial="hidden" whileInView="show" variants={FU} viewport={{ once: true }} className="text-center mb-14">
          <span className="inline-block text-[#1B7F6F] text-xs font-semibold tracking-[0.4em] uppercase mb-4 border border-[#1B7F6F]/30 px-4 py-1.5 rounded-full">
            Resultados Reales
          </span>
          <h2 className="font-playfair text-4xl font-bold mb-3">
            Propiedades que ya<br /><span className="gold-text">encontraron dueño</span>
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">Resultados reales de nuestros clientes. Cada propiedad vendida es una historia de éxito.</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {cases.map((p, i) => {
            const publishedAt = p.created_at ? new Date(p.created_at) : null
            const soldAt = p.sold_date ? new Date(p.sold_date) : null
            const days = publishedAt && soldAt ? Math.round((soldAt.getTime() - publishedAt.getTime()) / 86400000) : null
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="card overflow-hidden border border-[#C9A84C]/20 group">
                <div className="relative h-48 overflow-hidden">
                  <img src={p.main_image || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800'} alt={p.title} className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="border-2 border-[#C9A84C] text-[#C9A84C] text-sm font-bold px-4 py-1.5 rotate-[-8deg] tracking-widest bg-black/30 backdrop-blur-sm">
                      VENDIDA
                    </div>
                  </div>
                  {days && days > 0 && (
                    <div className="absolute top-3 right-3 bg-[#1B7F6F] text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                      Vendida en {days} días
                    </div>
                  )}
                </div>
                <div className="p-4 border-t border-[#C9A84C]/15">
                  <h3 className="font-semibold text-sm text-white truncate mb-1">{p.title}</h3>
                  <div className="flex items-center gap-1 text-[#8B96A5] text-xs mb-2">
                    <MapPin size={10} /><span className="truncate">{p.location}</span>
                  </div>
                  {p.sold_price && (
                    <p className="gold-text text-sm font-bold">€{Number(p.sold_price).toLocaleString('es-ES')} vendida</p>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>

        <motion.div initial="hidden" whileInView="show" variants={FU} viewport={{ once: true }} className="text-center card p-8 border border-[#C9A84C]/15">
          <p className="text-white font-semibold text-lg mb-2">¿Tienes una propiedad similar?</p>
          <p className="text-[#8B96A5] text-sm mb-5">Cuéntanos y diseñamos juntos la estrategia de venta con visión 360°.</p>
          <a href="https://wa.me/34611251818?text=Hola, tengo una propiedad que quiero vender. ¿Podéis ayudarme?"
            target="_blank" rel="noopener noreferrer"
            className="btn-primary inline-flex items-center gap-2">
            Contactar por WhatsApp →
          </a>
        </motion.div>
      </div>
    </section>
  )
}

/* ─── Animation variants ─── */
const FU = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.25, 0.1, 0.25, 1] } },
}
const ST = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } }

/* ─── Animated counter ─── */
function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!inView) return
    let frame = 0
    const steps = 48
    const id = setInterval(() => {
      frame++
      setN(Math.floor((frame / steps) * target))
      if (frame >= steps) { setN(target); clearInterval(id) }
    }, 28)
    return () => clearInterval(id)
  }, [inView, target])
  return <span ref={ref}>{n}{suffix}</span>
}

/* ─── Animated progress bar ─── */
function ProgressBar({ label, percent, delay = 0 }: { label: string; percent: number; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })
  return (
    <div ref={ref} className="mb-7 last:mb-0">
      <div className="flex justify-between text-sm mb-2.5">
        <span className="text-white font-medium">{label}</span>
        <span className="text-[#C9A84C] font-bold tabular-nums">{percent}%</span>
      </div>
      <div className="h-px bg-white/8 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: inView ? `${percent}%` : 0 }}
          transition={{ duration: 1.3, ease: 'easeOut', delay: 0.15 + delay }}
          className="h-full bg-gradient-to-r from-[#1B7F6F] to-[#C9A84C] rounded-full"
        />
      </div>
    </div>
  )
}

/* ─── Data ─── */
const FEATURES = [
  { Icon: Cpu,    label: 'Sistema Inteligente' },
  { Icon: Shield, label: 'Inversión Segura' },
  { Icon: MapPin, label: 'Ubicaciones Premium' },
  { Icon: Users,  label: 'Asesoría Experta' },
  { Icon: Tag,    label: 'Precio Justo' },
]

const TEAM_AVATARS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=120&h=120&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=face',
]

const SERVICES_LIST = [
  { num: '01', title: 'Compra de Propiedades', desc: 'Te guiamos en cada paso de la compra, desde la búsqueda hasta la firma en notaría con total seguridad jurídica.', href: '/compras' },
  { num: '02', title: 'Alquileres Turísticos', desc: 'Villas exclusivas en las mejores ubicaciones de España. Alta ocupación y retorno vacacional garantizado desde el primer mes.', href: '/alquileres' },
  { num: '03', title: 'Inversión Inmobiliaria', desc: 'Asesoría estratégica con ROI del 4-6% anual. Oportunidades seleccionadas que no llegan al mercado abierto.', href: '/inversores' },
  { num: '04', title: 'Deuda Bancaria', desc: 'Propiedades 15-25% bajo precio de mercado. Proceso legal completo con negociación directa a la entidad bancaria.', href: '/inversores' },
]

const PROPERTIES = [
  { id: '1', title: 'Villa Exclusiva Marbella', price: 650000, location: 'Marbella, Costa del Sol', bedrooms: 5, bathrooms: 4, area_sqm: 380, estimated_roi: 6.0, yearly_rent: 39000, channel: 'personal', main_image: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800' },
  { id: '2', title: 'Apartamento Premium Madrid', price: 480000, location: 'Madrid, Salamanca', bedrooms: 3, bathrooms: 2, area_sqm: 145, estimated_roi: 5.0, yearly_rent: 24000, channel: 'personal', main_image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800' },
  { id: '3', title: 'Atico Frente al Mar', price: 890000, location: 'Barcelona, Barceloneta', bedrooms: 4, bathrooms: 3, area_sqm: 220, estimated_roi: 5.5, yearly_rent: 48900, channel: 'personal', main_image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800' },
]

const SKILLS = [
  { label: 'Ubicaciones Premium',      percent: 85 },
  { label: 'Diseño Exterior',           percent: 75 },
  { label: 'Inversión Segura',          percent: 95 },
  { label: 'Construcción Sostenible',   percent: 90 },
]

const WHY_US = [
  'Acceso exclusivo a propiedades off-market y bancarias',
  'Más de 15 años de experiencia en el mercado español',
  'Proceso legal garantizado con notaría incluida',
]

const TESTIMONIALS = [
  { name: 'Carlos M.',   location: 'Madrid',    text: 'Invertí €180.000 en Madrid y obtengo €750 al mes. El proceso fue completamente transparente y el equipo siempre estuvo disponible. Una inversión que recomendaría a cualquiera.', roi: '5%' },
  { name: 'Ana García',  location: 'Valencia',  text: 'Encontré mi villa ideal en la Costa del Sol. Atención excepcional desde el primer contacto y una gestión verdaderamente impecable en cada detalle del proceso.', roi: '6%' },
  { name: 'Roberto L.',  location: 'Barcelona', text: 'La propiedad bancaria que compramos estaba un 20% por debajo del precio de mercado. Nadie más tenía acceso a esa operación. Un servicio verdaderamente exclusivo.', roi: '5.7%' },
]

const MARQUEE_ITEMS = [
  'EXPLORA PROPIEDADES', 'GROUP 360 INICIATIVAS', 'VISIÓN 360°', 'PROPIEDADES PREMIUM',
  'EXPLORA PROPIEDADES', 'GROUP 360 INICIATIVAS', 'VISIÓN 360°', 'PROPIEDADES PREMIUM',
]

/* ─── Page ─── */
export default function HomePage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [testIdx, setTestIdx] = useState(0)
  const [featuredProps, setFeaturedProps] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/properties')
      .then(r => r.json())
      .then((data: any[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setFeaturedProps(data.filter(p => p.channel !== 'alquiler').slice(0, 3))
        }
      })
      .catch(() => {})
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, type: 'contacto', source: 'landing' }),
      })
      setSent(true)
    } finally { setLoading(false) }
  }

  const prevT = () => setTestIdx(i => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)
  const nextT = () => setTestIdx(i => (i + 1) % TESTIMONIALS.length)

  return (
    <main className="bg-[#0F1419]">
      <Header />

      {/* ── 1. HERO ── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1920"
            alt="Propiedad premium" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F1419]/95 via-[#0F1419]/65 to-[#0F1419]/20" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 w-full">
          <div className="max-w-xl">
            <motion.div variants={ST} initial="hidden" animate="show" className="space-y-6">

              <motion.div variants={FU}>
                <span className="inline-flex items-center gap-2 text-[#C9A84C] text-xs font-bold tracking-[0.4em] uppercase border border-[#C9A84C]/30 px-4 py-2 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-pulse" />
                  Propiedades Premium
                </span>
              </motion.div>

              <motion.h1 variants={FU} className="font-playfair font-bold text-white leading-[0.93]">
                <span className="block text-[clamp(2.6rem,5.5vw,70px)]">Visión 360°</span>
                <span className="block text-[clamp(2.6rem,5.5vw,70px)] text-[#C9A84C]">del Mercado</span>
                <span className="block text-[clamp(2.6rem,5.5vw,70px)]">Inmobiliario</span>
              </motion.h1>

              <motion.p variants={FU} className="text-gray-300 text-lg font-light leading-relaxed">
                Propiedades premium en las mejores ubicaciones de España. Asesoría experta, resultados garantizados.
              </motion.p>

              {/* Team avatars + stat */}
              <motion.div variants={FU} className="flex items-center gap-5">
                <div className="flex">
                  {TEAM_AVATARS.map((src, i) => (
                    <img key={i} src={src} alt="Equipo GROUP 360"
                      className="w-10 h-10 rounded-full border-2 border-[#0F1419] object-cover"
                      style={{ marginLeft: i > 0 ? '-10px' : 0 }}
                    />
                  ))}
                </div>
                <div>
                  <div className="font-playfair font-bold text-xl gold-text">
                    <Counter target={250} suffix="+" />
                  </div>
                  <div className="text-xs text-[#8B96A5]">Activos en ubicaciones prime</div>
                </div>
              </motion.div>

              <motion.div variants={FU} className="flex gap-4 pt-2">
                <Link href="/compras" className="btn-primary text-sm px-8 py-3.5">
                  Ver propiedades
                </Link>
                <Link href="/inversores/register" className="btn-outline text-sm px-8 py-3.5">
                  Área inversores
                </Link>
              </motion.div>
            </motion.div>
          </div>

          {/* Logo 3D flotante */}
          <div className="absolute right-16 top-1/2 -translate-y-1/2 hidden xl:flex items-center justify-center">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-80 h-80 rounded-full bg-[#C9A84C]/10 blur-3xl" />
              <div className="absolute w-52 h-52 rounded-full bg-[#1B7F6F]/12 blur-2xl" />
              <motion.img
                src="/logo.png"
                alt="GROUP 360"
                animate={{ y: [0, -14, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  width: 300, height: 300,
                  filter: 'drop-shadow(0 0 60px rgba(201,168,76,0.75)) drop-shadow(0 0 120px rgba(27,127,111,0.4)) drop-shadow(0 24px 50px rgba(0,0,0,0.7))',
                  mixBlendMode: 'lighten',
                }}
                className="object-contain relative z-10"
              />
            </div>
          </div>
        </div>

        {/* Bottom stats bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-[#0F1419]/80 backdrop-blur-sm border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-white/50 text-sm font-light italic">
              &ldquo;Creando espacios modernos que inspiran&rdquo;
            </p>
            <div className="flex items-center gap-8 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#C9A84C]"><Counter target={95} suffix="%" /></span>
                <span className="text-[#8B96A5]">Satisfacción</span>
              </div>
              <div className="w-px h-4 bg-white/10" />
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#C9A84C]"><Counter target={15} suffix="+" /></span>
                <span className="text-[#8B96A5]">Años experiencia</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. FEATURES STRIP ── */}
      <section className="bg-[#161D26] border-y border-white/5 py-10 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div variants={ST} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {FEATURES.map(({ Icon, label }, i) => (
              <motion.div key={i} variants={FU}
                className="flex flex-col sm:flex-row items-center sm:items-center gap-3 text-center sm:text-left">
                <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/8 border border-[#C9A84C]/15 flex items-center justify-center shrink-0">
                  <Icon size={17} className="text-[#C9A84C]" />
                </div>
                <span className="text-sm text-gray-300 font-medium leading-tight">{label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── 3. ABOUT ── */}
      <section className="py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div variants={ST} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="grid lg:grid-cols-2 gap-16 items-center">

            <motion.div variants={FU}>
              <p className="text-[#1B7F6F] text-xs font-semibold tracking-[0.4em] uppercase mb-4">Sobre Nosotros</p>
              <h2 className="font-playfair text-4xl md:text-5xl font-bold mb-5 leading-tight">
                Descubre más sobre <span className="gold-text">nosotros</span>
              </h2>
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="border border-[#1B7F6F]/35 text-[#1B7F6F] text-xs px-3 py-1.5 rounded-full">
                  Asesores inmobiliarios de confianza
                </span>
                <span className="border border-[#C9A84C]/35 text-[#C9A84C] text-xs px-3 py-1.5 rounded-full">
                  15+ años de experiencia
                </span>
              </div>
              <p className="text-[#8B96A5] leading-relaxed mb-8">
                Somos un equipo especializado en el mercado inmobiliario español con más de 15 años de
                experiencia. Ofrecemos acceso exclusivo a propiedades off-market, gestión integral y
                asesoría personalizada en cada etapa del proceso.
              </p>
              <div className="border-l-2 border-[#C9A84C]/30 pl-5 mb-10">
                <p className="text-gray-300 text-sm italic leading-relaxed mb-3">
                  &ldquo;Invertí €180.000 en Madrid y obtengo €750 al mes. El proceso fue completamente transparente.&rdquo;
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-px bg-[#C9A84C]" />
                  <span className="text-xs text-[#8B96A5]">Carlos M. — Inversor, Madrid</span>
                </div>
              </div>
              <Link href="/inversores" className="btn-primary inline-flex items-center gap-2 text-sm">
                Conocer más <ArrowRight size={14} />
              </Link>
            </motion.div>

            <motion.div variants={FU} className="relative">
              <div className="aspect-[4/3] rounded-xl overflow-hidden">
                <img src="https://images.unsplash.com/photo-1600607688969-a5bfcd646154?w=1200"
                  alt="Equipo GROUP 360" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-[#1B7F6F] text-white p-5 rounded-xl shadow-2xl hidden md:block">
                <div className="font-playfair text-2xl font-bold">500+</div>
                <div className="text-xs opacity-80 mt-0.5">Propiedades gestionadas</div>
              </div>
            </motion.div>
          </motion.div>

          {/* 4 badges */}
          <motion.div variants={ST} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
            {['Transacciones Seguras', 'Ubicaciones Premium', 'Vida Moderna', 'Espacios Comerciales'].map((b, i) => (
              <motion.div key={i} variants={FU}
                className="border border-white/7 rounded-xl px-5 py-4 text-center hover:border-[#C9A84C]/20 transition-colors">
                <div className="w-5 h-px bg-[#C9A84C] mx-auto mb-3" />
                <span className="text-sm text-gray-300 font-medium">{b}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── 4. SERVICES NUMBERED ── */}
      <section className="py-24 px-6 bg-[#161D26]/40">
        <div className="max-w-7xl mx-auto">
          {/* Logo flotante 3D */}
          <div className="flex justify-center mb-14">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-72 h-72 rounded-full bg-[#C9A84C]/10 blur-3xl" />
              <div className="absolute w-48 h-48 rounded-full bg-[#1B7F6F]/12 blur-2xl" />
              <motion.img
                src="/logo.png"
                alt="GROUP 360"
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  width: 220, height: 220,
                  filter: 'drop-shadow(0 0 55px rgba(201,168,76,0.7)) drop-shadow(0 0 110px rgba(27,127,111,0.35))',
                  mixBlendMode: 'lighten',
                }}
                className="object-contain relative z-10"
              />
            </div>
          </div>

          <motion.div variants={ST} initial="hidden" whileInView="show" viewport={{ once: true }} className="mb-14">
            <motion.p variants={FU} className="text-[#1B7F6F] text-xs font-semibold tracking-[0.4em] uppercase mb-3">
              Explora Nuestros Servicios
            </motion.p>
            <motion.h2 variants={FU} className="font-playfair text-4xl md:text-5xl font-bold">
              Soluciones Inmobiliarias<br />de Confianza
            </motion.h2>
          </motion.div>

          <motion.div variants={ST} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="grid md:grid-cols-2 border-t border-white/5">
            {SERVICES_LIST.map((s, i) => (
              <motion.div key={i} variants={FU}
                className={`p-8 border-b border-white/5 group hover:bg-white/[0.02] transition-colors ${
                  i % 2 === 0 ? 'md:border-r border-white/5' : ''
                }`}>
                <div className="flex items-start gap-6">
                  <span className="font-playfair text-5xl font-bold text-white/8 group-hover:text-[#C9A84C]/20 transition-colors shrink-0 leading-none mt-1 tabular-nums">
                    {s.num}
                  </span>
                  <div>
                    <h3 className="font-playfair text-xl font-bold mb-3">{s.title}</h3>
                    <p className="text-[#8B96A5] text-sm leading-relaxed mb-5">{s.desc}</p>
                    <Link href={s.href}
                      className="inline-flex items-center gap-2 text-[#C9A84C] text-xs font-semibold tracking-wide hover:gap-3 transition-all">
                      Explorar <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── 5. PROPERTIES ── */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div variants={ST} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="flex items-end justify-between mb-14">
            <motion.div variants={FU}>
              <p className="text-[#1B7F6F] text-xs font-semibold tracking-[0.4em] uppercase mb-3">Propiedades</p>
              <h2 className="font-playfair text-4xl md:text-5xl font-bold max-w-xl leading-tight">
                Explora Nuestra<br />Cartera de Activos Seleccionados
              </h2>
            </motion.div>
            <motion.div variants={FU} className="hidden md:block shrink-0">
              <Link href="/compras" className="btn-outline text-sm">Ver todas</Link>
            </motion.div>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {(featuredProps.length > 0 ? featuredProps : PROPERTIES).map(p => <PropertyCard key={p.id} property={p} />)}
          </div>

          <div className="text-center mt-12">
            <Link href="/compras" className="btn-primary inline-flex items-center gap-2 text-sm px-10 py-3.5">
              Ver todas las propiedades <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 6. SKILLS / PROGRESS BARS ── */}
      <section className="py-24 px-6 bg-[#161D26]/40">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }} viewport={{ once: true }}
            className="aspect-[4/3] rounded-xl overflow-hidden">
            <img src="https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200"
              alt="Propiedad premium" className="w-full h-full object-cover" />
          </motion.div>

          <motion.div variants={ST} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <motion.p variants={FU} className="text-[#1B7F6F] text-xs font-semibold tracking-[0.4em] uppercase mb-3">
              Nuestras Capacidades
            </motion.p>
            <motion.h2 variants={FU} className="font-playfair text-4xl font-bold mb-10 leading-tight">
              Excelencia en cada <span className="gold-text">área del negocio</span>
            </motion.h2>
            <motion.div variants={FU}>
              {SKILLS.map((s, i) => (
                <ProgressBar key={i} label={s.label} percent={s.percent} delay={i * 0.1} />
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── 7. WHY CHOOSE US ── */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div variants={ST} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <motion.p variants={FU} className="text-[#1B7F6F] text-xs font-semibold tracking-[0.4em] uppercase mb-3">
              Por Qué Elegirnos
            </motion.p>
            <motion.h2 variants={FU} className="font-playfair text-4xl md:text-5xl font-bold mb-8 leading-tight">
              Profesionales con<br />Experiencia e Integridad
            </motion.h2>
            <motion.ul variants={ST} className="space-y-4 mb-10">
              {WHY_US.map((item, i) => (
                <motion.li key={i} variants={FU} className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-[#1B7F6F]/12 border border-[#1B7F6F]/25 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={11} className="text-[#1B7F6F]" />
                  </div>
                  <span className="text-gray-300 text-sm leading-relaxed">{item}</span>
                </motion.li>
              ))}
            </motion.ul>
            <motion.div variants={FU} className="flex items-center gap-7">
              <Link href="/inversores" className="btn-primary inline-flex items-center gap-2 text-sm">
                Saber más <ArrowRight size={14} />
              </Link>
              <a href="tel:+34611251818" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-full bg-[#C9A84C]/8 border border-[#C9A84C]/20 flex items-center justify-center">
                  <Phone size={14} className="text-[#C9A84C]" />
                </div>
                <div>
                  <div className="text-[10px] text-[#8B96A5] uppercase tracking-widest">Llámanos</div>
                  <div className="text-sm text-white font-medium group-hover:text-[#C9A84C] transition-colors">+34 611 25 18 18</div>
                </div>
              </a>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }} viewport={{ once: true }}
            className="relative aspect-[4/3] rounded-xl overflow-hidden">
            <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=1200"
              alt="Equipo profesional" className="w-full h-full object-cover" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="bg-[#0F1419]/82 backdrop-blur-sm border border-white/10 rounded-xl p-5 grid grid-cols-3 gap-4 text-center">
                {[{ v: '10K+', l: 'Clientes' }, { v: '500+', l: 'Propiedades' }, { v: '15+', l: 'Años' }].map((s, i) => (
                  <div key={i}>
                    <div className="font-playfair text-xl font-bold gold-text">{s.v}</div>
                    <div className="text-[#8B96A5] text-xs mt-0.5">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── 8. CTA BANNER + MARQUEE ── */}
      <section className="py-24 px-6 bg-[#161D26]/50 overflow-hidden relative">
        {/* Marquee */}
        <div className="absolute inset-x-0 top-0 py-3 border-b border-white/5 overflow-hidden">
          <div className="animate-marquee flex whitespace-nowrap">
            {MARQUEE_ITEMS.map((item, i) => (
              <span key={i} className="mx-10 text-[#C9A84C]/18 text-xs font-bold tracking-[0.5em] uppercase">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="max-w-3xl mx-auto text-center relative z-10 pt-10">
          <motion.div variants={ST} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <motion.h2 variants={FU} className="font-playfair text-4xl md:text-6xl font-bold mb-5">
              Encuentra Tu Propiedad<br />
              <span className="gold-text">Perfecta Hoy</span>
            </motion.h2>
            <motion.p variants={FU} className="text-[#8B96A5] mb-10 text-lg font-light">
              Contáctanos para una asesoría patrimonial inmobiliaria personalizada.
            </motion.p>
            <motion.div variants={FU} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/#contacto" className="btn-primary text-base px-10 py-4 inline-flex items-center justify-center gap-2">
                Contactar Ahora <ArrowRight size={16} />
              </Link>
              <Link href="/compras" className="btn-outline text-base px-10 py-4 inline-block text-center">
                Ver propiedades
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── 9. TESTIMONIALS ── */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div variants={ST} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="flex items-end justify-between mb-14">
            <motion.div variants={FU}>
              <p className="text-[#1B7F6F] text-xs font-semibold tracking-[0.4em] uppercase mb-3">Testimonios</p>
              <h2 className="font-playfair text-4xl md:text-5xl font-bold">
                Lo Que Dicen<br />Nuestros Clientes
              </h2>
            </motion.div>
            <motion.div variants={FU} className="hidden md:flex gap-2">
              <button onClick={prevT} aria-label="Anterior"
                className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:border-[#C9A84C]/40 hover:text-[#C9A84C] transition-colors">
                <ChevronLeft size={17} />
              </button>
              <button onClick={nextT} aria-label="Siguiente"
                className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:border-[#C9A84C]/40 hover:text-[#C9A84C] transition-colors">
                <ChevronRight size={17} />
              </button>
            </motion.div>
          </motion.div>

          {/* Desktop: all 3 */}
          <div className="hidden md:grid grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.6 }} viewport={{ once: true }}
                className={`card p-8 relative overflow-hidden ${i === testIdx ? 'border-[#C9A84C]/15' : ''}`}>
                <div className="flex gap-0.5 mb-5">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={13} className="fill-[#C9A84C] text-[#C9A84C]" />
                  ))}
                </div>
                <div className="font-playfair text-[80px] text-[#C9A84C]/7 leading-none absolute -top-1 left-4 select-none pointer-events-none">"</div>
                <p className="text-gray-300 text-sm leading-relaxed mb-6 relative z-10">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="border-t border-white/5 pt-5 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm text-white">{t.name}</div>
                    <div className="text-[#8B96A5] text-xs mt-0.5">{t.location}</div>
                  </div>
                  <div className="bg-[#C9A84C]/8 border border-[#C9A84C]/18 text-[#C9A84C] text-xs font-bold px-3 py-1 rounded-full">
                    {t.roi} ROI
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Mobile: carousel */}
          <div className="md:hidden">
            <AnimatePresence mode="wait">
              <motion.div key={testIdx}
                initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -28 }}
                transition={{ duration: 0.3 }}
                className="card p-8">
                <div className="flex gap-0.5 mb-5">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={13} className="fill-[#C9A84C] text-[#C9A84C]" />
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-6">
                  &ldquo;{TESTIMONIALS[testIdx].text}&rdquo;
                </p>
                <div className="border-t border-white/5 pt-5 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm text-white">{TESTIMONIALS[testIdx].name}</div>
                    <div className="text-[#8B96A5] text-xs mt-0.5">{TESTIMONIALS[testIdx].location}</div>
                  </div>
                  <div className="bg-[#C9A84C]/8 border border-[#C9A84C]/18 text-[#C9A84C] text-xs font-bold px-3 py-1 rounded-full">
                    {TESTIMONIALS[testIdx].roi} ROI
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="flex justify-center gap-3 mt-6">
              <button onClick={prevT} className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:border-[#C9A84C]/40 transition-colors">
                <ChevronLeft size={17} />
              </button>
              <button onClick={nextT} className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:border-[#C9A84C]/40 transition-colors">
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 10. CONTACT FORM ── */}
      <section id="contacto" className="py-24 px-6 bg-[#161D26]/40">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-start">
          <motion.div variants={ST} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <motion.p variants={FU} className="text-[#1B7F6F] text-xs font-semibold tracking-[0.4em] uppercase mb-3">Contacto</motion.p>
            <motion.h2 variants={FU} className="font-playfair text-4xl font-bold mb-6">Envíanos un Mensaje</motion.h2>
            <motion.p variants={FU} className="text-[#8B96A5] leading-relaxed mb-10">
              Nuestro equipo responde en menos de 2 horas. Cuéntanos qué buscas y encontraremos la mejor opción para ti.
            </motion.p>
            <motion.div variants={ST} className="space-y-5">
              {[
                { code: 'WA', label: 'WhatsApp', value: config.contacto.whatsappDisplay, href: waLink() },
                { code: '@',  label: 'Email',    value: config.contacto.email, href: null },
                { code: 'ES', label: 'Dirección', value: `${config.contacto.direccion}, ${config.contacto.ciudad}, ${config.contacto.provincia}`, href: null },
              ].map((c, i) => (
                <motion.div key={i} variants={FU} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#1B7F6F]/8 border border-[#1B7F6F]/18 flex items-center justify-center shrink-0">
                    <span className="text-[#1B7F6F] text-xs font-bold">{c.code}</span>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#8B96A5] uppercase tracking-widest mb-0.5">{c.label}</div>
                    {c.href
                      ? <a href={c.href} target="_blank" rel="noopener noreferrer"
                          className="text-sm text-white hover:text-[#C9A84C] transition-colors">{c.value}</a>
                      : <div className="text-sm text-white leading-snug">{c.value}</div>
                    }
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div initial="hidden" whileInView="show" variants={FU} viewport={{ once: true }}>
            {sent ? (
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="card p-10 text-center flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-14 h-14 rounded-full bg-[#1B7F6F]/12 border border-[#1B7F6F]/25 flex items-center justify-center mb-5">
                  <Check size={22} className="text-[#1B7F6F]" />
                </div>
                <h3 className="font-playfair text-2xl font-bold mb-3">Mensaje enviado</h3>
                <p className="text-[#8B96A5]">Te contactamos en menos de 2 horas.</p>
              </motion.div>
            ) : (
              <form onSubmit={submit} className="card p-8 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[#8B96A5] block mb-1.5">Nombre</label>
                    <input className="input" placeholder="Tu nombre" required
                      value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-[#8B96A5] block mb-1.5">Email</label>
                    <input className="input" type="email" placeholder="email@ejemplo.com" required
                      value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#8B96A5] block mb-1.5">Teléfono</label>
                  <input className="input" type="tel" placeholder="+34 611 25 18 18"
                    value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-[#8B96A5] block mb-1.5">Asunto</label>
                  <input className="input" placeholder="¿En qué podemos ayudarte?" required
                    value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-[#8B96A5] block mb-1.5">Mensaje</label>
                  <textarea className="input min-h-[96px] resize-none" placeholder="Cuéntanos más sobre lo que buscas..."
                    value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
                </div>
                <button type="submit" disabled={loading}
                  className="btn-primary w-full py-4 tracking-wide inline-flex items-center justify-center gap-2">
                  {loading ? 'Enviando...' : <><span>Enviar Mensaje</span><ArrowRight size={15} /></>}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </section>

      <CasosDeExito />

      <Footer />
    </main>
  )
}
