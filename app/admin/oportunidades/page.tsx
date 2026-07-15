'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ArrowLeft, Loader2, X, Pencil, Eye, EyeOff, CheckCircle, Sparkles, Upload, Trash2, ImageIcon } from 'lucide-react'

type Category = 'npl' | 'reo' | 'cesion_remate' | 'producto_ocupado' | 'fondo'

const CATEGORIES: { id: Category; label: string; icon: string; color: string }[] = [
  { id: 'npl',             label: 'NPL',               icon: '📋', color: 'text-[#C9A84C]' },
  { id: 'reo',             label: 'REO',               icon: '🏦', color: 'text-[#1B7F6F]' },
  { id: 'cesion_remate',   label: 'Cesión de Remate',  icon: '⚖️', color: 'text-blue-400' },
  { id: 'producto_ocupado',label: 'Producto Ocupado',  icon: '🔑', color: 'text-orange-400' },
  { id: 'fondo',           label: 'Fondo GROUP 360',   icon: '💼', color: 'text-purple-400' },
]

const STATUS_BADGE: Record<string, string> = {
  disponible: 'bg-green-500/15 text-green-400 border-green-500/30',
  reservado:  'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  cerrado:    'bg-red-500/15 text-red-400 border-red-500/30',
}

const EMPTY_FORM = {
  title: '',
  location: '',
  description: '',
  debt_value: '',
  offer_price: '',
  property_value: '',
  roi_estimated: '',
  annual_return_pct: '',
  judicial_phase: '',
  occupancy_status: '',
  minimum_investment: '',
  estimated_timeline: '',
  status: 'disponible',
  is_public: true,
  images: [] as string[],
}

async function uploadFile(file: File): Promise<string | null> {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch('/api/admin/upload-image', { method: 'POST', body: fd })
  const { url } = await res.json().catch(() => ({ url: null }))
  return url || null
}

