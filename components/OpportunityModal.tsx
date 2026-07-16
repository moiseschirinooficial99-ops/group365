'use client'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink, Download, ChevronLeft, ChevronRight, MapPin, Loader2 } from 'lucide-react'

export type Category = 'npl' | 'reo' | 'cesion_remate' | 'producto_ocupado' | 'propiedades_inversion' | 'fondo'

const CATEGORY_META: Record<string, { label: string; icon: string; accent: string }> = {
  npl:                   { label: 'NPL — Hipoteca Impagada', icon: '📋', accent: 'text-[#C9A84C]' },
  reo:                   { label: 'REO — Activo Adjudicado',  icon: '🏦', accent: 'text-[#1B7F6F]' },
  cesion_remate:         { label: 'Cesión de Remate',         icon: '⚖️', accent: 'text-blue-400' },
  producto_ocupado:      { label: 'Producto Ocupado',         icon: '🔑', accent: 'text-orange-400' },
  propiedades_inversion: { label: 'Propiedades de Inversión', icon: '🏘️', accent: 'text-emerald-400' },
  fondo:                 { label: 'Fondo GROUP 360',          icon: '💼', accent: 'text-purple-400' },
}

const euro = (v: any) => (v != null && v !== '' ? `€${Number(v).toLocaleString('es-ES')}` : null)

async function downloadImage(url: string, name: string) {
  try {
    const res = await fetch(url, { mode: 'cors' })
    const blob = await res.blob()
    const objUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objUrl
    a.download = name
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(objUrl)
  } catch {
    // Si el navegador bloquea la descarga cross-origin, abrimos en pestaña nueva
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

export default function OpportunityModal({
  opportunity,
  onClose,
}: {
  opportunity: any | null
  onClose: () => void
}) {
  const [mounted, setMounted] = useState(false)
  const [idx, setIdx] = useState(0)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => setMounted(true), [])
  useEffect(() => { setIdx(0) }, [opportunity?.id])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (opportunity) {
      window.addEventListener('keydown', onKey)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [opportunity, onClose])

  if (!mounted) return null

  const op = opportunity
  const images: string[] = op && Array.isArray(op.images) ? op.images : []
  const meta = op ? (CATEGORY_META[op.category] || { label: op.category, icon: '📄', accent: 'text-white' }) : null
  const roi = op ? (op.roi_estimated || op.annual_return_pct) : null

  const specs = op ? ([
    ['Ubicación', op.location],
    ['Valor deuda', euro(op.debt_value)],
    ['Precio oferta', euro(op.offer_price)],
    ['Valor propiedad', euro(op.property_value)],
    ['ROI estimado', roi ? `${roi}%` : null],
    ['Retribución anual', op.annual_return_pct ? `${op.annual_return_pct}%` : null],
    ['Inversión mínima', euro(op.minimum_investment)],
    ['Fase judicial', op.judicial_phase],
    ['Estado ocupación', op.occupancy_status],
    ['Plazo estimado', op.estimated_timeline],
    ['Estado', op.status],
  ].filter(([, v]) => v != null && v !== '') as [string, string][]) : []

  const current = images[idx]

  const handleDownload = async () => {
    if (!current) return
    setDownloading(true)
    const ext = (current.split('.').pop() || 'jpg').split('?')[0].slice(0, 5)
    const safe = (op.title || 'oportunidad').replace(/[^\w-]+/g, '_').slice(0, 40)
    await downloadImage(current, `${safe}_${idx + 1}.${ext}`)
    setDownloading(false)
  }

  return createPortal(
    <AnimatePresence>
      {op && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-start md:items-center justify-center overflow-y-auto p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            onClick={e => e.stopPropagation()}
            className="bg-[#161D26] border border-white/10 rounded-2xl w-full max-w-3xl my-auto overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 p-5 border-b border-white/5">
              <div className="min-w-0">
                <span className={`text-[11px] font-semibold ${meta!.accent}`}>{meta!.icon} {meta!.label}</span>
                <h3 className="font-playfair text-lg font-bold text-white mt-0.5 leading-snug">{op.title}</h3>
                {op.location && (
                  <p className="text-[#8B96A5] text-xs mt-1 flex items-center gap-1"><MapPin size={11} /> {op.location}</p>
                )}
              </div>
              <button onClick={onClose} className="shrink-0 text-[#8B96A5] hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto">
              {/* Galería */}
              {images.length > 0 ? (
                <div className="bg-[#0F1419]">
                  <div className="relative">
                    <img src={current} alt={op.title} className="w-full max-h-[45vh] object-contain bg-black" />
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={() => setIdx(i => (i - 1 + images.length) % images.length)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 rounded-full p-1.5 text-white transition-colors"
                        >
                          <ChevronLeft size={18} />
                        </button>
                        <button
                          onClick={() => setIdx(i => (i + 1) % images.length)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 rounded-full p-1.5 text-white transition-colors"
                        >
                          <ChevronRight size={18} />
                        </button>
                        <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
                          {idx + 1} / {images.length}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Acciones de imagen */}
                  <div className="flex items-center gap-2 p-3">
                    <a
                      href={current}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-white/10 text-[#8B96A5] hover:text-white hover:border-white/25 transition-colors"
                    >
                      <ExternalLink size={13} /> Abrir imagen
                    </a>
                    <button
                      onClick={handleDownload}
                      disabled={downloading}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#C9A84C]/15 border border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/25 transition-colors disabled:opacity-60"
                    >
                      {downloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                      {downloading ? 'Descargando...' : 'Descargar'}
                    </button>
                  </div>

                  {/* Miniaturas */}
                  {images.length > 1 && (
                    <div className="flex gap-2 px-3 pb-3 overflow-x-auto">
                      {images.map((url, i) => (
                        <button
                          key={url + i}
                          onClick={() => setIdx(i)}
                          className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                            i === idx ? 'border-[#C9A84C]' : 'border-transparent opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-[#0F1419] p-8 text-center text-[#8B96A5] text-sm">
                  Esta oportunidad no tiene imágenes cargadas.
                </div>
              )}

              {/* Características */}
              <div className="p-5">
                {roi && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="text-xs px-3 py-1 rounded-full bg-[#C9A84C]/15 text-[#C9A84C] border border-[#C9A84C]/25 font-bold">
                      {roi}% ROI
                    </span>
                    {op.estimated_timeline && (
                      <span className="text-xs px-3 py-1 rounded-full border border-white/10 text-[#8B96A5]">
                        {op.estimated_timeline}
                      </span>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 mb-4">
                  {specs.map(([k, v]) => (
                    <div key={k} className="bg-[#0F1419] rounded-lg px-3 py-2.5">
                      <p className="text-[#8B96A5] text-[10px] uppercase tracking-wider mb-0.5">{k}</p>
                      <p className="text-white text-sm font-medium break-words">{v}</p>
                    </div>
                  ))}
                </div>

                {op.description && (
                  <div>
                    <p className="text-[#8B96A5] text-[10px] uppercase tracking-wider mb-1.5">Descripción</p>
                    <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{op.description}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
