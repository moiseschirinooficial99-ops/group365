'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Upload, X, Loader2, Sparkles } from 'lucide-react'
import Link from 'next/link'

const TIPOS = ['venta', 'alquiler', 'bancaria']
const CHANNELS = { venta: 'personal', alquiler: 'alquiler', bancaria: 'bancaria' }

export default function NuevaPropiedadPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [videoLoading, setVideoLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [previews, setPreviews] = useState<string[]>([])
  const [files, setFiles] = useState<File[]>([])

  const [form, setForm] = useState({
    tipo: 'venta',
    title: '',
    location: '',
    price: '',
    area_sqm: '',
    bedrooms: '',
    bathrooms: '',
    description: '',
    estimated_roi: '',
    property_status: 'reformado',
    price_per_night: '',
    max_guests: '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    setFiles(prev => [...prev, ...selected])
    selected.forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => setPreviews(prev => [...prev, ev.target?.result as string])
      reader.readAsDataURL(file)
    })
  }

  const removeFile = (i: number) => {
    setFiles(prev => prev.filter((_, idx) => idx !== i))
    setPreviews(prev => prev.filter((_, idx) => idx !== i))
  }

  const generateDescription = async () => {
    if (!form.title) { setError('Añade el título primero.'); return }
    setAiLoading(true)
    setError('')
    try {
      const res = await fetch('/api/ai/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: form.title, tipo: form.tipo,
          precio: form.price, ubicacion: form.location,
          m2: form.area_sqm, habitaciones: form.bedrooms, banos: form.bathrooms,
        }),
      })
      const { description } = await res.json()
      if (description) set('description', description)
    } catch { setError('Error generando descripción.') }
    finally { setAiLoading(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.price) { setError('Título y precio son obligatorios.'); return }
    setLoading(true)
    setError('')

    try {
      // Upload images
      const imageUrls: string[] = []
      for (const file of files) {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch('/api/admin/upload-image', { method: 'POST', body: fd })
        const { url, error: uploadErr } = await res.json()
        if (url) imageUrls.push(url)
        else if (uploadErr) console.warn('Upload error:', uploadErr)
      }

      // Build property object
      const propertyData: any = {
        title: form.title,
        location: form.location,
        price: Number(form.price),
        area_sqm: Number(form.area_sqm) || null,
        bedrooms: Number(form.bedrooms) || null,
        bathrooms: Number(form.bathrooms) || null,
        description: form.description,
        channel: CHANNELS[form.tipo as keyof typeof CHANNELS] || 'personal',
        is_active: true,
        is_featured: false,
        main_image: imageUrls[0] || null,
        images: imageUrls,
      }

      if (form.tipo === 'venta' || form.tipo === 'bancaria') {
        propertyData.estimated_roi = Number(form.estimated_roi) || null
        propertyData.property_status = form.property_status
      }
      if (form.tipo === 'alquiler') {
        propertyData.price_per_night = Number(form.price_per_night) || null
        propertyData.max_guests = Number(form.max_guests) || null
      }

      // INSERT property via properties API
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(propertyData),
      })

      const { data: savedProp, error: propErr } = await res.json()
      if (propErr) throw new Error(propErr)

      // Generate videos if property was saved
      if (savedProp?.id) {
        setVideoLoading(true)
        try {
          const promptRes = await fetch('/api/ai/generate-video-prompt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              titulo: form.title, tipo: form.tipo,
              ubicacion: form.location, precio: form.price,
              m2: form.area_sqm, descripcion: form.description,
            }),
          })
          const { prompts } = await promptRes.json()
          if (prompts?.length) {
            await fetch('/api/ai/generate-videos', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ propertyId: savedProp.id, prompts }),
            })
          }
        } catch { /* Videos generation is best-effort */ }
        setVideoLoading(false)
      }

      setSuccess(true)
      setTimeout(() => router.push('/admin'), 2000)
    } catch (e: any) {
      setError(e.message || 'Error al crear la propiedad.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <main className="min-h-screen bg-[#0F1419] flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="card p-10 text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-[#1B7F6F]/20 border border-[#1B7F6F]/30 flex items-center justify-center mx-auto mb-5">
            <span className="text-3xl">✅</span>
          </div>
          <h2 className="font-playfair text-xl font-bold mb-2">Propiedad publicada</h2>
          <p className="text-[#8B96A5] text-sm">
            {videoLoading ? '3 videos generando en segundo plano...' : 'Redirigiendo al panel...'}
          </p>
        </motion.div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#0F1419] px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-playfair text-2xl font-bold">
            <span className="green-text">+</span> Nueva Propiedad
          </h1>
          <Link href="/admin" className="text-[#8B96A5] text-sm hover:text-white transition-colors">
            ← Volver al panel
          </Link>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Tipo */}
          <div className="card p-5">
            <label className="text-xs text-[#8B96A5] block mb-3 uppercase tracking-wider">Tipo de propiedad</label>
            <div className="flex gap-3">
              {TIPOS.map(t => (
                <button key={t} type="button" onClick={() => set('tipo', t)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium capitalize transition-all border ${
                    form.tipo === t
                      ? 'bg-[#C9A84C] border-[#C9A84C] text-[#0F1419]'
                      : 'border-white/10 text-[#8B96A5] hover:border-[#C9A84C]/30'
                  }`}>
                  {t === 'venta' ? 'Venta' : t === 'alquiler' ? 'Alquiler Turístico' : 'Inversión Bancaria'}
                </button>
              ))}
            </div>
          </div>

          {/* Fotos */}
          <div className="card p-5">
            <label className="text-xs text-[#8B96A5] block mb-3 uppercase tracking-wider">Fotos</label>
            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {previews.map((src, i) => (
                  <div key={i} className="relative aspect-video rounded-lg overflow-hidden">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeFile(i)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center hover:bg-red-600 transition-colors">
                      <X size={10} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="w-full py-8 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center gap-2 text-[#8B96A5] hover:border-[#C9A84C]/40 hover:text-white transition-all">
              <Upload size={24} />
              <span className="text-sm">Haz clic para subir fotos</span>
              <span className="text-xs opacity-60">JPG, PNG, WEBP</span>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
          </div>

          {/* Datos básicos */}
          <div className="card p-5 space-y-4">
            <label className="text-xs text-[#8B96A5] block uppercase tracking-wider">Información</label>
            <div>
              <label className="text-xs text-[#8B96A5] block mb-1.5">Título *</label>
              <input className="input" placeholder="Villa en Marbella con piscina" required
                value={form.title} onChange={e => set('title', e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-[#8B96A5] block mb-1.5">Dirección / Zona *</label>
              <input className="input" placeholder="Marbella, Costa del Sol"
                value={form.location} onChange={e => set('location', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#8B96A5] block mb-1.5">
                  {form.tipo === 'alquiler' ? 'Precio/semana €' : 'Precio €'} *
                </label>
                <input className="input" type="number" placeholder="250000" required
                  value={form.price} onChange={e => set('price', e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-[#8B96A5] block mb-1.5">Superficie m²</label>
                <input className="input" type="number" placeholder="120"
                  value={form.area_sqm} onChange={e => set('area_sqm', e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-[#8B96A5] block mb-1.5">Habitaciones</label>
                <input className="input" type="number" placeholder="3"
                  value={form.bedrooms} onChange={e => set('bedrooms', e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-[#8B96A5] block mb-1.5">Baños</label>
                <input className="input" type="number" placeholder="2"
                  value={form.bathrooms} onChange={e => set('bathrooms', e.target.value)} />
              </div>
            </div>

            {/* Campos específicos por tipo */}
            {(form.tipo === 'venta' || form.tipo === 'bancaria') && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#8B96A5] block mb-1.5">ROI estimado %</label>
                  <input className="input" type="number" placeholder="5.5"
                    value={form.estimated_roi} onChange={e => set('estimated_roi', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-[#8B96A5] block mb-1.5">Estado</label>
                  <select className="input" value={form.property_status} onChange={e => set('property_status', e.target.value)}>
                    <option value="nuevo">Nuevo</option>
                    <option value="reformado">Reformado</option>
                    <option value="a reformar">A reformar</option>
                  </select>
                </div>
              </div>
            )}

            {form.tipo === 'alquiler' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#8B96A5] block mb-1.5">Precio/noche €</label>
                  <input className="input" type="number" placeholder="350"
                    value={form.price_per_night} onChange={e => set('price_per_night', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-[#8B96A5] block mb-1.5">Máx. personas</label>
                  <input className="input" type="number" placeholder="8"
                    value={form.max_guests} onChange={e => set('max_guests', e.target.value)} />
                </div>
              </div>
            )}
          </div>

          {/* Descripción */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs text-[#8B96A5] uppercase tracking-wider">Descripción</label>
              <button type="button" onClick={generateDescription} disabled={aiLoading}
                className="flex items-center gap-1.5 text-xs text-[#C9A84C] hover:text-white border border-[#C9A84C]/30 hover:border-[#C9A84C] px-3 py-1.5 rounded-lg transition-all disabled:opacity-50">
                {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                {aiLoading ? 'Generando...' : 'Generar con IA'}
              </button>
            </div>
            <textarea
              className="input resize-none h-32"
              placeholder="Descripción de la propiedad..."
              value={form.description}
              onChange={e => set('description', e.target.value)}
            />
          </div>

          <button type="submit" disabled={loading}
            className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2 disabled:opacity-60">
            {loading ? (
              <><Loader2 size={18} className="animate-spin" /> Publicando...</>
            ) : (
              'Publicar propiedad'
            )}
          </button>
        </form>
      </div>
    </main>
  )
}
