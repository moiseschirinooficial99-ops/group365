'use client'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

const FADE_UP = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] } },
}
const STAGGER = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } }

const WA_BASE = 'https://wa.me/34611251818?text=Hola,%20me%20interesa%20una%20oportunidad%20de%20'

type VerticalId = 'npl' | 'reo' | 'cesion_remate' | 'producto_ocupado' | 'fondo'

const VERTICALS: {
  id: VerticalId
  icon: string
  name: string
  tagline: string
  description: string
  features: string[]
  roi: string
  plazo: string
  accentColor: string
  borderColor: string
  waText: string
}[] = [
  {
    id: 'npl',
    icon: '📋',
    name: 'NPL',
    tagline: 'Hipotecas impagadas con garantía real',
    description: 'Compra el derecho de cobro de hipotecas impagadas con descuento del 30-70%. Garantía hipotecaria sobre la vivienda. Riesgo de capital: cero.',
    features: [
      'Descuento 30-70% sobre el valor de la deuda',
      'Garantía hipotecaria real sobre el inmueble',
      'GROUP 360 gestiona todo el proceso judicial',
      'Capital mínimo recomendado: 30.000 €',
    ],
    roi: '30-100%',
    plazo: '8-16 meses',
    accentColor: 'text-[#C9A84C]',
    borderColor: 'border-[#C9A84C]/30',
    waText: 'NPL%20(Hipoteca%20Impagada)',
  },
  {
    id: 'reo',
    icon: '🏦',
    name: 'REO',
    tagline: 'Activos bancarios ya adjudicados',
    description: 'Activos ya adjudicados por el banco o fondo. Propiedad lista para adquisición directa, sin esperar proceso judicial. Descuento 15-25% bajo mercado.',
    features: [
      'Sin procesos judiciales pendientes',
      'Adquisición directa y rápida',
      'Descuento 15-25% bajo precio de mercado',
      'Documentación y due diligence completo',
    ],
    roi: '15-25%',
    plazo: '60-90 días',
    accentColor: 'text-[#1B7F6F]',
    borderColor: 'border-[#1B7F6F]/30',
    waText: 'REO%20(Activo%20Adjudicado)',
  },
  {
    id: 'cesion_remate',
    icon: '⚖️',
    name: 'Cesión de Remate',
    tagline: 'Subastas desiertas a tu favor',
    description: 'Cuando nadie puja en la subasta, accedes al derecho de remate pagando directamente. Resultado de subasta ya conocido, menor incertidumbre.',
    features: [
      'Subasta ya celebrada y desierta',
      'Resultado conocido — menor riesgo',
      'Proceso más rápido que NPL clásico',
      'Precio de adquisición muy ajustado',
    ],
    roi: '20-40%',
    plazo: '30-60 días',
    accentColor: 'text-blue-400',
    borderColor: 'border-blue-400/30',
    waText: 'Cesion%20de%20Remate',
  },
  {
    id: 'producto_ocupado',
    icon: '🔑',
    name: 'Producto Ocupado',
    tagline: 'Mayor descuento por factor desalojo',
    description: 'Activos con ocupante (anterior propietario). Mayor descuento por el factor tiempo. Servicio de desalojo disponible por separado.',
    features: [
      'Descuento extra por situación de ocupación',
      'ROI elevado al resolver la situación',
      'Servicio de desalojo coordinado',
      'Asesoramiento legal incluido',
    ],
    roi: '25-50%',
    plazo: 'Variable según desalojo',
    accentColor: 'text-orange-400',
    borderColor: 'border-orange-400/30',
    waText: 'Producto%20Ocupado',
  },
  {
    id: 'fondo',
    icon: '💼',
    name: 'Fondo GROUP 360',
    tagline: 'Rentabilidad fija del 30% anual',
    description: 'Inviertes en el pool diversificado de GROUP 360 sin elegir activo individual. Retribución fija del 30% anual sobre el capital aportado.',
    features: [
      'Retribución fija del 30% anual garantizada',
      'Diversificación automática entre activos',
      'Sin necesidad de elegir propiedad individual',
      'Gestión 100% delegada a GROUP 360',
    ],
    roi: '30% anual fijo',
    plazo: 'Renovable anualmente',
    accentColor: 'text-purple-400',
    borderColor: 'border-purple-400/30',
    waText: 'Fondo%20GROUP%20360',
  },
]

