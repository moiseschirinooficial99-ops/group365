'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, Phone, CalendarPlus, Bell, X } from 'lucide-react'

// Mismas fases que ya usa `leads.status` en el panel principal.
const STAGES = [
  { id: 'new', label: 'Nuevo', color: 'border-blue-500/40', dot: 'bg-blue-400' },
  { id: 'contacted', label: 'Contactado', color: 'border-yellow-500/40', dot: 'bg-yellow-400' },
  { id: 'qualified', label: 'Cita / Cualificado', color: 'border-purple-500/40', dot: 'bg-purple-400' },
  { id: 'converted', label: 'Cerrado ✓', color: 'border-green-500/40', dot: 'bg-green-400' },
  { id: 'lost', label: 'Perdido', color: 'border-red-500/30', dot: 'bg-red-400' },
] as const

const TYPE_LABEL: Record<string, string> = {
  vendedor: '🏠 Vendedor', comprador: '🔑 Comprador', inversor: '💰 Inversor', inversores: '💰 Inversor',
  alquiler: '🏖️ Alquiler', contacto: '✉️ Contacto', newsletter: '📩 Newsletter',
}

const fmt = (iso?: string | null) => iso ? new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : ''
const inDays = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); d.setHours(10, 0, 0, 0); return d.toISOString() }

