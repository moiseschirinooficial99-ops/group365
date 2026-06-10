'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

const FADE_UP = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] } },
}

const STAGGER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

const BENEFITS = [
  { title: 'Dashboard personalizado', desc: 'Visualiza tu cartera, ROI y oportunidades en tiempo real.' },
  { title: 'Alertas exclusivas', desc: 'Primero en enterarte de propiedades off-market antes que el mercado.' },
  { title: 'Gestor dedicado', desc: 'Un especialista asignado a tu perfil y objetivos de inversión.' },
  { title: 'Análisis de rentabilidad', desc: 'Informes detallados de cada oportunidad con proyección a 5 años.' },
]

const STEPS = [
  { num: '01', title: 'Recibe el portafolio', desc: 'Acceso exclusivo a propiedades bancarias seleccionadas con potencial de rentabilidad demostrado.' },
  { num: '02', title: 'Reserva con €6.000', desc: 'Bloquea la propiedad de tu interés con una reserva totalmente reembolsable hasta la aceptación.' },
  { num: '03', title: 'Oferta de quita al banco', desc: 'Presentamos tu oferta negociada directamente a la entidad bancaria con nuestra capacidad de negociación.' },
  { num: '04', title: 'Respuesta en ~7 días', desc: 'El banco responde en aproximadamente 7 días hábiles con aceptación, contraoferta o rechazo.' },
  { num: '05', title: 'Firma en notaría', desc: 'Proceso notarial completo entre 30 y 90 días. Asesoramiento legal incluido en los honorarios.' },
]

const ADVANTAGES = [
  { value: '15-25%', label: 'Bajo precio de mercado' },
  { value: '€6.000', label: 'Reserva inicial reembolsable' },
  { value: '7 días', label: 'Respuesta del banco' },
  { value: '€20.000', label: 'Honorarios totales (incluye reserva)' },
]

