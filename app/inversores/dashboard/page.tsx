'use client'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Header from '@/components/layout/Header'
import PropertyCard from '@/components/cards/PropertyCard'

export default function Dashboard() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/inversores/register')
        return
      }

      const [{ data: p }, { data: props }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', session.user.id).single(),
        supabase.from('properties').select('*').eq('is_active', true)
          .order('estimated_roi', { ascending: false }).limit(6),
      ])
      setProfile(p)
      setProperties(props || [])
      setLoading(false)
    })()
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }}
        className="gold-text text-lg font-playfair">Cargando tu dashboard...</motion.div>
    </div>
  )

  return (
    <main>
      <Header />
      <div className="max-w-7xl mx-auto px-4 pt-24 pb-16">

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="card p-6 mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-playfair text-2xl font-bold">
              Bienvenido, <span className="gold-text">{profile?.name || 'Inversor'}</span>
            </h1>
            <p className="text-gray-500 text-sm mt-1">Portal exclusivo de inversores · GROUP 360 INICIATIVAS</p>
          </div>
          <div className="flex gap-6 text-center">
            <div>
              <div className="gold-text font-bold text-sm">
                €{Number(profile?.budget_min || 0).toLocaleString('es-ES')} — €{Number(profile?.budget_max || 0).toLocaleString('es-ES')}
              </div>
              <div className="text-gray-600 text-xs">Presupuesto</div>
            </div>
            <div>
              <div className="gold-text font-bold text-sm">{profile?.expected_roi || '-'}%</div>
              <div className="text-gray-600 text-xs">ROI mínimo</div>
            </div>
            <div>
              <div className="gold-text font-bold text-sm">{profile?.investment_timeline || '-'}</div>
              <div className="text-gray-600 text-xs">Plazo</div>
            </div>
          </div>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/inversores/register') }}
            className="text-gray-600 hover:text-red-400 text-xs transition-colors">
            Cerrar sesión
          </button>
        </motion.div>

        <h2 className="font-playfair text-2xl font-bold mb-6">Propiedades para ti</h2>

        {properties.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {properties.map(p => <PropertyCard key={p.id} property={p} />)}
          </div>
        ) : (
          <div className="card p-12 text-center mb-12">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-gray-500">Estamos buscando las mejores oportunidades para tu perfil.</p>
          </div>
        )}

        <div className="card p-8 text-center">
          <h3 className="font-playfair text-xl font-bold mb-3">¿Necesitas asesoramiento personalizado?</h3>
          <p className="text-gray-500 mb-6 text-sm">Habla directamente con un especialista de GROUP 360</p>
          <a href={`https://wa.me/34600000000?text=Hola, soy ${profile?.name || 'inversor'} y quiero más información`}
            target="_blank" rel="noopener noreferrer" className="btn-primary inline-block px-10 py-3.5">
            💬 Hablar con especialista
          </a>
        </div>
      </div>
    </main>
  )
}
