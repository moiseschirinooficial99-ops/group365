'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, X, Phone, Check, Ban } from 'lucide-react'

const KIND_LABEL: Record<string, string> = {
  llamada: '📞 Llamada', visita: '🏠 Visita', videollamada: '🎥 Videollamada', reunion: '🤝 Reunión',
}
const STATUS_STYLE: Record<string, string> = {
  pendiente: 'text-[#C9A84C] border-[#C9A84C]/30 bg-[#C9A84C]/10',
  confirmada: 'text-[#1B7F6F] border-[#1B7F6F]/30 bg-[#1B7F6F]/10',
  realizada: 'text-green-400 border-green-500/30 bg-green-500/10',
  cancelada: 'text-red-400 border-red-500/30 bg-red-500/10',
  no_show: 'text-gray-400 border-white/10 bg-white/5',
}
const STATUS_LABEL: Record<string, string> = {
  pendiente: 'Pendiente', confirmada: 'Confirmada', realizada: 'Realizada', cancelada: 'Cancelada', no_show: 'No se presentó',
}
const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const hora = (iso: string) => new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

export default function AgendaPage() {
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const [selected, setSelected] = useState(() => dayKey(new Date()))
  const [citas, setCitas] = useState<any[]>([])
  const [bloques, setBloques] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<null | Record<string, any>>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const from = new Date(month.getFullYear(), month.getMonth(), -6).toISOString()
    const to = new Date(month.getFullYear(), month.getMonth() + 1, 7).toISOString()
    const res = await fetch(`/api/admin/citas?from=${from}&to=${to}`)
    if (res.ok) {
      const data = await res.json()
      setCitas(data.citas || [])
      setBloques(data.bloques || [])
    }
    setLoading(false)
  }, [month])

  useEffect(() => { load() }, [load])

  const byDay = useMemo(() => {
    const map: Record<string, any[]> = {}
    for (const c of citas) (map[dayKey(new Date(c.starts_at))] ||= []).push(c)
    return map
  }, [citas])

  const grid = useMemo(() => {
    const first = (month.getDay() + 6) % 7
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
    return [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))]
  }, [month])

  const proximas = citas.filter(c => new Date(c.starts_at) >= new Date() && ['pendiente', 'confirmada'].includes(c.status)).slice(0, 6)
  const delDia = byDay[selected] || []
  const bloquesDelDia = bloques.filter(b => dayKey(new Date(b.date_from)) === selected)

  const openNew = () => setForm({ name: '', phone: '', kind: 'llamada', date: selected, time: '10:00', duration_min: 30, notes: '' })

  const save = async () => {
    if (!form) return
    if (!form.name || !form.date || !form.time) { setError('Nombre, día y hora son obligatorios'); return }
    setSaving(true); setError('')
    const starts_at = new Date(`${form.date}T${form.time}:00`).toISOString()
    const res = await fetch('/api/admin/citas', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, phone: form.phone || null, kind: form.kind, starts_at, duration_min: Number(form.duration_min) || 30, notes: form.notes || null }),
    })
    setSaving(false)
    if (!res.ok) { setError((await res.json()).error || 'No se pudo guardar'); return }
    setForm(null); setSelected(form.date); load()
  }

  const setStatus = async (id: string, status: string) => {
    await fetch(`/api/admin/citas?id=${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    load()
  }

  return (
    <main className="min-h-screen bg-[#0F1419] p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="p-2 rounded-lg bg-[#161D26] border border-white/5 text-[#8B96A5] hover:text-white"><ArrowLeft size={16} /></Link>
            <h1 className="font-playfair text-2xl md:text-3xl font-bold"><span className="gold-text">Agenda</span> <span className="text-white/40 text-lg">citas con José Luis</span></h1>
          </div>
          <button onClick={openNew} className="flex items-center gap-2 btn-primary px-5 py-2.5 text-sm"><Plus size={16} /> Nueva cita</button>
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          {/* Calendario */}
          <div className="card p-4 md:p-5">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="p-2 rounded-lg hover:bg-white/5 text-[#8B96A5]"><ChevronLeft size={18} /></button>
              <div className="text-white font-semibold capitalize">{month.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</div>
              <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="p-2 rounded-lg hover:bg-white/5 text-[#8B96A5]"><ChevronRight size={18} /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-[#8B96A5] mb-1">
              {WEEKDAYS.map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {grid.map((d, i) => {
                if (!d) return <div key={i} />
                const k = dayKey(d)
                const items = byDay[k] || []
                const isToday = k === dayKey(new Date())
                const isSel = k === selected
                return (
                  <button key={i} onClick={() => setSelected(k)}
                    className={`min-h-[64px] md:min-h-[84px] rounded-lg p-1.5 text-left border transition-colors ${isSel ? 'border-[#C9A84C] bg-[#C9A84C]/10' : 'border-white/5 hover:border-white/15 bg-[#0F1419]/40'}`}>
                    <div className={`text-xs mb-1 ${isToday ? 'text-[#C9A84C] font-bold' : 'text-[#8B96A5]'}`}>{d.getDate()}</div>
                    <div className="space-y-0.5">
                      {items.slice(0, 2).map(c => (
                        <div key={c.id} className={`text-[10px] truncate rounded px-1 ${c.status === 'cancelada' ? 'line-through text-gray-500' : 'text-white bg-[#1B7F6F]/25'}`}>
                          {hora(c.starts_at)} {c.name}
                        </div>
                      ))}
                      {items.length > 2 && <div className="text-[10px] text-[#8B96A5]">+{items.length - 2} más</div>}
                    </div>
                  </button>
                )
              })}
            </div>
            {loading && <p className="text-[#8B96A5] text-xs mt-3">Cargando…</p>}
          </div>

          {/* Día seleccionado + próximas */}
          <div className="space-y-6">
            <div className="card p-5">
              <h2 className="text-white font-semibold mb-3 capitalize">
                {new Date(`${selected}T12:00:00`).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h2>
              {delDia.length === 0 && bloquesDelDia.length === 0 && <p className="text-[#8B96A5] text-sm">Sin citas este día.</p>}
              <div className="space-y-3">
                {delDia.map(c => (
                  <div key={c.id} className="rounded-lg border border-white/5 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-white text-sm font-medium">{hora(c.starts_at)} · {KIND_LABEL[c.kind] || c.kind}</div>
                        <div className="text-[#C9A84C] text-sm">{c.name}</div>
                        {c.properties?.title && <div className="text-[#8B96A5] text-xs">🏠 {c.properties.title}</div>}
                        {c.notes && <div className="text-[#8B96A5] text-xs mt-1">{c.notes}</div>}
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded border whitespace-nowrap ${STATUS_STYLE[c.status]}`}>{STATUS_LABEL[c.status]}</span>
                    </div>
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {c.phone && <a href={`https://wa.me/${String(c.phone).replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-[#1B7F6F]/15 text-[#1B7F6F] border border-[#1B7F6F]/30"><Phone size={10} /> WhatsApp</a>}
                      {c.status === 'pendiente' && <button onClick={() => setStatus(c.id, 'confirmada')} className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-[#1B7F6F]/15 text-[#1B7F6F] border border-[#1B7F6F]/30"><Check size={10} /> Confirmar</button>}
                      {['pendiente', 'confirmada'].includes(c.status) && <>
                        <button onClick={() => setStatus(c.id, 'realizada')} className="text-[10px] px-2 py-1 rounded bg-green-500/15 text-green-400 border border-green-500/30">Realizada</button>
                        <button onClick={() => setStatus(c.id, 'no_show')} className="text-[10px] px-2 py-1 rounded bg-white/5 text-gray-400 border border-white/10">No vino</button>
                        <button onClick={() => setStatus(c.id, 'cancelada')} className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-red-500/15 text-red-400 border border-red-500/30"><Ban size={10} /> Cancelar</button>
                      </>}
                    </div>
                  </div>
                ))}
                {bloquesDelDia.map(b => (
                  <div key={b.id} className="rounded-lg border border-dashed border-white/10 p-3 text-xs text-[#8B96A5]">
                    {hora(b.date_from)}–{hora(b.date_to)} · {b.status === 'available' ? '🟢 Disponible' : b.status === 'busy' ? '🔴 Ocupado' : '📌'} {b.notes}
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <h2 className="text-white font-semibold mb-3">Próximas citas</h2>
              {proximas.length === 0 ? <p className="text-[#8B96A5] text-sm">No hay citas pendientes.</p> : (
                <div className="space-y-2">
                  {proximas.map(c => (
                    <button key={c.id} onClick={() => { const d = new Date(c.starts_at); setMonth(new Date(d.getFullYear(), d.getMonth(), 1)); setSelected(dayKey(d)) }}
                      className="w-full text-left text-sm flex justify-between gap-2 hover:bg-white/5 rounded px-2 py-1.5">
                      <span className="text-white truncate">{KIND_LABEL[c.kind]?.split(' ')[0]} {c.name}</span>
                      <span className="text-[#8B96A5] text-xs whitespace-nowrap">{new Date(c.starts_at).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    </button>
                  ))}
                </div>
              )}
              <p className="text-[#8B96A5] text-[11px] mt-4">También desde Telegram: <code>/llamada 15/10 17:30 Nombre</code> o <code>/visita …</code>. Recordatorio automático 45 min antes.</p>
            </div>
          </div>
        </div>
      </div>

      {form && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setForm(null)}>
          <div className="card p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Nueva cita</h3>
              <button onClick={() => setForm(null)} className="text-[#8B96A5] hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <input className="input w-full" placeholder="Nombre del cliente *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <input className="input w-full" placeholder="Teléfono (WhatsApp)" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <select className="input w-full" value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value, duration_min: e.target.value === 'visita' ? 60 : 30 })}>
                  {Object.entries(KIND_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <select className="input w-full" value={form.duration_min} onChange={e => setForm({ ...form, duration_min: e.target.value })}>
                  {[15, 30, 45, 60, 90, 120].map(m => <option key={m} value={m}>{m} min</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="date" className="input w-full" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                <input type="time" className="input w-full" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
              </div>
              <textarea className="input w-full" rows={3} placeholder="Notas (propiedad, qué busca…)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button onClick={save} disabled={saving} className="btn-primary w-full py-3 text-sm disabled:opacity-50">{saving ? 'Guardando…' : 'Guardar cita'}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
