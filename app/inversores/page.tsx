'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

const FADE_UP = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

const BENEFITS = [
  { icon: '📊', title: 'Dashboard personalizado', desc: 'Visualiza tu cartera, ROI y oportunidades en tiempo real.' },
  { icon: '🔔', title: 'Alertas exclusivas', desc: 'Primero en enterarte de propiedades off-market antes que el mercado.' },
  { icon: '💼', title: 'Gestor dedicado', desc: 'Un especialista eXp asignado a tu perfil y objetivos.' },
  { icon: '📈', title: 'Análisis de rentabilidad', desc: 'Informes detallados de cada oportunidad de inversión.' },
]

export default function InversoresPage() {
  return (
    <main>
      <Header />

      <section className="relative min-h-[70vh] flex items-center justify-center pt-16">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1800" alt="inversores" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/80 to-[#0A0A0A]" />
        </div>
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <motion.div initial="hidden" animate="show" variants={FADE_UP}>
            <span className="inline-block text-[#C9A84C] text-xs font-semibold tracking-[0.4em] uppercase mb-6 border border-[#C9A84C]/30 px-4 py-1.5 rounded-full">
              Portal Exclusivo de Inversores
            </span>
            <h1 className="font-playfair text-5xl md:text-6xl font-bold mb-6">
              Inversión Inmobiliaria<br /><span className="gold-text">4-6% ROI Anual</span>
            </h1>
            <p className="text-gray-300 text-lg mb-10">
              Accede a oportunidades que no llegan al mercado. Dashboard personalizado, alertas exclusivas y gestor dedicado.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/inversores/register" className="btn-primary text-base px-10 py-4">
                Registrarme como Inversor →
              </Link>
              <a href="https://wa.me/34600000000?text=Hola, quiero información sobre inversiones inmobiliarias"
                target="_blank" rel="noopener noreferrer" className="btn-outline text-base px-10 py-4">
                💬 Hablar con experto
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <motion.div initial="hidden" whileInView="show" variants={FADE_UP} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="font-playfair text-4xl font-bold mb-3">¿Por qué invertir con GROUP 360?</h2>
          </motion.div>
          <div className="grid md:grid-cols-4 gap-6">
            {BENEFITS.map((b, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }} viewport={{ once: true }} className="card p-6 text-center">
                <div className="text-3xl mb-4">{b.icon}</div>
                <h3 className="font-playfair font-bold text-base mb-2">{b.title}</h3>
                <p className="text-gray-400 text-sm">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-[#111827]/50">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div initial="hidden" whileInView="show" variants={FADE_UP} viewport={{ once: true }}>
            <h2 className="font-playfair text-4xl font-bold mb-4">
              Empieza a invertir hoy
            </h2>
            <p className="text-gray-400 mb-8">Regístrate y accede a tu dashboard personalizado en menos de 5 minutos.</p>
            <Link href="/inversores/register" className="btn-primary text-lg px-12 py-4 inline-block">
              Crear cuenta de inversor →
            </Link>
            <p className="text-gray-600 text-xs mt-4">Ya tienes cuenta? <Link href="/inversores/dashboard" className="text-[#C9A84C] hover:underline">Acceder al dashboard →</Link></p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
