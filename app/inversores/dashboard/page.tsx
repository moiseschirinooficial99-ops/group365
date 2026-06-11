'use client'
import { useEffect, useState, useMemo } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { motion } from 'framer-motion'
import { MapPin, Bed, Bath, Maximize2, Calculator, MessageSquare, LogOut, TrendingUp, Clock, User, Home, FileText } from 'lucide-react'
import Header from '@/components/layout/Header'

type Tab = 'propiedades' | 'consultas' | 'calculadora' | 'contacto'

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  new:        { label: 'Pendiente',    color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
  contacted:  { label: 'Contactado',   color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  in_process: { label: 'En proceso',   color: 'text-[#1B7F6F] bg-[#1B7F6F]/10 border-[#1B7F6F]/20' },
  closed:     { label: 'Cerrado',      color: 'text-gray-400 bg-gray-400/10 border-gray-400/20' },
}

export default function Dashboard() {
  const supabase = createClientComponentClient()
  const [tab, setTab] = useState<Tab>('propiedades')
  const [profile, setProfile] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [properties, setProperties] = useState<any[]>([])
  const [consultas, setConsultas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [interests, setInterests] = useState<Set<string>>(new Set())
  const [sendingInterest, setSendingInterest] = useState<string | null>(null)

  // Filters
  const [filterZona, setFilterZona] = useState('')
  const [filterMaxPrice, setFilterMaxPrice] = useState('')
  const [filterMinRoi, setFilterMinRoi] = useState('')

  // ROI Calculator
  const [calcPrice, setCalcPrice] = useState('')
  const [calcRent, setCalcRent] = useState('')
  const [calcExpenses, setCalcExpenses] = useState('')

  // Quick message
  const [msgText, setMsgText] = useState('')
  const [msgSent, setMsgSent] = useState(false)
  const [msgLoading, setMsgLoading] = useState(false)

  useEffect(() => {
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/inversores/login'; return }

      setUser(session.user)

      const [{ data: p }, { data: props }, { data: leads }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', session.user.id).single(),
        supabase.from('properties').select('*').eq('is_active', true).order('estimated_roi', { ascending: false }).limit(50),
        supabase.from('leads').select('*').eq('email', session.user.email).order('created_at', { ascending: false }),
      ])

      setProfile(p)
      setProperties(props || [])
      setConsultas((leads || []).filter((l: any) => l.source === 'inversores_interest'))
      setLoading(false)
    })()
  }, [])

  const filteredProperties = useMemo(() => {
    return properties.filter(p => {
      if (filterZona && !p.location?.toLowerCase().includes(filterZona.toLowerCase())) return false
      if (filterMaxPrice && Number(p.price) > Number(filterMaxPrice)) return false
      if (filterMinRoi && Number(p.estimated_roi) < Number(filterMinRoi)) return false
      return true
    })
  }, [properties, filterZona, filterMaxPrice, filterMinRoi])

  const roiCalc = useMemo(() => {
    const price = Number(calcPrice)
    const rent = Number(calcRent)
    const expenses = Number(calcExpenses) || 0
    if (!price || !rent) return null
    const annualIncome = rent * 12
    const netIncome = annualIncome - expenses
    const roi = (netIncome / price) * 100
    const payback = netIncome > 0 ? price / netIncome : null
    return { annualIncome, netIncome, roi, payback }
  }, [calcPrice, calcRent, calcExpenses])

  const handleInterest = async (property: any) => {
    if (interests.has(property.id) || sendingInterest) return
    setSendingInterest(property.id)
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile?.name || user?.email,
          email: user?.email,
          phone: profile?.phone || '',
          preferred_zone: property.location,
          budget_max: property.price,
          source: 'inversores_interest',
          notes: `Interesado en: ${property.title} — €${Number(property.price).toLocaleString('es-ES')} — ROI ${property.estimated_roi}%`,
        }),
      })
      setInterests(prev => { const next = new Set(prev); next.add(property.id); return next })
      setConsultas(prev => [{
        id: Date.now(),
        source: 'inversores_interest',
        created_at: new Date().toISOString(),
        status: 'new',
        notes: `Interesado en: ${property.title}`,
      }, ...prev])
    } finally {
      setSendingInterest(null)
    }
  }

  const handleQuickMsg = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!msgText.trim()) return
    setMsgLoading(true)
    await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: profile?.name || user?.email,
        email: user?.email,
        phone: profile?.phone || '',
        source: 'dashboard_mensaje',
        notes: msgText,
      }),
    })
    setMsgSent(true)
    setMsgLoading(false)
    setMsgText('')
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/inversores/login'
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0F1419] flex items-center justify-center">
      <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }}
        className="gold-text text-lg font-playfair">Cargando tu dashboard...</motion.div>
    </div>
  )

  const TABS = [
    { id: 'propiedades', label: 'Propiedades', icon: Home },
    { id: 'consultas',   label: 'Mis consultas', icon: FileText },
    { id: 'calculadora', label: 'Calculadora ROI', icon: Calculator },
    { id: 'contacto',    label: 'Contacto', icon: MessageSquare },
  ] as const

  return (
    <main className="bg-[#0F1419] min-h-screen">
      <Header />
      <div className="max-w-7xl mx-auto px-4 pt-24 pb-16">

        {/* ── HEADER CARD ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="card p-6 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#C9A84C]/15 border border-[#C9A84C]/30 flex items-center justify-center">
                <User size={20} className="text-[#C9A84C]" />
              </div>
              <div>
                <h1 className="font-playfair text-xl font-bold">
                  Bienvenido, <span className="gold-text">{profile?.name || 'Inversor'}</span>
                </h1>
                <p className="text-[#8B96A5] text-xs mt-0.5">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex gap-5 text-center">
                <div>
                  <div className="gold-text font-bold text-sm">
                    {profile?.budget_min
                      ? `€${Number(profile.budget_min).toLocaleString('es-ES')} — €${Number(profile.budget_max || 0).toLocaleString('es-ES')}`
                      : '—'}
                  </div>
                  <div className="text-[#8B96A5] text-xs">Presupuesto</div>
                </div>
                <div>
                  <div className="gold-text font-bold text-sm">{profile?.expected_roi ? `${profile.expected_roi}%` : '—'}</div>
                  <div className="text-[#8B96A5] text-xs">ROI objetivo</div>
                </div>
                <div>
                  <div className="gold-text font-bold text-sm">{profile?.investment_timeline || '—'}</div>
                  <div className="text-[#8B96A5] text-xs">Plazo</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded-full bg-[#1B7F6F]/15 border border-[#1B7F6F]/25 text-[#1B7F6F] font-medium">
                  Activo
                </span>
                <button onClick={handleSignOut}
                  className="flex items-center gap-1.5 text-[#8B96A5] hover:text-red-400 text-xs transition-colors">
                  <LogOut size={13} /> Salir
                </button>
              </div>
            </div>
          </div>

          {/* Resumen del inversor */}
          <div className="mt-5 pt-5 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#161D26] rounded-lg p-4">
              <p className="text-[#8B96A5] text-xs mb-1">Nombre</p>
              <p className="text-white text-sm font-medium">{profile?.name || '—'}</p>
            </div>
            <div className="bg-[#161D26] rounded-lg p-4">
              <p className="text-[#8B96A5] text-xs mb-1">Email</p>
              <p className="text-white text-sm font-medium truncate">{user?.email}</p>
            </div>
            <div className="bg-[#161D26] rounded-lg p-4">
              <p className="text-[#8B96A5] text-xs mb-1">Miembro desde</p>
              <p className="text-white text-sm font-medium">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('es-ES') : '—'}
              </p>
            </div>
            <div className="bg-[#161D26] rounded-lg p-4">
              <p className="text-[#8B96A5] text-xs mb-1">Consultas activas</p>
              <p className="gold-text text-sm font-bold">{consultas.length}</p>
            </div>
          </div>
        </motion.div>

        {/* ── TABS ── */}
        <div className="flex gap-1 mb-6 bg-[#161D26] rounded-xl p-1 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id as Tab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-1 justify-center ${
                tab === id
                  ? 'bg-[#C9A84C] text-[#0F1419]'
                  : 'text-[#8B96A5] hover:text-white'
              }`}>
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* ── TAB: PROPIEDADES ── */}
        {tab === 'propiedades' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            {/* Filtros */}
            <div className="card p-4 mb-6 flex flex-wrap gap-3 items-end">
              <div>
                <label className="text-xs text-[#8B96A5] block mb-1">Zona</label>
                <input className="input py-2 text-sm w-40" placeholder="Madrid, Costa..."
                  value={filterZona} onChange={e => setFilterZona(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-[#8B96A5] block mb-1">Precio máx. €</label>
                <input className="input py-2 text-sm w-36" type="number" placeholder="500.000"
                  value={filterMaxPrice} onChange={e => setFilterMaxPrice(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-[#8B96A5] block mb-1">ROI mín. %</label>
                <input className="input py-2 text-sm w-28" type="number" placeholder="4"
                  value={filterMinRoi} onChange={e => setFilterMinRoi(e.target.value)} />
              </div>
              {(filterZona || filterMaxPrice || filterMinRoi) && (
                <button onClick={() => { setFilterZona(''); setFilterMaxPrice(''); setFilterMinRoi('') }}
                  className="text-xs text-[#8B96A5] hover:text-white py-2 px-3 border border-white/10 rounded-lg transition-colors">
                  Limpiar filtros
                </button>
              )}
              <p className="text-xs text-[#8B96A5] ml-auto self-center">
                {filteredProperties.length} propiedad{filteredProperties.length !== 1 ? 'es' : ''}
              </p>
            </div>

            {filteredProperties.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredProperties.map(p => (
                  <div key={p.id} className="card overflow-hidden group">
                    <div className="relative h-52 overflow-hidden">
                      <img
                        src={p.main_image || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800'}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      {p.estimated_roi && (
                        <div className="absolute top-3 right-3 bg-[#C9A84C] text-[#0F1419] text-xs font-bold px-2.5 py-1 rounded-full">
                          {p.estimated_roi}% ROI
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="font-playfair text-xl font-bold gold-text mb-1">
                        €{Number(p.price).toLocaleString('es-ES')}
                      </div>
                      <h3 className="font-semibold text-sm text-white mb-2 line-clamp-1">{p.title}</h3>
                      <div className="flex items-center gap-1 text-[#8B96A5] text-xs mb-3">
                        <MapPin size={11} />
                        <span className="truncate">{p.location}</span>
                      </div>
                      <div className="flex gap-4 text-xs text-[#8B96A5] mb-4 pb-4 border-b border-white/5">
                        {p.bedrooms && <span className="flex items-center gap-1"><Bed size={11} /> {p.bedrooms}</span>}
                        {p.bathrooms && <span className="flex items-center gap-1"><Bath size={11} /> {p.bathrooms}</span>}
                        {p.area_sqm && <span className="flex items-center gap-1"><Maximize2 size={11} /> {p.area_sqm}m²</span>}
                      </div>
                      <button
                        onClick={() => handleInterest(p)}
                        disabled={interests.has(p.id) || sendingInterest === p.id}
                        className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all ${
                          interests.has(p.id)
                            ? 'bg-[#1B7F6F]/15 border border-[#1B7F6F]/30 text-[#1B7F6F] cursor-default'
                            : 'btn-primary'
                        }`}
                      >
                        {interests.has(p.id) ? '✓ Solicitud enviada' : sendingInterest === p.id ? 'Enviando...' : 'Me interesa'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card p-16 text-center">
                <Home size={40} className="text-[#8B96A5] mx-auto mb-4 opacity-40" />
                <p className="text-[#8B96A5]">
                  {properties.length === 0
                    ? 'Estamos preparando propiedades para tu perfil.'
                    : 'Ninguna propiedad coincide con los filtros.'}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* ── TAB: MIS CONSULTAS ── */}
        {tab === 'consultas' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            {consultas.length > 0 ? (
              <div className="space-y-3">
                {consultas.map((c, i) => (
                  <div key={c.id || i} className="card p-5 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium mb-1 line-clamp-2">
                        {c.notes || `Consulta sobre propiedad`}
                      </p>
                      <div className="flex items-center gap-1.5 text-[#8B96A5] text-xs">
                        <Clock size={11} />
                        {new Date(c.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium shrink-0 ${(STATUS_LABEL[c.status] || STATUS_LABEL['new']).color}`}>
                      {(STATUS_LABEL[c.status] || STATUS_LABEL['new']).label}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card p-16 text-center">
                <FileText size={40} className="text-[#8B96A5] mx-auto mb-4 opacity-40" />
                <p className="text-[#8B96A5] mb-2">No tienes consultas activas.</p>
                <p className="text-[#8B96A5] text-sm">Haz clic en "Me interesa" en alguna propiedad para empezar.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ── TAB: CALCULADORA ROI ── */}
        {tab === 'calculadora' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
            className="grid md:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="font-playfair text-lg font-bold mb-5 flex items-center gap-2">
                <Calculator size={18} className="text-[#C9A84C]" />
                Calculadora de rentabilidad
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-[#8B96A5] block mb-1.5">Precio de compra (€)</label>
                  <input className="input" type="number" placeholder="200.000"
                    value={calcPrice} onChange={e => setCalcPrice(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-[#8B96A5] block mb-1.5">Alquiler mensual (€)</label>
                  <input className="input" type="number" placeholder="1.200"
                    value={calcRent} onChange={e => setCalcRent(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-[#8B96A5] block mb-1.5">Gastos anuales (€) — opcional</label>
                  <input className="input" type="number" placeholder="2.400"
                    value={calcExpenses} onChange={e => setCalcExpenses(e.target.value)} />
                  <p className="text-[#8B96A5] text-xs mt-1">IBI, comunidad, seguro, mantenimiento...</p>
                </div>
              </div>
            </div>

            <div className="card p-6 flex flex-col justify-center">
              {roiCalc ? (
                <>
                  <h3 className="font-playfair text-lg font-bold mb-6 flex items-center gap-2">
                    <TrendingUp size={18} className="text-[#1B7F6F]" />
                    Resultado
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-[#161D26] rounded-xl p-5 text-center">
                      <p className="text-[#8B96A5] text-xs uppercase tracking-wider mb-1">ROI Anual Neto</p>
                      <p className={`font-playfair text-4xl font-bold ${roiCalc.roi >= 5 ? 'text-[#1B7F6F]' : roiCalc.roi >= 3 ? 'gold-text' : 'text-red-400'}`}>
                        {roiCalc.roi.toFixed(2)}%
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-[#161D26] rounded-lg p-4 text-center">
                        <p className="text-[#8B96A5] text-xs mb-1">Ingreso bruto anual</p>
                        <p className="text-white font-bold">€{roiCalc.annualIncome.toLocaleString('es-ES')}</p>
                      </div>
                      <div className="bg-[#161D26] rounded-lg p-4 text-center">
                        <p className="text-[#8B96A5] text-xs mb-1">Ingreso neto anual</p>
                        <p className="text-white font-bold">€{roiCalc.netIncome.toLocaleString('es-ES')}</p>
                      </div>
                    </div>
                    {roiCalc.payback && (
                      <div className="bg-[#161D26] rounded-lg p-4 text-center">
                        <p className="text-[#8B96A5] text-xs mb-1">Recuperación de inversión</p>
                        <p className="gold-text font-bold">{roiCalc.payback.toFixed(1)} años</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <TrendingUp size={48} className="text-[#8B96A5] mx-auto mb-4 opacity-20" />
                  <p className="text-[#8B96A5] text-sm">Introduce el precio y el alquiler<br />para calcular la rentabilidad.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── TAB: CONTACTO ── */}
        {tab === 'contacto' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
            className="grid md:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="font-playfair text-lg font-bold mb-2">Contacto directo</h3>
              <p className="text-[#8B96A5] text-sm mb-6">Habla directamente con tu gestor de inversiones.</p>

              <a
                href={`https://wa.me/34600000000?text=Hola, soy ${profile?.name || 'un inversor'} y quiero más información sobre oportunidades de inversión.`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full py-4 rounded-xl bg-[#25D366]/10 border border-[#25D366]/25 text-[#25D366] font-medium hover:bg-[#25D366]/20 transition-all mb-4"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Abrir WhatsApp
              </a>

              <div className="flex items-center gap-3 text-[#8B96A5] text-xs">
                <div className="h-px flex-1 bg-white/5" />
                <span>o envía un mensaje</span>
                <div className="h-px flex-1 bg-white/5" />
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-playfair text-lg font-bold mb-2">Mensaje rápido</h3>
              <p className="text-[#8B96A5] text-sm mb-6">Tu gestor te responderá en menos de 24h.</p>

              {msgSent ? (
                <div className="bg-[#1B7F6F]/10 border border-[#1B7F6F]/25 rounded-xl p-6 text-center">
                  <p className="text-[#1B7F6F] font-medium mb-1">Mensaje enviado</p>
                  <p className="text-[#8B96A5] text-sm">Te contactaremos pronto.</p>
                  <button onClick={() => setMsgSent(false)} className="text-xs text-[#8B96A5] hover:text-white mt-3 transition-colors">
                    Enviar otro mensaje
                  </button>
                </div>
              ) : (
                <form onSubmit={handleQuickMsg} className="space-y-4">
                  <textarea
                    className="input resize-none h-32"
                    placeholder="¿En qué podemos ayudarte? Cuéntanos tus objetivos de inversión..."
                    value={msgText}
                    onChange={e => setMsgText(e.target.value)}
                    required
                  />
                  <button type="submit" disabled={msgLoading} className="btn-primary w-full py-3">
                    {msgLoading ? 'Enviando...' : 'Enviar mensaje'}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        )}

      </div>
    </main>
  )
}