function OpportunityBadge({ op, category }: { op: any; category: VerticalId }) {
  const roi = op.roi_estimated || op.annual_return_pct
  const price = op.offer_price || op.minimum_investment
  const cover = Array.isArray(op.images) && op.images.length > 0 ? op.images[0] : null
  return (
    <div className="bg-[#0F1419] border border-white/10 rounded-lg overflow-hidden">
      {cover && (
        <img src={cover} alt={op.title} className="w-full h-28 object-cover" />
      )}
      <div className="p-3">
        <p className="text-white text-xs font-semibold truncate mb-1">{op.title}</p>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[#8B96A5] text-[10px] truncate">{op.location || ''}</span>
          <div className="flex items-center gap-1.5 shrink-0">
            {roi && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#C9A84C]/15 text-[#C9A84C] border border-[#C9A84C]/20 font-bold">{roi}%</span>}
            {price && <span className="text-[10px] text-[#8B96A5]">€{Number(price).toLocaleString('es-ES')}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function InversoresPage() {
  const supabase = createClientComponentClient()
  const [expanded, setExpanded] = useState<VerticalId | null>(null)
  const [opportunities, setOpportunities] = useState<Record<VerticalId, any[]>>({
    npl: [], reo: [], cesion_remate: [], producto_ocupado: [], fondo: [],
  })
  const [opsLoaded, setOpsLoaded] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) window.location.href = '/inversores/dashboard'
    })
  }, [])

  useEffect(() => {
    fetch('/api/investment-opportunities?is_public=true&status=disponible')
      .then(r => r.json())
      .then((data: any[]) => {
        if (!Array.isArray(data)) return
        const grouped: Record<VerticalId, any[]> = { npl: [], reo: [], cesion_remate: [], producto_ocupado: [], fondo: [] }
        for (const op of data) {
          if (grouped[op.category as VerticalId]) grouped[op.category as VerticalId].push(op)
        }
        setOpportunities(grouped)
        setOpsLoaded(true)
      })
      .catch(() => setOpsLoaded(true))
  }, [])

  const toggle = (id: VerticalId) => setExpanded(prev => prev === id ? null : id)

  return (
    <main className="bg-[#0F1419]">
      <Header />

      {/* HERO */}
      <section className="relative min-h-[65vh] flex items-center justify-center pt-20">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1800" alt="inversores" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0F1419]/75 to-[#0F1419]" />
        </div>
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <motion.div initial="hidden" animate="show" variants={STAGGER}>
            <motion.p variants={FADE_UP} className="text-[#1B7F6F] text-xs font-semibold tracking-[0.5em] uppercase mb-5">
              Portal Exclusivo de Inversores
            </motion.p>
            <motion.h1 variants={FADE_UP} className="font-playfair text-5xl md:text-6xl font-bold mb-6">
              5 Verticales de<br /><span className="gold-text">Inversión Patrimonial</span>
            </motion.h1>
            <motion.p variants={FADE_UP} className="text-gray-300 text-lg mb-10 font-light">
              Accede a oportunidades que no llegan al mercado. Desde NPL hasta el Fondo GROUP 360 con 30% anual fijo.
            </motion.p>
            <motion.div variants={FADE_UP} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/inversores/register" className="btn-primary text-base px-10 py-4">
                Registrarme como Inversor
              </Link>
              <Link href="/inversores/login" className="btn-outline text-base px-10 py-4">
                Iniciar Sesión
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 5 VERTICALES */}
      <section className="py-20 px-4">
        <div className="container">
          <motion.div initial="hidden" whileInView="show" variants={FADE_UP} viewport={{ once: true }} className="text-center mb-14">
            <p className="text-[#1B7F6F] text-xs font-semibold tracking-[0.4em] uppercase mb-3">Estrategias de inversión</p>
            <h2 className="font-playfair text-4xl font-bold">Elige tu vertical</h2>
            <p className="text-[#8B96A5] mt-3 text-sm">Haz clic en cada vertical para ver cómo funciona y las oportunidades activas</p>
          </motion.div>

          {/* Grid de tarjetas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {VERTICALS.map((v, i) => {
              const isOpen = expanded === v.id
              const ops = opportunities[v.id]
              return (
                <motion.div
                  key={v.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  viewport={{ once: true }}
                  className={`lg:col-span-1 ${isOpen ? 'sm:col-span-2 lg:col-span-5' : ''} transition-all duration-300`}
                >
                  {/* Card header */}
                  <button
                    onClick={() => toggle(v.id)}
                    className={`w-full text-left card p-5 border transition-all duration-300 group ${
                      isOpen ? `${v.borderColor} bg-[#161D26]` : 'border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-3xl">{v.icon}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold transition-colors ${
                        isOpen ? `${v.accentColor} ${v.borderColor} bg-white/5` : 'text-[#8B96A5] border-white/10'
                      }`}>
                        {isOpen ? 'Ver menos' : ops.length > 0 ? `${ops.length} activo${ops.length > 1 ? 's' : ''}` : 'Ver más'}
                      </span>
                    </div>
                    <h3 className={`font-playfair font-bold text-lg mb-1 transition-colors ${isOpen ? v.accentColor : 'text-white group-hover:text-white'}`}>
                      {v.name}
                    </h3>
                    <p className="text-[#8B96A5] text-xs leading-relaxed">{v.tagline}</p>
                    <div className={`mt-3 flex gap-2 flex-wrap text-[10px] font-bold ${v.accentColor}`}>
                      <span className="bg-white/5 px-2 py-0.5 rounded">{v.roi}</span>
                      <span className="bg-white/5 px-2 py-0.5 rounded">{v.plazo}</span>
                    </div>
                  </button>

                  {/* Expanded content */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                        className="overflow-hidden"
                      >
                        <div className={`card p-6 mt-1 border ${v.borderColor} bg-[#161D26]`}>
                          <div className="grid md:grid-cols-3 gap-6">
                            {/* Descripción + features */}
                            <div className="md:col-span-1">
                              <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${v.accentColor}`}>Cómo funciona</p>
                              <p className="text-[#8B96A5] text-sm leading-relaxed mb-4">{v.description}</p>
                              <ul className="space-y-2">
                                {v.features.map((f, fi) => (
                                  <li key={fi} className="flex items-start gap-2 text-xs text-gray-300">
                                    <span className={`mt-0.5 shrink-0 ${v.accentColor}`}>—</span>
                                    {f}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Stats */}
                            <div className="flex flex-col gap-3">
                              <p className={`text-xs font-semibold uppercase tracking-wider ${v.accentColor}`}>Rentabilidad</p>
                              <div className="bg-[#0F1419] rounded-xl p-4 text-center">
                                <p className={`font-playfair text-3xl font-bold ${v.accentColor}`}>{v.roi}</p>
                                <p className="text-[#8B96A5] text-xs mt-1">ROI estimado</p>
                              </div>
                              <div className="bg-[#0F1419] rounded-xl p-4 text-center">
                                <p className="text-white font-bold text-lg">{v.plazo}</p>
                                <p className="text-[#8B96A5] text-xs mt-1">Plazo estimado</p>
                              </div>
                            </div>

                            {/* Oportunidades activas */}
                            <div>
                              <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${v.accentColor}`}>
                                Oportunidades activas
                              </p>
                              {!opsLoaded ? (
                                <p className="text-[#8B96A5] text-xs">Cargando...</p>
                              ) : ops.length > 0 ? (
                                <div className="space-y-2 mb-4">
                                  {ops.map(op => <OpportunityBadge key={op.id} op={op} category={v.id} />)}
                                </div>
                              ) : (
                                <div className="bg-[#0F1419] rounded-xl p-4 mb-4">
                                  <p className="text-[#8B96A5] text-xs leading-relaxed">
                                    Actualmente sin activos disponibles en esta categoría. Déjanos tus datos y te avisamos cuando haya una nueva oportunidad.
                                  </p>
                                </div>
                              )}

                              <a
                                href={`${WA_BASE}${v.waText}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`block w-full text-center py-3 rounded-xl text-sm font-semibold border transition-all hover:opacity-90 ${
                                  v.id === 'npl' ? 'bg-[#C9A84C] text-[#0F1419] border-[#C9A84C]' :
                                  v.id === 'reo' ? 'bg-[#1B7F6F] text-white border-[#1B7F6F]' :
                                  v.id === 'cesion_remate' ? 'bg-blue-500 text-white border-blue-500' :
                                  v.id === 'producto_ocupado' ? 'bg-orange-500 text-white border-orange-500' :
                                  'bg-purple-500 text-white border-purple-500'
                                }`}
                              >
                                Quiero esta oportunidad →
                              </a>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 px-4 bg-[#161D26]/40">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div initial="hidden" whileInView="show" variants={STAGGER} viewport={{ once: true }}>
            <motion.h2 variants={FADE_UP} className="font-playfair text-4xl font-bold mb-5">
              Accede al panel privado de inversores
            </motion.h2>
            <motion.p variants={FADE_UP} className="text-[#8B96A5] mb-10">
              Regístrate y accede a oportunidades exclusivas, no disponibles al público general.
            </motion.p>
            <motion.div variants={FADE_UP} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/inversores/register" className="btn-primary text-base px-12 py-4 inline-block">
                Crear cuenta de inversor
              </Link>
              <Link href="/inversores/login" className="btn-outline text-base px-12 py-4 inline-block">
                Ya tengo cuenta
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
