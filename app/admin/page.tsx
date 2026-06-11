'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Plus, TrendingUp, Users, Home, Calendar, Flame } from 'lucide-react'

const SCORE_BADGE = (score: number) => {
  if (score >= 80) return 'text-red-400 bg-red-900/20 border border-red-500/30'
  if (score >= 70) return 'text-orange-400 bg-orange-900/20 border border-orange-500/30'
  return 'text-green-400 bg-green-900/20 border border-green-500/30'
}

const STATUS_COLOR: Record<string, string> = {
  new: 'text-blue-400 bg-blue-900/20',
  contacted: 'text-yellow-400 bg-yellow-900/20',
  qualified: 'text-purple-400 bg-purple-900/20',
  converted: 'text-green-400 bg-green-900/20',
  lost: 'text-red-400 bg-red-900/20',
}

type Tab = 'leads' | 'hot' | 'props' | 'calendario'

export default function Admin() {
  const [leads, setLeads] = useState<any[]>([])
  const [hotLeads, setHotLeads] = useState<any[]>([])
  const [props, setProps] = useState<any[]>([])
  const [calendar, setCalendar] = useState<any[]>([])
  const [tab, setTab] = useState<Tab>('leads')
  const [filter, setFilter] = useState('all')
  const [stats, setStats] = useState({ total: 0, new: 0, hot: 0, totalProps: 0, converted: 0 })

  useEffect(() => { loadAll() }, [filter])

  const loadAll = async () => {
    const [leadsRes, propsRes, hotRes, calRes] = await Promise.all([
      fetch('/api/leads'),
      fetch('/api/properties'),
      fetch('/api/leads?hot=1'),
      fetch('/api/admin/calendar').catch(() => ({ json: async () => [] })),
    ])
    const leadsData: any[] = await leadsRes.json()
    const propsData: any[] = await propsRes.json()
    const hotData: any[] = await hotRes.json()

    let calData: any[] = []
    try { calData = await calRes.json() } catch {}

    setLeads(filter === 'all' ? leadsData : leadsData.filter(l => l.status === filter))
    setProps(propsData)
    setHotLeads(hotData)
    setCalendar(calData)

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisMonth = leadsData.filter(l => new Date(l.created_at) >= monthStart)

    setStats({
      total: thisMonth.length,
      new: leadsData.filter(l => l.status === 'new').length,
      hot: hotData.length,
      totalProps: propsData.length,
      converted: leadsData.filter(l => l.status === 'converted').length,
    })
  }

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/leads?id=${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    loadAll()
  }

  const deactivateProperty = async (id: string) => {
    await fetch(`/api/properties?id=${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: false }),
    })
    loadAll()
  }

  const TABS = [
    { id: 'leads',    label: 'Todos los leads', icon: Users },
    { id: 'hot',      label: `🔥 Calientes (${stats.hot})`, icon: Flame },
    { id: 'props',    label: 'Propiedades', icon: Home },
    { id: 'calendario', label: 'Calendario', icon: Calendar },
  ] as const

  return (
    <main className="min-h-screen bg-[#0F1419] p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-playfair text-3xl font-bold">
            <span className="green-text">GROUP</span> <span className="gold-text">360</span>
            <span className="text-white/40 text-xl ml-3">Panel de Control</span>
          </h1>
          <Link href="/admin/nueva-propiedad"
            className="flex items-center gap-2 btn-primary px-5 py-2.5 text-sm">
            <Plus size={16} /> Nueva Propiedad
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Leads este mes',   value: stats.total,     color: 'text-white',        icon: TrendingUp },
            { label: 'Sin contactar',    value: stats.new,       color: 'text-blue-400',     icon: Users },
            { label: 'Leads calientes',  value: stats.hot,       color: 'text-red-400',      icon: Flame },
            { label: 'Propiedades',      value: stats.totalProps, color: 'text-[#C9A84C]',   icon: Home },
            { label: 'Convertidos',      value: stats.converted,  color: 'text-[#1B7F6F]',  icon: TrendingUp },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }} className="card p-5 text-center">
              <div className={`text-3xl font-bold font-playfair ${s.color}`}>{s.value}</div>
              <div className="text-[#8B96A5] text-xs mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-[#161D26] rounded-xl p-1 overflow-x-auto">
          {TABS.map(({ id, label }) => (
            <button key={id} onClick={() => setTab(id as Tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-1 ${
                tab === id ? 'bg-[#C9A84C] text-[#0F1419]' : 'text-[#8B96A5] hover:text-white'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* TAB: ALL LEADS */}
        {tab === 'leads' && (
          <>
            <div className="flex gap-2 mb-4 flex-wrap">
              {['all','new','contacted','qualified','converted','lost'].map(s => (
                <button key={s} onClick={() => setFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs capitalize transition-all ${
                    filter === s ? 'bg-[#C9A84C] text-[#0A0A0A] font-bold' : 'bg-[#111827] text-gray-500 hover:text-white'
                  }`}>
                  {s === 'all' ? 'Todos' : s}
                </button>
              ))}
            </div>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-left text-[#8B96A5] text-xs">
                      <th className="p-4">Nombre</th>
                      <th className="p-4">Contacto</th>
                      <th className="p-4">Fuente</th>
                      <th className="p-4">Presupuesto</th>
                      <th className="p-4">Score</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map(l => (
                      <tr key={l.id} className="border-b border-white/5 hover:bg-[#161D26] transition-colors">
                        <td className="p-4 font-medium text-white">{l.name || '—'}</td>
                        <td className="p-4">
                          <div className="text-xs text-[#8B96A5]">{l.email}</div>
                          {l.phone && (
                            <a href={`https://wa.me/${l.phone.replace(/\D/g,'')}`}
                              target="_blank" rel="noopener noreferrer"
                              className="text-[#1B7F6F] text-xs hover:underline">📱 {l.phone}</a>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="text-xs bg-[#161D26] border border-white/5 px-2 py-1 rounded capitalize">{l.source}</span>
                        </td>
                        <td className="p-4 text-xs text-[#8B96A5]">
                          {l.budget_max ? `€${Number(l.budget_max).toLocaleString('es-ES')}` : '—'}
                        </td>
                        <td className="p-4">
                          <span className={`text-xs px-2 py-1 rounded border font-bold ${SCORE_BADGE(Number(l.scoring_result || 0))}`}>
                            {l.scoring_result || 0}%
                          </span>
                        </td>
                        <td className="p-4">
                          <select value={l.status} onChange={e => updateStatus(l.id, e.target.value)}
                            className={`text-xs px-2 py-1 rounded border-0 outline-none cursor-pointer ${STATUS_COLOR[l.status] || STATUS_COLOR.new}`}>
                            {['new','contacted','qualified','converted','lost'].map(s => (
                              <option key={s} value={s} className="bg-[#111827] text-white capitalize">{s}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {leads.length === 0 && <div className="text-center py-12 text-[#8B96A5]">No hay leads.</div>}
              </div>
            </div>
          </>
        )}

        {/* TAB: HOT LEADS */}
        {tab === 'hot' && (
          <div className="space-y-3">
            {hotLeads.length === 0 && (
              <div className="card p-12 text-center text-[#8B96A5]">No hay leads calientes (score &gt; 70%) todavía.</div>
            )}
            {hotLeads.map(l => (
              <div key={l.id} className="card p-5 flex flex-wrap items-center justify-between gap-4 border-l-2 border-red-500/50">
                <div>
                  <div className="font-bold text-white">{l.name || 'Sin nombre'}</div>
                  <div className="text-[#8B96A5] text-xs">{l.email} · {l.phone || '-'}</div>
                  <div className="text-[#8B96A5] text-xs mt-0.5">
                    {new Date(l.created_at).toLocaleDateString('es-ES')} · {l.source}
                    {l.budget_max ? ` · €${Number(l.budget_max).toLocaleString('es-ES')}` : ''}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm px-3 py-1.5 rounded border font-bold ${SCORE_BADGE(Number(l.scoring_result || 0))}`}>
                    🔥 {l.scoring_result}%
                  </span>
                  {l.phone && (
                    <a href={`https://wa.me/${l.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                      className="text-xs bg-[#1B7F6F]/15 border border-[#1B7F6F]/30 text-[#1B7F6F] px-3 py-1.5 rounded hover:bg-[#1B7F6F]/25 transition-colors">
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB: PROPIEDADES */}
        {tab === 'props' && (
          <div className="grid md:grid-cols-2 gap-4">
            {props.map(p => (
              <div key={p.id} className="card p-4 flex gap-4">
                <img
                  src={p.main_image || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400'}
                  alt={p.title} className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm truncate text-white">{p.title}</div>
                  <div className="text-[#8B96A5] text-xs">{p.location}</div>
                  <div className="gold-text font-bold text-sm mt-1">€{Number(p.price).toLocaleString('es-ES')}</div>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {p.estimated_roi && <span className="text-xs text-[#1B7F6F]">{p.estimated_roi}% ROI</span>}
                    <span className={`text-xs px-1.5 py-0.5 rounded ${p.is_active ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                      {p.is_active ? 'Activa' : 'Inactiva'}
                    </span>
                    <span className="text-[#8B96A5] text-xs font-mono">{p.id?.slice(0, 8)}...</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <Link href={`/admin/nueva-propiedad?edit=${p.id}`}
                    className="text-xs text-[#C9A84C] hover:underline">Editar</Link>
                  {p.is_active && (
                    <button onClick={() => deactivateProperty(p.id)}
                      className="text-xs text-red-400 hover:underline text-left">Desactivar</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB: CALENDARIO */}
        {tab === 'calendario' && (
          <div className="space-y-3">
            {calendar.length === 0 ? (
              <div className="card p-12 text-center">
                <p className="text-[#8B96A5] mb-4">No hay visitas agendadas próximamente.</p>
                <p className="text-[#8B96A5] text-sm">Usa /visita en el bot de Telegram para agendar.</p>
              </div>
            ) : calendar.map((c: any, i: number) => (
              <div key={i} className="card p-5 flex items-start justify-between gap-4">
                <div>
                  <div className="text-white font-medium">{c.notes || 'Sin descripción'}</div>
                  <div className="text-[#8B96A5] text-xs mt-1">
                    {new Date(c.date_from).toLocaleString('es-ES')} — {new Date(c.date_to).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded border font-medium ${
                  c.status === 'available' ? 'text-[#1B7F6F] border-[#1B7F6F]/30 bg-[#1B7F6F]/10' :
                  c.status === 'visit' ? 'text-[#C9A84C] border-[#C9A84C]/30 bg-[#C9A84C]/10' :
                  'text-red-400 border-red-400/30 bg-red-400/10'
                }`}>
                  {c.status === 'available' ? 'Disponible' : c.status === 'visit' ? 'Visita' : 'Ocupado'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
