'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const STATUS_COLOR: Record<string, string> = {
  new: 'text-blue-400 bg-blue-900/20',
  contacted: 'text-yellow-400 bg-yellow-900/20',
  qualified: 'text-purple-400 bg-purple-900/20',
  converted: 'text-green-400 bg-green-900/20',
  lost: 'text-red-400 bg-red-900/20',
}

export default function Admin() {
  const [leads, setLeads] = useState<any[]>([])
  const [props, setProps] = useState<any[]>([])
  const [tab, setTab] = useState<'leads' | 'props'>('leads')
  const [filter, setFilter] = useState('all')
  const [stats, setStats] = useState({ total: 0, new: 0, converted: 0, totalProps: 0 })

  useEffect(() => { loadAll() }, [filter])

  const loadAll = async () => {
    const [leadsRes, propsRes] = await Promise.all([
      fetch('/api/leads'),
      fetch('/api/properties'),
    ])
    const leadsData = await leadsRes.json()
    const propsData = await propsRes.json()

    setLeads(filter === 'all' ? leadsData : leadsData.filter((l: any) => l.status === filter))
    setProps(propsData)
    setStats({
      total: leadsData.length,
      new: leadsData.filter((l: any) => l.status === 'new').length,
      converted: leadsData.filter((l: any) => l.status === 'converted').length,
      totalProps: propsData.length,
    })
  }

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/leads?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    loadAll()
  }

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-playfair text-3xl font-bold">
            <span className="green-text">GROUP</span> <span className="gold-text">360</span> — Admin
          </h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Leads', value: stats.total, color: 'text-white' },
            { label: 'Nuevos', value: stats.new, color: 'text-blue-400' },
            { label: 'Convertidos', value: stats.converted, color: 'text-green-400' },
            { label: 'Propiedades', value: stats.totalProps, color: 'text-[#C9A84C]' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }} className="card p-5 text-center">
              <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-gray-600 text-xs mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="flex gap-2 mb-6">
          {(['leads', 'props'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                tab === t ? 'bg-[#C9A84C] text-[#0A0A0A]' : 'bg-[#111827] text-gray-400 hover:text-white'
              }`}>
              {t === 'leads' ? '👥 Leads' : '🏠 Propiedades'}
            </button>
          ))}
        </div>

        {tab === 'leads' && (
          <>
            <div className="flex gap-2 mb-4 flex-wrap">
              {['all','new','contacted','qualified','converted','lost'].map(s => (
                <button key={s} onClick={() => setFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs capitalize transition-all ${
                    filter === s ? 'bg-[#C9A84C] text-[#0A0A0A] font-bold' : 'bg-[#111827] text-gray-500'
                  }`}>
                  {s === 'all' ? 'Todos' : s}
                </button>
              ))}
            </div>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#C9A84C]/10 text-left text-gray-500 text-xs">
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
                      <tr key={l.id} className="border-b border-[#C9A84C]/5 hover:bg-[#1a2535] transition-colors">
                        <td className="p-4 font-medium">{l.name || '—'}</td>
                        <td className="p-4">
                          <div className="text-xs text-gray-400">{l.email}</div>
                          {l.phone && (
                            <a href={`https://wa.me/${l.phone.replace(/\D/g,'')}`}
                              target="_blank" rel="noopener noreferrer"
                              className="text-green-500 text-xs hover:underline">
                              📱 {l.phone}
                            </a>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="text-xs bg-[#111827] px-2 py-1 rounded capitalize border border-[#C9A84C]/10">{l.source}</span>
                        </td>
                        <td className="p-4 text-xs">
                          {l.budget_max ? `€${Number(l.budget_max).toLocaleString('es-ES')}` : '—'}
                        </td>
                        <td className="p-4">
                          <span className={`font-bold text-xs ${Number(l.scoring_result) >= 70 ? 'text-green-400' : 'text-yellow-400'}`}>
                            {l.scoring_result || 0}%
                          </span>
                        </td>
                        <td className="p-4">
                          <select value={l.status} onChange={e => updateStatus(l.id, e.target.value)}
                            className={`text-xs px-2 py-1 rounded border-0 outline-none cursor-pointer ${STATUS_COLOR[l.status]}`}>
                            {['new','contacted','qualified','converted','lost'].map(s => (
                              <option key={s} value={s} className="bg-[#111827] text-white capitalize">{s}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {leads.length === 0 && (
                  <div className="text-center py-12 text-gray-600">No hay leads todavía.</div>
                )}
              </div>
            </div>
          </>
        )}

        {tab === 'props' && (
          <div className="grid md:grid-cols-2 gap-4">
            {props.map(p => (
              <div key={p.id} className="card p-4 flex gap-4">
                <img src={p.main_image} alt={p.title} className="w-20 h-20 object-cover rounded-lg flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-bold text-sm truncate">{p.title}</div>
                  <div className="text-xs text-gray-500">{p.location}</div>
                  <div className="gold-text font-bold text-sm mt-1">€{Number(p.price).toLocaleString('es-ES')}</div>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs text-green-400">{p.estimated_roi}% ROI</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${p.is_active ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                      {p.is_active ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