export default function CrmPage() {
  const [leads, setLeads] = useState<any[]>([])
  const [q, setQ] = useState('')
  const [type, setType] = useState('todos')
  const [soloVencidos, setSoloVencidos] = useState(false)
  const [cita, setCita] = useState<any>(null)
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    const res = await fetch('/api/leads')
    if (res.ok) setLeads(await res.json())
  }, [])
  useEffect(() => { load() }, [load])

  const patch = async (id: string, body: Record<string, any>) => {
    setLeads(ls => ls.map(l => l.id === id ? { ...l, ...body } : l))
    await fetch(`/api/leads?id=${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  }

  const now = Date.now()
  const vencido = (l: any) => l.next_follow_up_at && new Date(l.next_follow_up_at).getTime() <= now && !['converted', 'lost'].includes(l.status)

  const filtered = useMemo(() => leads.filter(l => {
    if (l.type === 'newsletter') return false
    if (type !== 'todos' && (l.type || 'contacto') !== type) return false
    if (soloVencidos && !vencido(l)) return false
    if (q) {
      const s = `${l.name || ''} ${l.email || ''} ${l.phone || ''} ${l.notes || ''}`.toLowerCase()
      if (!s.includes(q.toLowerCase())) return false
    }
    return true
  }), [leads, q, type, soloVencidos]) // eslint-disable-line react-hooks/exhaustive-deps

  const totalVencidos = leads.filter(vencido).length

  const guardarCita = async () => {
    if (!cita?.date || !cita?.time) return
    const res = await fetch('/api/admin/citas', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: cita.lead.name || 'Cliente', phone: cita.lead.phone, email: cita.lead.email, lead_id: cita.lead.id,
        kind: cita.kind, starts_at: new Date(`${cita.date}T${cita.time}:00`).toISOString(), notes: cita.notes || null,
      }),
    })
    if (res.ok) { setCita(null); setMsg('Cita creada y avisada por Telegram'); load(); setTimeout(() => setMsg(''), 3000) }
  }

  return (
    <main className="min-h-screen bg-[#0F1419] p-4 md:p-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="p-2 rounded-lg bg-[#161D26] border border-white/5 text-[#8B96A5] hover:text-white"><ArrowLeft size={16} /></Link>
            <h1 className="font-playfair text-2xl md:text-3xl font-bold"><span className="gold-text">CRM</span> <span className="text-white/40 text-lg">embudo y seguimiento</span></h1>
          </div>
          <Link href="/admin/agenda" className="text-sm px-4 py-2 rounded-lg bg-[#161D26] border border-white/5 text-[#8B96A5] hover:text-white">Ver agenda →</Link>
        </div>

        <div className="flex gap-2 mb-5 flex-wrap items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B96A5]" />
            <input className="input w-full pl-8" placeholder="Buscar nombre, teléfono, nota…" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <select className="input" value={type} onChange={e => setType(e.target.value)}>
            <option value="todos">Todos los tipos</option>
            {['comprador', 'vendedor', 'inversor', 'alquiler', 'contacto'].map(t => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
          </select>
          <button onClick={() => setSoloVencidos(v => !v)}
            className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border ${soloVencidos ? 'bg-red-500/15 border-red-500/40 text-red-300' : 'bg-[#161D26] border-white/5 text-[#8B96A5]'}`}>
            <Bell size={14} /> Seguimientos vencidos ({totalVencidos})
          </button>
          {msg && <span className="text-[#1B7F6F] text-sm">{msg}</span>}
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map(stage => {
            const items = filtered.filter(l => (l.status || 'new') === stage.id)
            return (
              <div key={stage.id} className="w-[290px] shrink-0">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className={`w-2 h-2 rounded-full ${stage.dot}`} />
                  <span className="text-white text-sm font-semibold">{stage.label}</span>
                  <span className="text-[#8B96A5] text-xs">{items.length}</span>
                </div>
                <div className="space-y-2.5">
                  {items.map(l => (
                    <div key={l.id} className={`card p-3 border-l-2 ${stage.color} ${vencido(l) ? 'ring-1 ring-red-500/40' : ''}`}>
                      <div className="flex justify-between gap-2">
                        <div className="text-white text-sm font-medium truncate">{l.name || 'Sin nombre'}</div>
                        {l.scoring_result > 0 && <span className="text-[10px] text-[#C9A84C]">{l.scoring_result}%</span>}
                      </div>
                      <div className="text-[11px] text-[#8B96A5] mt-0.5">{TYPE_LABEL[l.type] || TYPE_LABEL.contacto} · {l.source || '—'} · {fmt(l.created_at)}</div>
                      {l.notes && <div className="text-[11px] text-[#8B96A5] mt-1 line-clamp-2">{l.notes}</div>}
                      {l.next_follow_up_at && (
                        <div className={`text-[11px] mt-1.5 ${vencido(l) ? 'text-red-400 font-medium' : 'text-[#C9A84C]'}`}>
                          🔔 Seguimiento: {fmt(l.next_follow_up_at)}{vencido(l) ? ' (vencido)' : ''}
                        </div>
                      )}

                      <div className="flex gap-1 mt-2 flex-wrap">
                        {l.phone && (
                          <a href={`https://wa.me/${String(l.phone).replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                            onClick={() => patch(l.id, { last_contact_at: new Date().toISOString(), ...(l.status === 'new' ? { status: 'contacted' } : {}) })}
                            className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-[#1B7F6F]/15 text-[#1B7F6F] border border-[#1B7F6F]/30"><Phone size={10} /> WhatsApp</a>
                        )}
                        <button onClick={() => setCita({ lead: l, kind: 'llamada', date: inDays(1).slice(0, 10), time: '10:00', notes: '' })}
                          className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30"><CalendarPlus size={10} /> Cita</button>
                        {[1, 3, 7].map(n => (
                          <button key={n} onClick={() => patch(l.id, { next_follow_up_at: inDays(n) })}
                            className="text-[10px] px-2 py-1 rounded bg-white/5 text-[#8B96A5] border border-white/10 hover:text-white">+{n}d</button>
                        ))}
                        {l.next_follow_up_at && (
                          <button onClick={() => patch(l.id, { next_follow_up_at: null })} className="text-[10px] px-1.5 py-1 rounded text-[#8B96A5] hover:text-white" title="Quitar seguimiento"><X size={10} /></button>
                        )}
                      </div>

                      <select value={l.status || 'new'} onChange={e => patch(l.id, { status: e.target.value })}
                        className="mt-2 w-full text-[11px] bg-[#0F1419] border border-white/10 rounded px-2 py-1 text-[#8B96A5]">
                        {STAGES.map(s => <option key={s.id} value={s.id}>Mover a: {s.label}</option>)}
                      </select>
                    </div>
                  ))}
                  {items.length === 0 && <div className="text-[#8B96A5]/60 text-xs px-1">—</div>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {cita && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setCita(null)}>
          <div className="card p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-semibold mb-1">Agendar con José Luis</h3>
            <p className="text-[#8B96A5] text-sm mb-4">{cita.lead.name || 'Cliente'} {cita.lead.phone ? `· ${cita.lead.phone}` : ''}</p>
            <div className="space-y-3">
              <select className="input w-full" value={cita.kind} onChange={e => setCita({ ...cita, kind: e.target.value })}>
                <option value="llamada">📞 Llamada</option><option value="videollamada">🎥 Videollamada</option>
                <option value="visita">🏠 Visita</option><option value="reunion">🤝 Reunión</option>
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input type="date" className="input w-full" value={cita.date} onChange={e => setCita({ ...cita, date: e.target.value })} />
                <input type="time" className="input w-full" value={cita.time} onChange={e => setCita({ ...cita, time: e.target.value })} />
              </div>
              <textarea className="input w-full" rows={2} placeholder="Notas" value={cita.notes} onChange={e => setCita({ ...cita, notes: e.target.value })} />
              <button onClick={guardarCita} className="btn-primary w-full py-3 text-sm">Guardar cita</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
