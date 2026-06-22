'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Upload, X, Loader2, Trash2, Save, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

// ── Price confirmation modal ───────────────────────────────────────────────
function PriceConfirmModal({
  original, nuevo, onClose, onConfirm,
}: { original: number; nuevo: number; onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card p-6 w-full max-w-sm">
        <h3 className="font-playfair text-lg font-bold mb-4">Confirmar cambio de precio</h3>
        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-[#8B96A5]">Precio anterior:</span>
            <span className="text-white line-through">€{original.toLocaleString('es-ES')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#8B96A5]">Precio nuevo:</span>
            <span className="text-[#C9A84C] font-bold">€{nuevo.toLocaleString('es-ES')}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-white/10 text-[#8B96A5] text-sm hover:text-white transition-colors">Cancelar</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-lg bg-[#C9A84C] text-[#0F1419] text-sm font-medium hover:bg-[#C9A84C]/90 transition-colors">Confirmar</button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Sold data modal ────────────────────────────────────────────────────────
function SoldModal({
  originalPrice, onClose, onConfirm,
}: { originalPrice: number; onClose: () => void; onConfirm: (data: { sold_date: string; sold_price: number; rental_notes: string; is_success_case: boolean }) => void }) {
  const [form, setForm] = useState({
    sold_date: new Date().toISOString().split('T')[0],
    sold_price: String(originalPrice || ''),
    rental_notes: '',
    is_success_case: false,
  })
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-playfair text-lg font-bold">Marcar como Vendida</h3>
          <button onClick={onClose}><X size={18} className="text-[#8B96A5]" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[#8B96A5] block mb-1.5">Fecha de venta</label>
            <input type="date" className="input" value={form.sold_date} onChange={e => setForm(f => ({ ...f, sold_date: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-[#8B96A5] block mb-1.5">Precio de venta final (€)</label>
            <input type="number" className="input" placeholder={String(originalPrice)} value={form.sold_price} onChange={e => setForm(f => ({ ...f, sold_price: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-[#8B96A5] block mb-1.5">Notas internas</label>
            <textarea className="input resize-none h-20" value={form.rental_notes} onChange={e => setForm(f => ({ ...f, rental_notes: e.target.value }))} />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 accent-[#C9A84C]" checked={form.is_success_case} onChange={e => setForm(f => ({ ...f, is_success_case: e.target.checked }))} />
            <span className="text-sm text-white">Publicar como <span className="text-[#C9A84C]">Caso de Éxito</span> en la web</span>
          </label>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-white/10 text-[#8B96A5] text-sm hover:text-white transition-colors">Cancelar</button>
          <button
            onClick={() => onConfirm({ sold_date: form.sold_date, sold_price: Number(form.sold_price) || originalPrice, rental_notes: form.rental_notes, is_success_case: form.is_success_case })}
            className="flex-1 py-2.5 rounded-lg bg-red-500/80 text-white text-sm font-medium hover:bg-red-500 transition-colors"
          >
            Confirmar Venta
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Delete confirmation modal ──────────────────────────────────────────────
function DeleteModal({ title, onClose, onConfirm }: { title: string; onClose: () => void; onConfirm: () => void }) {
  const [confirmed, setConfirmed] = useState(false)
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card p-6 w-full max-w-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
            <Trash2 size={18} className="text-red-400" />
          </div>
          <h3 className="font-playfair text-lg font-bold">Eliminar propiedad</h3>
        </div>
        <p className="text-[#8B96A5] text-sm mb-2 truncate">"{title}"</p>
        <p className="text-[#8B96A5] text-xs mb-5">La propiedad quedará archivada (no se borrará del historial).</p>
        {!confirmed ? (
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-white/10 text-[#8B96A5] text-sm hover:text-white transition-colors">Cancelar</button>
            <button onClick={() => setConfirmed(true)} className="flex-1 py-2.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 text-sm font-medium hover:bg-red-500/30 transition-colors">Eliminar</button>
          </div>
        ) : (
          <div>
            <p className="text-red-400 text-xs font-bold mb-3 text-center">¿SEGURO? Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-white/10 text-[#8B96A5] text-sm hover:text-white transition-colors">Cancelar</button>
              <button onClick={onConfirm} className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors">Sí, eliminar</button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

// ── Main edit page ─────────────────────────────────────────────────────────
export default function EditarPropiedadPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [property, setProperty] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveOk, setSaveOk] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
    channel: 'personal',
    status: 'disponible',
    bedrooms: '',
    bathrooms: '',
    area_sqm: '',
    plot_m2: '',
    estimated_roi: '',
    price_per_night: '',
  })
  const [consultarPrecio, setConsultarPrecio] = useState(false)

  const [existingImages, setExistingImages] = useState<string[]>([])
  const [deletedImages, setDeletedImages] = useState<string[]>([])
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [newPreviews, setNewPreviews] = useState<string[]>([])

  const [showPriceConfirm, setShowPriceConfirm] = useState(false)
  const [showSoldModal, setShowSoldModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [pendingSoldData, setPendingSoldData] = useState<any>(null)

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  // Load property
  useEffect(() => {
    if (!id) return
    fetch(`/api/properties?id=${id}`)
      .then(r => r.json())
      .then(data => {
        if (!data) { setError('Propiedad no encontrada'); setLoading(false); return }
        setProperty(data)
        setForm({
          title: data.title || '',
          description: data.description || '',
          price: data.price != null ? String(data.price) : '',
          location: data.location || '',
          channel: data.channel || 'personal',
          status: data.status || 'disponible',
          bedrooms: data.bedrooms != null ? String(data.bedrooms) : '',
          bathrooms: data.bathrooms != null ? String(data.bathrooms) : '',
          area_sqm: data.area_sqm != null ? String(data.area_sqm) : '',
          plot_m2: data.plot_m2 != null ? String(data.plot_m2) : '',
          estimated_roi: data.estimated_roi != null ? String(data.estimated_roi) : '',
          price_per_night: data.price_per_night != null ? String(data.price_per_night) : '',
        })
        setConsultarPrecio(!data.price || data.price === 0)
        const imgs: string[] = []
        if (Array.isArray(data.images) && data.images.length > 0) {
          imgs.push(...data.images)
        } else if (data.main_image) {
          imgs.push(data.main_image)
        }
        setExistingImages(imgs)
        setLoading(false)
      })
      .catch(() => { setError('Error cargando propiedad'); setLoading(false) })
  }, [id])

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    setNewFiles(prev => [...prev, ...selected])
    selected.forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => setNewPreviews(prev => [...prev, ev.target?.result as string])
      reader.readAsDataURL(file)
    })
  }

  const removeExisting = (url: string) => {
    setExistingImages(prev => prev.filter(u => u !== url))
    setDeletedImages(prev => [...prev, url])
  }

  const removeNew = (i: number) => {
    setNewFiles(prev => prev.filter((_, idx) => idx !== i))
    setNewPreviews(prev => prev.filter((_, idx) => idx !== i))
  }

  // Compute changes summary for Telegram
  const buildChangesSummary = (soldData?: any) => {
    if (!property) return ''
    const changes: string[] = []
    if (form.title !== property.title) changes.push(`Título: "${property.title}" → "${form.title}"`)
    const newPrice = consultarPrecio ? 0 : Number(form.price)
    if (newPrice !== Number(property.price)) changes.push(`Precio: €${Number(property.price).toLocaleString('es-ES')} → €${newPrice.toLocaleString('es-ES')}`)
    if (form.status !== (property.status || 'disponible')) changes.push(`Estado: ${property.status || 'disponible'} → ${form.status}`)
    if (form.location !== property.location) changes.push(`Ubicación: ${property.location} → ${form.location}`)
    if (deletedImages.length) changes.push(`Fotos eliminadas: ${deletedImages.length}`)
    if (newFiles.length) changes.push(`Fotos añadidas: ${newFiles.length}`)
    if (soldData) changes.push(`Venta: €${soldData.sold_price?.toLocaleString('es-ES')} el ${soldData.sold_date}`)
    return changes.join(', ') || 'Sin cambios detectados'
  }

  const executeUpdate = async (soldData?: any) => {
    setSaving(true)
    setError('')
    try {
      // Upload new photos
      const newImageUrls: string[] = []
      for (const file of newFiles) {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch('/api/admin/upload-image', { method: 'POST', body: fd })
        const { url, error: uploadErr } = await res.json()
        if (url) newImageUrls.push(url)
        else if (uploadErr) console.warn('Upload error:', uploadErr)
      }

      const finalImages = [
        ...existingImages.filter(u => !deletedImages.includes(u)),
        ...newImageUrls,
      ]

      const deleted_image_paths = deletedImages
        .map(url => {
          const marker = '/property-images/'
          const idx = url.indexOf(marker)
          return idx >= 0 ? url.slice(idx + marker.length) : null
        })
        .filter(Boolean) as string[]

      const updates: any = {
        title: form.title.trim(),
        description: form.description.trim(),
        price: consultarPrecio ? 0 : Number(form.price),
        location: form.location.trim(),
        channel: form.channel,
        status: form.status,
        bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
        area_sqm: form.area_sqm ? Number(form.area_sqm) : null,
        plot_m2: form.plot_m2 ? Number(form.plot_m2) : null,
        estimated_roi: form.estimated_roi ? Number(form.estimated_roi) : null,
        price_per_night: form.price_per_night ? Number(form.price_per_night) : null,
        images: finalImages,
        main_image: finalImages[0] || null,
        is_active: form.status !== 'vendida',
      }

      if (soldData) {
        updates.sold_date = soldData.sold_date
        updates.sold_price = soldData.sold_price
        updates.rental_notes = soldData.rental_notes
        updates.is_success_case = soldData.is_success_case
      }

      const res = await fetch('/api/properties', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          deleted_image_paths,
          changes_summary: buildChangesSummary(soldData),
          ...updates,
        }),
      })

      const json = await res.json()
      if (!json.ok) throw new Error(json.error || 'Error al guardar')

      setSaveOk(true)
      setTimeout(() => router.push('/admin?updated=1'), 1500)
    } catch (e: any) {
      setError(e.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveClick = () => {
    if (!form.title.trim()) { setError('El título no puede estar vacío'); return }
    if (!consultarPrecio && (!form.price || Number(form.price) <= 0)) { setError('El precio debe ser mayor que 0. Activa "Precio a consultar" si aplica.'); return }
    setError('')

    const goingVendida = form.status === 'vendida' && (property?.status || 'disponible') !== 'vendida'
    if (goingVendida) {
      setShowSoldModal(true)
      return
    }

    const priceChanged = !consultarPrecio && property && Number(form.price) !== Number(property.price)
    if (priceChanged) {
      setShowPriceConfirm(true)
      return
    }

    executeUpdate()
  }

  const handleSoldConfirm = (soldData: any) => {
    setShowSoldModal(false)
    setPendingSoldData(soldData)
    const priceChanged = !consultarPrecio && property && Number(form.price) !== Number(property.price)
    if (priceChanged) {
      setShowPriceConfirm(true)
    } else {
      executeUpdate(soldData)
    }
  }

  const handlePriceConfirm = () => {
    setShowPriceConfirm(false)
    executeUpdate(pendingSoldData || undefined)
  }

  const handleDelete = async () => {
    setShowDeleteModal(false)
    setSaving(true)
    try {
      const res = await fetch('/api/properties', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || 'Error al eliminar')
      router.push('/admin?deleted=1')
    } catch (e: any) {
      setError(e.message || 'Error al eliminar')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0F1419] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#C9A84C]" />
      </main>
    )
  }

  if (saveOk) {
    return (
      <main className="min-h-screen bg-[#0F1419] flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card p-10 text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-[#1B7F6F]/20 border border-[#1B7F6F]/30 flex items-center justify-center mx-auto mb-5">
            <span className="text-3xl">✅</span>
          </div>
          <h2 className="font-playfair text-xl font-bold mb-2">Propiedad actualizada</h2>
          <p className="text-[#8B96A5] text-sm">Volviendo al panel...</p>
        </motion.div>
      </main>
    )
  }

  const channelOptions = [
    { value: 'personal', label: 'Venta' },
    { value: 'alquiler', label: 'Alquiler Turístico' },
    { value: 'bancaria', label: 'Inversión Bancaria' },
  ]

  return (
    <main className="min-h-screen bg-[#0F1419] px-4 py-10">
      {showPriceConfirm && property && (
        <PriceConfirmModal
          original={Number(property.price)}
          nuevo={consultarPrecio ? 0 : Number(form.price)}
          onClose={() => setShowPriceConfirm(false)}
          onConfirm={handlePriceConfirm}
        />
      )}
      {showSoldModal && (
        <SoldModal
          originalPrice={Number(form.price) || Number(property?.price) || 0}
          onClose={() => setShowSoldModal(false)}
          onConfirm={handleSoldConfirm}
        />
      )}
      {showDeleteModal && (
        <DeleteModal
          title={form.title}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
        />
      )}

      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-playfair text-2xl font-bold">
            <span className="gold-text">✏️</span> Editar Propiedad
          </h1>
          <Link href="/admin" className="flex items-center gap-1.5 text-[#8B96A5] text-sm hover:text-white transition-colors">
            <ArrowLeft size={14} /> Volver al panel
          </Link>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg mb-5">
            {error}
          </div>
        )}

        <div className="space-y-6">

          {/* Tipo de propiedad */}
          <div className="card p-5">
            <label className="text-xs text-[#8B96A5] block mb-3 uppercase tracking-wider">Tipo de propiedad</label>
            <div className="flex gap-3">
              {channelOptions.map(opt => (
                <button key={opt.value} type="button" onClick={() => set('channel', opt.value)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                    form.channel === opt.value
                      ? 'bg-[#C9A84C] border-[#C9A84C] text-[#0F1419]'
                      : 'border-white/10 text-[#8B96A5] hover:border-[#C9A84C]/30'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Estado */}
          <div className="card p-5">
            <label className="text-xs text-[#8B96A5] block mb-3 uppercase tracking-wider">Estado</label>
            <select
              className="input"
              value={form.status}
              onChange={e => set('status', e.target.value)}
            >
              <option value="disponible">Disponible</option>
              <option value="negociacion">En Negociación</option>
              <option value="reservada">Reservada</option>
              <option value="vendida">Vendida</option>
            </select>
            {form.status === 'vendida' && (property?.status || 'disponible') !== 'vendida' && (
              <p className="text-yellow-400 text-xs mt-2">Al guardar se pedirán los datos de venta.</p>
            )}
          </div>

          {/* Fotos actuales */}
          <div className="card p-5">
            <label className="text-xs text-[#8B96A5] block mb-3 uppercase tracking-wider">
              Fotos actuales ({existingImages.length})
            </label>
            {existingImages.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {existingImages.map((url, i) => (
                  <div key={url} className="relative aspect-video rounded-lg overflow-hidden">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeExisting(url)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/80 flex items-center justify-center hover:bg-red-600 transition-colors">
                      <X size={10} className="text-white" />
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 text-[9px] bg-[#C9A84C] text-[#0F1419] px-1.5 py-0.5 rounded font-bold">Principal</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#8B96A5] text-xs mb-3">Sin fotos actualmente.</p>
            )}

            {/* Nuevas fotos a añadir */}
            {newPreviews.length > 0 && (
              <>
                <label className="text-xs text-[#8B96A5] block mb-2 mt-2">Nuevas fotos a subir ({newPreviews.length})</label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {newPreviews.map((src, i) => (
                    <div key={i} className="relative aspect-video rounded-lg overflow-hidden">
                      <img src={src} alt="" className="w-full h-full object-cover opacity-80" />
                      <button type="button" onClick={() => removeNew(i)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/80 flex items-center justify-center hover:bg-red-600 transition-colors">
                        <X size={10} className="text-white" />
                      </button>
                      <span className="absolute bottom-1 left-1 text-[9px] bg-blue-500 text-white px-1.5 py-0.5 rounded font-bold">Nueva</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="w-full py-5 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center gap-2 text-[#8B96A5] hover:border-[#C9A84C]/40 hover:text-white transition-all">
              <Upload size={20} />
              <span className="text-sm">+ Añadir más fotos</span>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />

            {deletedImages.length > 0 && (
              <p className="text-red-400 text-xs mt-2">{deletedImages.length} foto{deletedImages.length !== 1 ? 's' : ''} marcada{deletedImages.length !== 1 ? 's' : ''} para eliminar.</p>
            )}
          </div>

          {/* Datos básicos */}
          <div className="card p-5 space-y-4">
            <label className="text-xs text-[#8B96A5] block uppercase tracking-wider">Información</label>
            <div>
              <label className="text-xs text-[#8B96A5] block mb-1.5">Título *</label>
              <input className="input" placeholder="Villa en Marbella con piscina" value={form.title} onChange={e => set('title', e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-[#8B96A5] block mb-1.5">Dirección / Zona</label>
              <input className="input" placeholder="Marbella, Costa del Sol" value={form.location} onChange={e => set('location', e.target.value)} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-[#8B96A5]">
                  {form.channel === 'alquiler' ? 'Precio/semana €' : 'Precio €'} *
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-3.5 h-3.5 accent-[#C9A84C]" checked={consultarPrecio} onChange={e => setConsultarPrecio(e.target.checked)} />
                  <span className="text-xs text-[#8B96A5]">Precio a consultar</span>
                </label>
              </div>
              {!consultarPrecio && (
                <input className="input" type="number" placeholder="250000" value={form.price} onChange={e => set('price', e.target.value)} />
              )}
              {consultarPrecio && (
                <p className="input text-[#8B96A5] text-sm">Precio a consultar (no se mostrará)</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#8B96A5] block mb-1.5">Superficie m²</label>
                <input className="input" type="number" placeholder="120" value={form.area_sqm} onChange={e => set('area_sqm', e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-[#8B96A5] block mb-1.5">Parcela m²</label>
                <input className="input" type="number" placeholder="500" value={form.plot_m2} onChange={e => set('plot_m2', e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-[#8B96A5] block mb-1.5">Habitaciones</label>
                <input className="input" type="number" placeholder="3" value={form.bedrooms} onChange={e => set('bedrooms', e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-[#8B96A5] block mb-1.5">Baños</label>
                <input className="input" type="number" placeholder="2" value={form.bathrooms} onChange={e => set('bathrooms', e.target.value)} />
              </div>
            </div>

            {form.channel !== 'alquiler' && (
              <div>
                <label className="text-xs text-[#8B96A5] block mb-1.5">ROI estimado %</label>
                <input className="input" type="number" placeholder="5.5" value={form.estimated_roi} onChange={e => set('estimated_roi', e.target.value)} />
              </div>
            )}

            {form.channel === 'alquiler' && (
              <div>
                <label className="text-xs text-[#8B96A5] block mb-1.5">Precio/noche €</label>
                <input className="input" type="number" placeholder="350" value={form.price_per_night} onChange={e => set('price_per_night', e.target.value)} />
              </div>
            )}
          </div>

          {/* Descripción */}
          <div className="card p-5">
            <label className="text-xs text-[#8B96A5] block mb-3 uppercase tracking-wider">Descripción</label>
            <textarea
              className="input resize-none h-36"
              placeholder="Descripción de la propiedad..."
              value={form.description}
              onChange={e => set('description', e.target.value)}
            />
          </div>

          {/* Botones */}
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleSaveClick}
              disabled={saving}
              className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving ? (
                <><Loader2 size={18} className="animate-spin" /> Guardando...</>
              ) : (
                <><Save size={18} /> Guardar cambios</>
              )}
            </button>

            <Link href="/admin"
              className="w-full py-3 text-sm text-center rounded-lg border border-white/10 text-[#8B96A5] hover:text-white transition-colors">
              Cancelar
            </Link>

            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              disabled={saving}
              className="w-full py-3 text-sm rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 mt-4"
            >
              <Trash2 size={15} /> Eliminar propiedad
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
