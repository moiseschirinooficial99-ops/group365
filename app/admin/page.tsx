'use client'
import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Plus, TrendingUp, Users, Home, Calendar, Flame, X, ChevronLeft, ChevronRight } from 'lucide-react'

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

const PROP_STATUS: Record<string, { label: string; color: string; badge: string }> = {
  disponible:  { label: 'Disponible',      color: 'border-green-500/30',  badge: 'bg-green-500/15 text-green-400 border-green-500/30' },
  negociacion: { label: 'En Negociación',  color: 'border-blue-500/30',   badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  reservada:   { label: 'Reservada',       color: 'border-yellow-500/30', badge: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  vendida:     { label: 'Vendida',         color: 'border-red-500/30',    badge: 'bg-red-500/15 text-red-400 border-red-500/30' },
}

type Tab = 'leads' | 'hot' | 'props' | 'alquileres' | 'calendario'

// ── Mini Calendar ──────────────────────────────────────────────────────────
function MiniCalendar({ propertyId }: { propertyId: string }) {
  const [bookings, setBookings] = useState<any[]>([])
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    fetch(`/api/admin/rental-availability?property_id=${propertyId}`)
      .then(r => r.json()).then(d => setBookings(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [propertyId])

  const getMonthDays = (year: number, month: number) => {
    const first = new Date(year, month, 1).getDay()
    const days = new Date(year, month + 1, 0).getDate()
    return { first: first === 0 ? 6 : first - 1, days }
  }

  const getStatus = (dateStr: string) => {
    for (const b of bookings) {
      if (dateStr >= b.date_start && dateStr < b.date_end) return b.status
    }
    return null
  }

  const now = new Date()
  const months = [0, 1, 2].map(i => {
    const d = new Date(now.getFullYear(), now.getMonth() + offset + i, 1)
    return { year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) }
  })

  const statusColor: Record<string, string> = {
    blocked: 'bg-red-500/70',
    confirmed: 'bg-blue-500/70',
    available: 'bg-green-500/40',
    maintenance: 'bg-gray-500/60',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setOffset(o => o - 3)} className="p-1 text-[#8B96A5] hover:text-white"><ChevronLeft size={14} /></button>
        <span className="text-xs text-[#8B96A5]">Vista 3 meses</span>
        <button onClick={() => setOffset(o => o + 3)} className="p-1 text-[#8B96A5] hover:text-white"><ChevronRight size={14} /></button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {months.map(({ year, month, label }) => {
          const { first, days } = getMonthDays(year, month)
          const cells = Array(first).fill(null).concat(Array.from({ length: days }, (_, i) => i + 1))
          return (
            <div key={`${year}-${month}`}>
              <p className="text-[10px] text-[#8B96A5] text-center mb-1.5 capitalize">{label}</p>
              <div className="grid grid-cols-7 gap-px text-[9px]">
                {['L','M','X','J','V','S','D'].map(d => <div key={d} className="text-center text-[#8B96A5] pb-1">{d}</div>)}
                {cells.map((day, i) => {
                  if (!day) return <div key={`empty-${i}`} />
                  const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
                  const st = getStatus(dateStr)
                  return (
                    <div key={dateStr} className={`aspect-square flex items-center justify-center rounded-sm text-[9px] ${st ? statusColor[st] || 'bg-red-500/70' : 'bg-white/5'} ${st ? 'text-white' : 'text-[#8B96A5]'}`}>
                      {day}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex gap-3 mt-2 flex-wrap">
        {[['bg-green-500/40','Disponible'],['bg-red-500/70','Ocupado'],['bg-blue-500/70','Confirmada'],['bg-gray-500/60','Mant.']].map(([c,l]) => (
          <div key={l} className="flex items-center gap-1"><div className={`w-2 h-2 rounded-sm ${c}`} /><span className="text-[9px] text-[#8B96A5]">{l}</span></div>
        ))}
      </div>
    </div>
  )
}

// ── Sold Modal ─────────────────────────────────────────────────────────────
function SoldModal({ property, onClose, onConfirm }: { property: any; onClose: () => void; onConfirm: (data: any) => void }) {
  const [form, setForm] = useState({ sold_date: new Date().toISOString().split('T')[0], sold_price: String(property.price || ''), notes: '', is_success_case: false })
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-playfair text-lg font-bold">Marcar como Vendida</h3>
          <button onClick={onClose}><X size={18} className="text-[#8B96A5]" /></button>
        </div>
        <p className="text-[#8B96A5] text-sm mb-5 truncate">{property.title}</p>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[#8B96A5] block mb-1.5">Fecha de venta</label>
            <input type="date" className="input" value={form.sold_date} onChange={e => setForm(f => ({ ...f, sold_date: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-[#8B96A5] block mb-1.5">Precio de venta final (€)</label>
            <input type="number" className="input" placeholder={String(property.price)} value={form.sold_price} onChange={e => setForm(f => ({ ...f, sold_price: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-[#8B96A5] block mb-1.5">Notas internas</label>
            <textarea className="input resize-none h-20" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 accent-[#C9A84C]" checked={form.is_success_case} onChange={e => setForm(f => ({ ...f, is_success_case: e.target.checked }))} />
            <span className="text-sm text-white">Publicar como <span className="text-[#C9A84C]">Caso de Éxito</span> en la web</span>
          </label>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-white/10 text-[#8B96A5] text-sm hover:text-white transition-colors">Cancelar</button>
          <button onClick={() => onConfirm(form)} className="flex-1 py-2.5 rounded-lg bg-red-500/80 text-white text-sm font-medium hover:bg-red-500 transition-colors">🏆 Confirmar Venta</button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Rental Booking Modal ───────────────────────────────────────────────────
function RentalModal({ property, onClose, onConfirm }: { property: any; onClose: () => void; onConfirm: (data: any) => void }) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    date_start: today, date_end: today, status: 'confirmed',
    guest_name: '', guest_phone: '', guest_email: '',
    total_price: '', platform: 'directo', notes: '',
  })
  const nights = form.date_start && form.date_end
    ? Math.max(0, (new Date(form.date_end).getTime() - new Date(form.date_start).getTime()) / 86400000)
    : 0

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card p-6 w-full max-w-lg my-4">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-playfair text-lg font-bold">Nueva Reserva / Bloqueo</h3>
          <button onClick={onClose}><X size={18} className="text-[#8B96A5]" /></button>
        </div>
        <p className="text-[#8B96A5] text-sm mb-5 truncate">{property.title}</p>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs text-[#8B96A5] block mb-1.5">Entrada</label>
            <input type="date" className="input" value={form.date_start} onChange={e => setForm(f => ({ ...f, date_start: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-[#8B96A5] block mb-1.5">Salida</label>
            <input type="date" className="input" value={form.date_end} onChange={e => setForm(f => ({ ...f, date_end: e.target.value }))} />
          </div>
        </div>
        {nights > 0 && <p className="text-[#C9A84C] text-xs mb-4">{nights} noche{nights !== 1 ? 's' : ''} · Precio sugerido: €{(nights * (property.price_per_night || 0)).toLocaleString('es-ES')}</p>}
        <div className="mb-4">
          <label className="text-xs text-[#8B96A5] block mb-1.5">Tipo</label>
          <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            <option value="confirmed">Reserva Confirmada</option>
            <option value="blocked">Bloqueo</option>
            <option value="maintenance">Mantenimiento</option>
          </select>
        </div>
        {(form.status === 'confirmed') && (
          <div className="space-y-3 mb-4">
            <input className="input" placeholder="Nombre del huésped" value={form.guest_name} onChange={e => setForm(f => ({ ...f, guest_name: e.target.value }))} />
            <input className="input" placeholder="Teléfono" value={form.guest_phone} onChange={e => setForm(f => ({ ...f, guest_phone: e.target.value }))} />
            <input type="email" className="input" placeholder="Email" value={form.guest_email} onChange={e => setForm(f => ({ ...f, guest_email: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <input type="number" className="input" placeholder="Precio total €" value={form.total_price} onChange={e => setForm(f => ({ ...f, total_price: e.target.value }))} />
              <select className="input" value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}>
                <option value="directo">Directo</option>
                <option value="airbnb">Airbnb</option>
                <option value="booking">Booking</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
          </div>
        )}
        <textarea className="input resize-none h-16 mb-5" placeholder="Notas..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-white/10 text-[#8B96A5] text-sm hover:text-white transition-colors">Cancelar</button>
          <button onClick={() => onConfirm({ ...form, property_id: property.id, property_name: property.title, total_price: form.total_price ? Number(form.total_price) : null })}
            className="flex-1 btn-primary py-2.5 text-sm">
            Guardar
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Main Admin Page ────────────────────────────────────────────────────────
export default function Admin() {
  const [leads, setLeads] = useState<any[]>([])
  const [hotLeads, setHotLeads] = useState<any[]>([])
  const [props, setProps] = useState<any[]>([])
  const [calendar, setCalendar] = useState<any[]>([])
  const [tab, setTab] = useState<Tab>('leads')
  const [filter, setFilter] = useState('all')
  const [stats, setStats] = useState({ total: 0, new: 0, hot: 0, totalProps: 0, converted: 0 })

  // Modals
  const [soldModal, setSoldModal] = useState<any>(null)
  const [rentalModal, setRentalModal] = useState<any>(null)

  const loadAll = useCallback(async () => {
    const [leadsRes, propsRes, hotRes, calRes] = await Promise.all([
      fetch('/api/leads'),
      fetch('/api/properties?all=1').then(r => r.ok ? r : fetch('/api/properties')),
      fetch('/api/leads?hot=1'),
      fetch('/api/admin/calendar').catch(() => ({ json: async () => [] })),
    ])
    const leadsData: any[] = await leadsRes.json()
    const hotData: any[] = await hotRes.json()
    let calData: any[] = []
    try { calData = await calRes.json() } catch {}

    // Fetch all properties (active + sold)
    const allPropsRes = await fetch('/api/properties')
    const allProps: any[] = await allPropsRes.json()

    // Also fetch sold properties separately
    const soldRes = await fetch('/api/properties?success=true')
    const soldProps: any[] = await soldRes.json().catch(() => [])

    // Merge: active props + sold props (deduplicate)
    const soldIds = new Set(soldProps.map((p: any) => p.id))
    const mergedProps = [...allProps, ...soldProps.filter((p: any) => !allProps.some((ap: any) => ap.id === p.id))]

    setLeads(filter === 'all' ? leadsData : leadsData.filter(l => l.status === filter))
    setProps(mergedProps)
    setHotLeads(hotData)
    setCalendar(calData)

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisMonth = leadsData.filter(l => new Date(l.created_at) >= monthStart)

    setStats({
      total: thisMonth.length,
      new: leadsData.filter(l => l.status === 'new').length,
      hot: hotData.length,
      totalProps: allProps.length,
      converted: leadsData.filter(l => l.status === 'converted').length,
    })
  }, [filter])

  useEffect(() => { loadAll() }, [loadAll])

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/leads?id=${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    loadAll()
  }

  const changePropStatus = async (id: string, status: string) => {
    await fetch(`/api/properties?id=${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, is_active: status !== 'vendida' }) })
    loadAll()
  }

  const handleSoldConfirm = async (data: any) => {
    await fetch(`/api/properties?id=${soldModal.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'vendida', is_active: false, sold_date: data.sold_date, sold_price: Number(data.sold_price), rental_notes: data.notes, is_success_case: data.is_success_case }),
    })
    // Telegram notification
    await fetch('/api/admin/notify-sold', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...soldModal, sold_date: data.sold_date, sold_price: data.sold_price }),
    }).catch(() => {})
    setSoldModal(null)
    loadAll()
  }

  const handleRentalConfirm = async (data: any) => {
    await fetch('/api/admin/rental-availability', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    setRentalModal(null)
    loadAll()
  }

  const saleProps = props.filter(p => p.channel !== 'alquiler')
  const rentalProps = props.filter(p => p.channel === 'alquiler')

  const byStatus = (status: string) => saleProps.filter(p => (p.status || 'disponible') === status)

  const TABS = [
    { id: 'leads',      label: 'Leads',               icon: Users },
    { id: 'hot',        label: `🔥 Calientes (${stats.hot})`, icon: Flame },
    { id: 'props',      label: 'Propiedades',          icon: Home },
    { id: 'alquileres', label: 'Alquileres',           icon: Calendar },
    { id: 'calendario', label: 'Agenda',               icon: Calendar },
  ] as const

  // ── Property card ──────────────────────────────────────────────────────
  const PropCard = ({ p, showActions = true }: { p: any; showActions?: boolean }) => {
    const st = p.status || 'disponible'
    const stInfo = PROP_STATUS[st] || PROP_STATUS.disponible
    return (
      <div className={`card overflow-hidden border ${stInfo.color}`}>
        <div className="relative h-32 overflow-hidden">
          <img src={p.main_image || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400'} alt={p.title} className={`w-full h-full object-cover ${st === 'vendida' ? 'opacity-40' : ''}`} />
          {st === 'vendida' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-red-400 border-2 border-red-400 text-xs font-bold px-3 py-1 rotate-[-15deg] tracking-widest">VENDIDA</span>
            </div>
          )}
          <span className={`absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full border font-semibold ${stInfo.badge}`}>{stInfo.label}</span>
        </div>
        <div className="p-3">
          <p className="text-white text-xs font-semibold truncate mb-0.5">{p.title}</p>
          <p className="text-[#8B96A5] text-[10px] truncate mb-1">{p.location}</p>
          {st === 'vendida' && p.sold_price
            ? <p className="text-red-400 text-xs font-bold">Vendida: €{Number(p.sold_price).toLocaleString('es-ES')}</p>
            : <p className="gold-text text-xs font-bold">{Number(p.price) > 0 ? `€${Number(p.price).toLocaleString('es-ES')}` : 'Precio a consultar'}</p>
          }
          {p.reserved_by && <p className="text-yellow-400 text-[10px] mt-0.5">Reservado: {p.reserved_by}</p>}
          {p.sold_date && <p className="text-[#8B96A5] text-[10px]">Fecha: {p.sold_date}</p>}
          {showActions && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {st === 'disponible' && <>
                <button onClick={() => changePropStatus(p.id, 'negociacion')} className="text-[9px] px-2 py-1 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/25 transition-colors">Negociación</button>
                <button onClick={() => changePropStatus(p.id, 'reservada')} className="text-[9px] px-2 py-1 rounded bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/25 transition-colors">Reservar</button>
                <button onClick={() => setSoldModal(p)} className="text-[9px] px-2 py-1 rounded bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 transition-colors">Vendida</button>
              </>}
              {st === 'negociacion' && <>
                <button onClick={() => changePropStatus(p.id, 'disponible')} className="text-[9px] px-2 py-1 rounded bg-green-500/15 text-green-400 border border-green-500/30 hover:bg-green-500/25 transition-colors">Disponible</button>
                <button onClick={() => setSoldModal(p)} className="text-[9px] px-2 py-1 rounded bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 transition-colors">Vendida</button>
              </>}
              {st === 'reservada' && <>
                <button onClick={() => changePropStatus(p.id, 'disponible')} className="text-[9px] px-2 py-1 rounded bg-green-500/15 text-green-400 border border-green-500/30 hover:bg-green-500/25 transition-colors">Liberar</button>
                <button onClick={() => setSoldModal(p)} className="text-[9px] px-2 py-1 rounded bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 transition-colors">Vendida</button>
              </>}
              {st === 'vendida' && <span className="text-[9px] text-[#8B96A5]">🏆 {p.is_success_case ? 'Caso de éxito publicado' : 'Archivada'}</span>}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#0F1419] p-6">
      {soldModal && <SoldModal property={soldModal} onClose={() => setSoldModal(null)} onConfirm={handleSoldConfirm} />}
      {rentalModal && <RentalModal property={rentalModal} onClose={() => setRentalModal(null)} onConfirm={handleRentalConfirm} />}

      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-playfair text-3xl font-bold">
            <span className="green-text">GROUP</span> <span className="gold-text">360</span>
            <span className="text-white/40 text-xl ml-3">Panel de Control</span>
          </h1>
          <Link href="/admin/nueva-propiedad" className="flex items-center gap-2 btn-primary px-5 py-2.5 text-sm">
            <Plus size={16} /> Nueva Propiedad
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Leads este mes',  value: stats.total,     color: 'text-white',       icon: TrendingUp },
            { label: 'Sin contactar',   value: stats.new,       color: 'text-blue-400',    icon: Users },
            { label: 'Leads calientes', value: stats.hot,       color: 'text-red-400',     icon: Flame },
            { label: 'Propiedades',     value: stats.totalProps, color: 'text-[#C9A84C]',  icon: Home },
            { label: 'Convertidos',     value: stats.converted,  color: 'text-[#1B7F6F]', icon: TrendingUp },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-5 text-center">
              <div className={`text-3xl font-bold font-playfair ${s.color}`}>{s.value}</div>
              <div className="text-[#8B96A5] text-xs mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-[#161D26] rounded-xl p-1 overflow-x-auto">
          {TABS.map(({ id, label }) => (
            <button key={id} onClick={() => setTab(id as Tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-1 ${tab === id ? 'bg-[#C9A84C] text-[#0F1419]' : 'text-[#8B96A5] hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* TAB: LEADS */}
        {tab === 'leads' && (
          <>
            <div className="flex gap-2 mb-4 flex-wrap">
              {['all','new','contacted','qualified','converted','lost'].map(s => (
                <button key={s} onClick={() => setFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs capitalize transition-all ${filter === s ? 'bg-[#C9A84C] text-[#0A0A0A] font-bold' : 'bg-[#111827] text-gray-500 hover:text-white'}`}>
                  {s === 'all' ? 'Todos' : s}
                </button>
              ))}
            </div>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-left text-[#8B96A5] text-xs">
                      <th className="p-4">Nombre</th><th className="p-4">Contacto</th><th className="p-4">Fuente</th>
                      <th className="p-4">Presupuesto</th><th className="p-4">Score</th><th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map(l => (
                      <tr key={l.id} className="border-b border-white/5 hover:bg-[#161D26] transition-colors">
                        <td className="p-4 font-medium text-white">{l.name || '—'}</td>
                        <td className="p-4">
                          <div className="text-xs text-[#8B96A5]">{l.email}</div>
                          {l.phone && <a href={`https://wa.me/${l.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" className="text-[#1B7F6F] text-xs hover:underline">📱 {l.phone}</a>}
                        </td>
                        <td className="p-4"><span className="text-xs bg-[#161D26] border border-white/5 px-2 py-1 rounded capitalize">{l.source}</span></td>
                        <td className="p-4 text-xs text-[#8B96A5]">{l.budget_max ? `€${Number(l.budget_max).toLocaleString('es-ES')}` : '—'}</td>
                        <td className="p-4"><span className={`text-xs px-2 py-1 rounded border font-bold ${SCORE_BADGE(Number(l.scoring_result || 0))}`}>{l.scoring_result || 0}%</span></td>
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
            {hotLeads.length === 0 && <div className="card p-12 text-center text-[#8B96A5]">No hay leads calientes (score &gt; 70%) todavía.</div>}
            {hotLeads.map(l => (
              <div key={l.id} className="card p-5 flex flex-wrap items-center justify-between gap-4 border-l-2 border-red-500/50">
                <div>
                  <div className="font-bold text-white">{l.name || 'Sin nombre'}</div>
                  <div className="text-[#8B96A5] text-xs">{l.email} · {l.phone || '-'}</div>
                  <div className="text-[#8B96A5] text-xs mt-0.5">{new Date(l.created_at).toLocaleDateString('es-ES')} · {l.source}{l.budget_max ? ` · €${Number(l.budget_max).toLocaleString('es-ES')}` : ''}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm px-3 py-1.5 rounded border font-bold ${SCORE_BADGE(Number(l.scoring_result || 0))}`}>🔥 {l.scoring_result}%</span>
                  {l.phone && <a href={`https://wa.me/${l.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" className="text-xs bg-[#1B7F6F]/15 border border-[#1B7F6F]/30 text-[#1B7F6F] px-3 py-1.5 rounded hover:bg-[#1B7F6F]/25 transition-colors">WhatsApp</a>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB: PROPIEDADES — 4 COLUMNAS POR ESTADO */}
        {tab === 'props' && (
          <div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {(['disponible','negociacion','reservada','vendida'] as const).map(status => {
                const list = byStatus(status)
                const info = PROP_STATUS[status]
                return (
                  <div key={status}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${info.badge}`}>{info.label}</span>
                      <span className="text-[#8B96A5] text-xs">({list.length})</span>
                    </div>
                    <div className="space-y-3">
                      {list.length === 0
                        ? <div className="card p-6 text-center text-[#8B96A5] text-xs border border-dashed border-white/5">Sin propiedades</div>
                        : list.map(p => <PropCard key={p.id} p={p} />)
                      }
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* TAB: ALQUILERES */}
        {tab === 'alquileres' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-playfair text-xl font-bold">Gestión Alquileres Vacacionales</h2>
              <span className="text-[#8B96A5] text-sm">{rentalProps.length} propiedad{rentalProps.length !== 1 ? 'es' : ''}</span>
            </div>
            {rentalProps.length === 0 ? (
              <div className="card p-12 text-center">
                <Calendar size={40} className="text-[#8B96A5] mx-auto mb-4 opacity-30" />
                <p className="text-[#8B96A5] mb-3">No hay propiedades de alquiler turístico.</p>
                <Link href="/admin/nueva-propiedad" className="btn-primary text-sm px-4 py-2">+ Añadir propiedad de alquiler</Link>
              </div>
            ) : (
              <div className="space-y-6">
                {rentalProps.map(p => (
                  <div key={p.id} className="card p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                      <div className="flex gap-4 items-start">
                        <img src={p.main_image || 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=200'} alt={p.title} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-white">{p.title}</p>
                          <p className="text-[#8B96A5] text-xs">{p.location}</p>
                          <div className="flex gap-3 mt-1 text-xs text-[#8B96A5]">
                            {p.price_per_night && <span>🌙 €{p.price_per_night}/noche</span>}
                            {p.price_high_season && <span>☀️ Alta: €{p.price_high_season}</span>}
                            {p.price_low_season && <span>❄️ Baja: €{p.price_low_season}</span>}
                            {p.min_nights && <span>Min. {p.min_nights} noches</span>}
                          </div>
                        </div>
                      </div>
                      <button onClick={() => setRentalModal(p)} className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5">
                        <Plus size={13} /> Nueva Reserva
                      </button>
                    </div>
                    <MiniCalendar propertyId={p.id} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: CALENDARIO/AGENDA */}
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
                <span className={`text-xs px-2.5 py-1 rounded border font-medium ${c.status === 'available' ? 'text-[#1B7F6F] border-[#1B7F6F]/30 bg-[#1B7F6F]/10' : c.status === 'visit' ? 'text-[#C9A84C] border-[#C9A84C]/30 bg-[#C9A84C]/10' : 'text-red-400 border-red-400/30 bg-red-400/10'}`}>
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