function OpForm({
  category,
  initial,
  onSave,
  onCancel,
  saving,
}: {
  category: Category
  initial?: any
  onSave: (data: any) => void
  onCancel: () => void
  saving: boolean
}) {
  const [form, setForm] = useState(initial ? {
    title: initial.title || '',
    location: initial.location || '',
    description: initial.description || '',
    debt_value: initial.debt_value != null ? String(initial.debt_value) : '',
    offer_price: initial.offer_price != null ? String(initial.offer_price) : '',
    property_value: initial.property_value != null ? String(initial.property_value) : '',
    roi_estimated: initial.roi_estimated != null ? String(initial.roi_estimated) : '',
    annual_return_pct: initial.annual_return_pct != null ? String(initial.annual_return_pct) : '',
    judicial_phase: initial.judicial_phase || '',
    occupancy_status: initial.occupancy_status || '',
    minimum_investment: initial.minimum_investment != null ? String(initial.minimum_investment) : '',
    estimated_timeline: initial.estimated_timeline || '',
    status: initial.status || 'disponible',
    is_public: initial.is_public ?? true,
    images: Array.isArray(initial.images) ? initial.images : [],
  } : { ...EMPTY_FORM, images: [] })

  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [aiNote, setAiNote] = useState<string | null>(null)

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))
  const num = (v: string) => v ? Number(v) : null

  // Subida manual de fotos
  const handlePhotos = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    const urls: string[] = []
    for (const file of Array.from(files)) {
      const url = await uploadFile(file)
      if (url) urls.push(url)
    }
    setForm(f => ({ ...f, images: [...f.images, ...urls] }))
    setUploading(false)
  }

  const removeImage = (url: string) =>
    setForm(f => ({ ...f, images: f.images.filter((i: string) => i !== url) }))

  // Analizar flyer con IA: sube la imagen y prellena el formulario
  const handleAnalyze = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setAnalyzing(true)
    setAiNote(null)
    try {
      const url = await uploadFile(files[0])
      if (!url) { setAiNote('No se pudo subir la imagen.'); return }
      const res = await fetch('/api/admin/analyze-opportunity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: url }),
      })
      const data = await res.json()
      if (!res.ok || !data.fields) {
        setForm(f => ({ ...f, images: [...f.images, url] }))
        setAiNote(data.error ? `La IA no pudo leer el flyer (${data.error}). La imagen se subió igual — rellena los campos a mano.` : 'La IA no devolvió datos. La imagen se subió igual.')
        return
      }
      const x = data.fields
      const s = (v: any) => (v === null || v === undefined ? '' : String(v))
      setForm(f => ({
        ...f,
        title: x.title || f.title,
        location: x.location || f.location,
        description: x.description || f.description,
        offer_price: s(x.offer_price) || f.offer_price,
        property_value: s(x.property_value) || f.property_value,
        debt_value: s(x.debt_value) || f.debt_value,
        roi_estimated: s(x.roi_estimated) || f.roi_estimated,
        estimated_timeline: x.estimated_timeline || f.estimated_timeline,
        images: [...f.images, url],
      }))
      setAiNote('✓ Flyer analizado. Revisa los campos y corrige lo que haga falta antes de publicar.')
    } catch (e: any) {
      setAiNote('Error analizando el flyer: ' + e.message)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleSubmit = () => {
    if (!form.title.trim()) return
    const payload: any = {
      category,
      title: form.title.trim(),
      location: form.location.trim() || null,
      description: form.description.trim() || null,
      status: form.status,
      is_public: form.is_public,
      estimated_timeline: form.estimated_timeline.trim() || null,
      images: form.images,
    }
    if (category !== 'fondo') {
      payload.debt_value = num(form.debt_value)
      payload.offer_price = num(form.offer_price)
      payload.property_value = num(form.property_value)
      payload.roi_estimated = num(form.roi_estimated)
    }
    if (category === 'fondo') {
      payload.annual_return_pct = num(form.annual_return_pct)
      payload.minimum_investment = num(form.minimum_investment)
    }
    if (category === 'npl') {
      payload.judicial_phase = form.judicial_phase || null
    }
    if (category === 'producto_ocupado') {
      payload.occupancy_status = form.occupancy_status || null
    }
    onSave(payload)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="card p-6 mb-4 border border-[#C9A84C]/20"
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-playfair font-bold text-base">
          {initial ? 'Editar oportunidad' : 'Nueva oportunidad'} — {CATEGORIES.find(c => c.id === category)?.label}
        </h3>
        <button onClick={onCancel}><X size={16} className="text-[#8B96A5]" /></button>
      </div>

      {/* Analizar flyer con IA */}
      <div className="mb-5 rounded-xl border border-[#C9A84C]/25 bg-[#C9A84C]/5 p-4">
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles size={15} className="text-[#C9A84C]" />
          <span className="text-sm font-semibold text-[#C9A84C]">Rellenar automáticamente con IA</span>
        </div>
        <p className="text-xs text-[#8B96A5] mb-3">
          Sube el flyer, foto o ficha de la oportunidad y la IA rellena los campos sola. Tú revisas antes de publicar.
        </p>
        <label className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
          analyzing ? 'bg-[#C9A84C]/20 text-[#C9A84C] cursor-wait' : 'bg-[#C9A84C] text-[#0F1419] hover:opacity-90'
        }`}>
          {analyzing
            ? <><Loader2 size={15} className="animate-spin" /> Analizando flyer...</>
            : <><Sparkles size={15} /> Pegar flyer / foto y analizar</>}
          <input type="file" accept="image/*" className="hidden" disabled={analyzing}
            onChange={e => { handleAnalyze(e.target.files); e.currentTarget.value = '' }} />
        </label>
        {aiNote && <p className="text-xs mt-2.5 text-[#8B96A5]">{aiNote}</p>}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="text-xs text-[#8B96A5] block mb-1.5">Título *</label>
          <input className="input" placeholder="NPL — Vivienda unifamiliar Málaga..." value={form.title} onChange={e => set('title', e.target.value)} />
        </div>

        <div>
          <label className="text-xs text-[#8B96A5] block mb-1.5">Ubicación</label>
          <input className="input" placeholder="Málaga, Andalucía" value={form.location} onChange={e => set('location', e.target.value)} />
        </div>

        <div>
          <label className="text-xs text-[#8B96A5] block mb-1.5">Plazo estimado</label>
          <input className="input" placeholder="8-16 meses" value={form.estimated_timeline} onChange={e => set('estimated_timeline', e.target.value)} />
        </div>

        {category !== 'fondo' && <>
          <div>
            <label className="text-xs text-[#8B96A5] block mb-1.5">Valor deuda (€)</label>
            <input className="input" type="number" placeholder="80000" value={form.debt_value} onChange={e => set('debt_value', e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-[#8B96A5] block mb-1.5">Precio oferta (€)</label>
            <input className="input" type="number" placeholder="35000" value={form.offer_price} onChange={e => set('offer_price', e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-[#8B96A5] block mb-1.5">Valor propiedad (€)</label>
            <input className="input" type="number" placeholder="150000" value={form.property_value} onChange={e => set('property_value', e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-[#8B96A5] block mb-1.5">ROI estimado (%)</label>
            <input className="input" type="number" placeholder="45" value={form.roi_estimated} onChange={e => set('roi_estimated', e.target.value)} />
          </div>
        </>}

        {category === 'npl' && (
          <div>
            <label className="text-xs text-[#8B96A5] block mb-1.5">Fase judicial</label>
            <input className="input" placeholder="Demanda presentada, fase subasta..." value={form.judicial_phase} onChange={e => set('judicial_phase', e.target.value)} />
          </div>
        )}

        {category === 'producto_ocupado' && (
          <div>
            <label className="text-xs text-[#8B96A5] block mb-1.5">Estado ocupación</label>
            <input className="input" placeholder="Ocupado por propietario anterior" value={form.occupancy_status} onChange={e => set('occupancy_status', e.target.value)} />
          </div>
        )}

        {category === 'fondo' && <>
          <div>
            <label className="text-xs text-[#8B96A5] block mb-1.5">Retribución anual (%)</label>
            <input className="input" type="number" placeholder="30" value={form.annual_return_pct} onChange={e => set('annual_return_pct', e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-[#8B96A5] block mb-1.5">Inversión mínima (€)</label>
            <input className="input" type="number" placeholder="10000" value={form.minimum_investment} onChange={e => set('minimum_investment', e.target.value)} />
          </div>
        </>}

        <div className="md:col-span-2">
          <label className="text-xs text-[#8B96A5] block mb-1.5">Descripción</label>
          <textarea className="input resize-none h-20" value={form.description} onChange={e => set('description', e.target.value)} />
        </div>

        {/* Fotos / flyer */}
        <div className="md:col-span-2">
          <label className="text-xs text-[#8B96A5] block mb-1.5 flex items-center gap-1.5">
            <ImageIcon size={13} /> Fotos y flyer de la oportunidad
          </label>
          <div className="flex flex-wrap gap-3">
            {form.images.map((url: string) => (
              <div key={url} className="relative w-24 h-24 rounded-lg overflow-hidden border border-white/10 group">
                <img src={url} alt="foto" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  className="absolute top-1 right-1 bg-black/60 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={12} className="text-red-400" />
                </button>
              </div>
            ))}
            <label className={`w-24 h-24 rounded-lg border border-dashed border-white/20 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-[#C9A84C]/50 transition-colors ${uploading ? 'opacity-60 cursor-wait' : ''}`}>
              {uploading
                ? <Loader2 size={16} className="animate-spin text-[#8B96A5]" />
                : <Upload size={16} className="text-[#8B96A5]" />}
              <span className="text-[10px] text-[#8B96A5]">{uploading ? 'Subiendo...' : 'Añadir fotos'}</span>
              <input type="file" accept="image/*" multiple className="hidden" disabled={uploading}
                onChange={e => { handlePhotos(e.target.files); e.currentTarget.value = '' }} />
            </label>
          </div>
          <p className="text-[10px] text-[#8B96A5] mt-1.5">La primera imagen se usa como portada en el portal.</p>
        </div>

        <div>
          <label className="text-xs text-[#8B96A5] block mb-1.5">Estado</label>
          <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="disponible">Disponible</option>
            <option value="reservado">Reservado</option>
            <option value="cerrado">Cerrado</option>
          </select>
        </div>

        <div className="flex items-center gap-3 pt-5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 accent-[#C9A84C]" checked={form.is_public} onChange={e => set('is_public', e.target.checked)} />
            <span className="text-sm text-white">Visible en página pública</span>
          </label>
        </div>
      </div>

      <div className="flex gap-3 mt-5">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-lg border border-white/10 text-[#8B96A5] text-sm hover:text-white transition-colors">
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving || !form.title.trim()}
          className="flex-1 btn-primary py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {saving ? <><Loader2 size={15} className="animate-spin" /> Guardando...</> : <><CheckCircle size={15} /> Publicar</>}
        </button>
      </div>
    </motion.div>
  )
}