export default function InversoresPage() {
  return (
    <main className="bg-[#0F1419]">
      <Header />

      {/* HERO */}
      <section className="relative min-h-[70vh] flex items-center justify-center pt-20">
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
              Inversión Inmobiliaria<br /><span className="gold-text">4-6% ROI Anual</span>
            </motion.h1>
            <motion.p variants={FADE_UP} className="text-gray-300 text-lg mb-10 font-light">
              Accede a oportunidades que no llegan al mercado. Dashboard personalizado, alertas exclusivas y gestor dedicado.
            </motion.p>
            <motion.div variants={FADE_UP} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/inversores/register" className="btn-primary text-base px-10 py-4">
                Registrarme como Inversor
              </Link>
              <a href="https://wa.me/34600000000?text=Hola, quiero información sobre inversiones inmobiliarias"
                target="_blank" rel="noopener noreferrer" className="btn-outline text-base px-10 py-4">
                Hablar con experto
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* BENEFICIOS */}
      <section className="py-24 px-4">
        <div className="container">
          <motion.div initial="hidden" whileInView="show" variants={FADE_UP} viewport={{ once: true }} className="mb-14">
            <p className="text-[#1B7F6F] text-xs font-semibold tracking-[0.4em] uppercase mb-3">Ventajas</p>
            <h2 className="font-playfair text-4xl font-bold">¿Por qué invertir con GROUP 360?</h2>
          </motion.div>
          <motion.div
            initial="hidden" whileInView="show" variants={STAGGER} viewport={{ once: true }}
            className="grid md:grid-cols-4 gap-6"
          >
            {BENEFITS.map((b, i) => (
              <motion.div key={i} variants={FADE_UP} className="card p-6">
                <div className="w-8 h-px bg-[#C9A84C] mb-5" />
                <h3 className="font-playfair font-bold text-base mb-3">{b.title}</h3>
                <p className="text-[#8B96A5] text-sm leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* DEUDA BANCARIA — TIMELINE */}
      <section className="py-24 px-4 bg-[#161D26]/40">
        <div className="container">
          <motion.div
            initial="hidden" whileInView="show" variants={STAGGER} viewport={{ once: true }}
            className="grid lg:grid-cols-2 gap-20 items-start"
          >
            {/* LEFT: intro + ventajas */}
            <motion.div variants={FADE_UP}>
              <p className="text-[#1B7F6F] text-xs font-semibold tracking-[0.4em] uppercase mb-4">Oportunidad Exclusiva</p>
              <h2 className="font-playfair text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Inversión en<br />
                <span className="gold-text">Deuda Bancaria</span>
              </h2>
              <p className="text-[#8B96A5] leading-relaxed mb-10">
                Accede a propiedades que los bancos necesitan liquidar. Compramos por debajo del valor de mercado
                con un proceso legal 100% garantizado, desde la reserva hasta la firma en notaría.
              </p>

              <div className="grid grid-cols-2 gap-5 mb-10">
                {ADVANTAGES.map((a, i) => (
                  <div key={i} className="bg-[#161D26] border border-white/5 rounded-xl p-5">
                    <div className="font-playfair text-2xl font-bold gold-text mb-1">{a.value}</div>
                    <div className="text-[#8B96A5] text-xs leading-snug">{a.label}</div>
                  </div>
                ))}
              </div>

              <div className="bg-[#1B7F6F]/8 border border-[#1B7F6F]/20 rounded-xl p-6">
                <p className="text-xs text-[#1B7F6F] font-semibold uppercase tracking-widest mb-2">Incluido en los honorarios</p>
                <ul className="space-y-1.5 text-sm text-gray-300">
                  <li className="flex items-start gap-2"><span className="text-[#C9A84C] mt-0.5">—</span> Proceso legal completo con notaría</li>
                  <li className="flex items-start gap-2"><span className="text-[#C9A84C] mt-0.5">—</span> Asesoramiento 360° durante todo el proceso</li>
                  <li className="flex items-start gap-2"><span className="text-[#C9A84C] mt-0.5">—</span> Negociación directa con la entidad bancaria</li>
                  <li className="flex items-start gap-2"><span className="text-[#C9A84C] mt-0.5">—</span> Reserva de €6.000 incluida en honorarios</li>
                </ul>
              </div>
            </motion.div>

            {/* RIGHT: timeline */}
            <motion.div variants={FADE_UP}>
              <p className="text-[#1B7F6F] text-xs font-semibold tracking-[0.4em] uppercase mb-8">El Proceso</p>
              <div className="relative">
                {/* vertical line */}
                <div className="absolute left-[22px] top-2 bottom-2 w-px bg-white/5" />

                <div className="space-y-0">
                  {STEPS.map((s, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1, duration: 0.5 }}
                      viewport={{ once: true }}
                      className="flex gap-6 pb-10 last:pb-0"
                    >
                      <div className="relative shrink-0">
                        <div className="w-11 h-11 rounded-full bg-[#161D26] border border-[#C9A84C]/30 flex items-center justify-center z-10 relative">
                          <span className="text-[#C9A84C] text-xs font-bold">{s.num}</span>
                        </div>
                      </div>
                      <div className="pt-2">
                        <h3 className="font-playfair font-bold text-base mb-2">{s.title}</h3>
                        <p className="text-[#8B96A5] text-sm leading-relaxed">{s.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-white/5">
                <a href="https://wa.me/34600000000?text=Hola, quiero información sobre inversión en deuda bancaria"
                  target="_blank" rel="noopener noreferrer"
                  className="btn-primary w-full text-center py-4 block text-sm">
                  Solicitar portafolio de propiedades bancarias
                </a>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div initial="hidden" whileInView="show" variants={STAGGER} viewport={{ once: true }}>
            <motion.p variants={FADE_UP} className="text-[#1B7F6F] text-xs font-semibold tracking-[0.4em] uppercase mb-4">
              Empieza hoy
            </motion.p>
            <motion.h2 variants={FADE_UP} className="font-playfair text-4xl font-bold mb-5">
              Empieza a invertir hoy
            </motion.h2>
            <motion.p variants={FADE_UP} className="text-[#8B96A5] mb-10">
              Regístrate y accede a tu dashboard personalizado en menos de 5 minutos.
            </motion.p>
            <motion.div variants={FADE_UP}>
              <Link href="/inversores/register" className="btn-primary text-base px-12 py-4 inline-block">
                Crear cuenta de inversor
              </Link>
              <p className="text-[#8B96A5] text-xs mt-5">
                ¿Ya tienes cuenta?{' '}
                <Link href="/inversores/dashboard" className="text-[#C9A84C] hover:underline">Acceder al dashboard</Link>
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