export default function AdminOportunidadesPage() {
  const [activeTab, setActiveTab] = useState<Category>('npl')
  const [opportunities, setOpportunities] = useState<Record<Category, any[]>>({
    npl: [], reo: [], cesion_remate: [], producto_ocupado: [], fondo: [],
  })
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [notifyInvestors, setNotifyInvestors] = useState(true)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/investment-opportunities').then(r => r.json()).catch(() => [])
    const all: any[] = Array.isArray(res) ? res : []
    const grouped: Record<Category, any[]> = { npl: [], reo: [], cesion_remate: [], producto_ocupado: [], fondo: [] }
    for (const op of all) {
      if (grouped[op.category as Category]) grouped[op.category as Category].push(op)
    }
    setOpportunities(grouped)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleSave = async (data: any) => {
    setSaving(true)
    try {
      if (editingId) {
        await fetch('/api/investment-opportunities', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...data }),
        })
      } else {
        await fetch('/api/investment-opportunities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, notify_investors: notifyInvestors }),
        })
      }
      setShowForm(false)
      setEditingId(null)
      await load()
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (id: string, currentStatus: string) => {
    const next = currentStatus === 'disponible' ? 'cerrado' : 'disponible'
    await fetch(`/api/investment-opportunities?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    await load()
  }

  const togglePublic = async (id: string, current: boolean) => {
    await fetch(`/api/investment-opportunities?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_public: !current }),
    })
    await load()
  }

  const currentOps = opportunities[activeTab] || []
  const editingOp = editingId ? currentOps.find(o => o.id === editingId) : null
  const cat = CATEGORIES.find(c => c.id === activeTab)!

  return (
    <main className="min-h-screen bg-[#0F1419] px-4 py-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="flex items-center gap-1.5 text-[#8B96A5] hover:text-white text-sm transition-colors">
              <ArrowLeft size={14} /> Panel
            </Link>
            <h1 className="font-playfair text-2xl font-bold">
              <span className="text-[#1B7F6F]">Oportunidades</span> <span className="text-[#C9A84C]">de Inversión</span>
            </h1>
          </div>
        </div>

        {/* Tabs de verticales */}
        <div className="flex gap-1 mb-6 bg-[#161D26] rounded-xl p-1 overflow-x-auto">
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => { setActiveTab(c.id); setShowForm(false); setEditingId(null) }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex-1 justify-center ${
                activeTab === c.id ? 'bg-[#C9A84C] text-[#0F1419]' : 'text-[#8B96A5] hover:text-white'
              }`}
            >
              {c.icon} {c.label}
              <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === c.id ? 'bg-[#0F1419]/20 text-[#0F1419]' : 'bg-white/5 text-[#8B96A5]'}`}>
                {(opportunities[c.id] || []).length}
              </span>
            </button>
          ))}
        </div>

        {/* Botón nueva + toggle notificación */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {!showForm && !editingId && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 btn-primary text-sm px-5 py-2.5"
              >
                <Plus size={15} /> Nueva oportunidad en {cat.label}
              </button>
            )}
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 accent-[#C9A84C]" checked={notifyInvestors} onChange={e => setNotifyInvestors(e.target.checked)} />
              <span className="text-xs text-[#8B96A5]">Notificar inversores al publicar</span>
            </label>
          </div>
        </div>

        {/* Formulario nueva/editar */}
        <AnimatePresence>
          {(showForm || editingId) && (
            <OpForm
              key={editingId || 'new'}
              category={activeTab}
              initial={editingOp}
              onSave={handleSave}
              onCancel={() => { setShowForm(false); setEditingId(null) }}
              saving={saving}
            />
          )}
        </AnimatePresence>

        {/* Lista de oportunidades */}
        {loading ? (
          <div className="card p-12 text-center text-[#8B96A5]">
            <Loader2 size={24} className="animate-spin mx-auto mb-2" /> Cargando...
          </div>
        ) : currentOps.length === 0 ? (
          <div className="card p-12 text-center">
            <span className="text-4xl mb-3 block">{cat.icon}</span>
            <p className="text-[#8B96A5]">No hay oportunidades en {cat.label} todavía.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {currentOps.map(op => {
              const roi = op.roi_estimated || op.annual_return_pct
              return (
                <motion.div
                  key={op.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card p-5 flex flex-wrap items-start justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${STATUS_BADGE[op.status] || STATUS_BADGE.disponible}`}>
                        {op.status}
                      </span>
                      {!op.is_public && (
                        <span className="text-[10px] px-2 py-0.5 rounded border font-semibold bg-purple-500/10 text-purple-400 border-purple-500/30">
                          Solo verificados
                        </span>
                      )}
                      {roi && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#C9A84C]/10 text-[#C9A84C] border border-[#C9A84C]/20 font-bold">
                          {roi}% ROI
                        </span>
                      )}
                    </div>
                    <p className="text-white font-semibold text-sm">{op.title}</p>
                    {op.location && <p className="text-[#8B96A5] text-xs mt-0.5">📍 {op.location}</p>}
                    <div className="flex gap-4 mt-1 text-[10px] text-[#8B96A5]">
                      {op.offer_price && <span>Precio: €{Number(op.offer_price).toLocaleString('es-ES')}</span>}
                      {op.property_value && <span>Valor inmueble: €{Number(op.property_value).toLocaleString('es-ES')}</span>}
                      {op.minimum_investment && <span>Mín.: €{Number(op.minimum_investment).toLocaleString('es-ES')}</span>}
                      {op.estimated_timeline && <span>Plazo: {op.estimated_timeline}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => togglePublic(op.id, op.is_public)}
                      className={`flex items-center gap-1 text-[10px] px-3 py-1.5 rounded-lg border transition-colors ${
                        op.is_public
                          ? 'bg-[#1B7F6F]/10 text-[#1B7F6F] border-[#1B7F6F]/30 hover:bg-[#1B7F6F]/20'
                          : 'bg-white/5 text-[#8B96A5] border-white/10 hover:text-white'
                      }`}
                    >
                      {op.is_public ? <><Eye size={10} /> Público</> : <><EyeOff size={10} /> Privado</>}
                    </button>
                    <button
                      onClick={() => toggleStatus(op.id, op.status)}
                      className={`text-[10px] px-3 py-1.5 rounded-lg border transition-colors ${
                        op.status === 'disponible'
                          ? 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                          : 'bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20'
                      }`}
                    >
                      {op.status === 'disponible' ? 'Cerrar' : 'Reabrir'}
                    </button>
                    <button
                      onClick={() => { setShowForm(false); setEditingId(op.id) }}
                      className="flex items-center gap-1 text-[10px] px-3 py-1.5 rounded-lg bg-[#C9A84C]/15 text-[#C9A84C] border border-[#C9A84C]/30 hover:bg-[#C9A84C]/25 transition-colors"
                    >
                      <Pencil size={10} /> Editar
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
