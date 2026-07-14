'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, FileText, Download, Send, Save, Trash2, Loader2, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { CONTRACT_TYPES, ESTADO_LABEL, getContractType } from '@/lib/contracts'

// ── Paleta GROUP 360 (esmeralda / oro / negro) ──────────────────────────────
const ESMERALDA = '#1FA67A'
const ORO = '#C9A64E'
const NEGRO = '#0A0A0A'

const ESTADO_STYLE: Record<string, string> = {
  borrador: 'text-gray-300 bg-white/5 border-white/10',
  generado: 'text-[#C9A64E] bg-[#C9A64E]/10 border-[#C9A64E]/30',
  enviado:  'text-[#1FA67A] bg-[#1FA67A]/10 border-[#1FA67A]/30',
  firmado:  'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
  error:    'text-red-400 bg-red-500/10 border-red-500/30',
}

type Contrato = {
  id: string
  tipo: string
  datos_json: Record<string, any>
  estado: string
  fecha: string
  destinatario: string | null
  nombre_destinatario: string | null
}

export default function ContratosPage() {
  const [tipoId, setTipoId] = useState(CONTRACT_TYPES[0].id)
  const [datos, setDatos] = useState<Record<string, any>>({})
  const [plantilla, setPlantilla] = useState(CONTRACT_TYPES[0].plantilla)
  const [historial, setHistorial] = useState<Contrato[]>([])
  const [busy, setBusy] = useState<'pdf' | 'send' | 'save' | null>(null)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [editId, setEditId] = useState<string | null>(null)

  const def = useMemo(() => getContractType(tipoId)!, [tipoId])

  const flash = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 4000)
  }

  const loadHistorial = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/contracts')
      const d = await r.json()
      setHistorial(Array.isArray(d) ? d : [])
    } catch { /* noop */ }
  }, [])

  useEffect(() => { loadHistorial() }, [loadHistorial])

  // Cambiar de tipo resetea la plantilla (a menos que estemos editando uno existente)
  const selectTipo = (id: string) => {
    setTipoId(id)
    setPlantilla(getContractType(id)!.plantilla)
    setDatos({})
    setEditId(null)
  }

  const setCampo = (key: string, val: string) => setDatos(d => ({ ...d, [key]: val }))

  // Reunir datos incluyendo la plantilla editada
  const payloadDatos = () => ({ ...datos, plantilla })

  // ── Generar PDF (descarga directa) ──────────────────────────────────────
  const generarPdf = async () => {
    setBusy('pdf')
    try {
      const r = await fetch('/api/admin/generate-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: tipoId, datos: payloadDatos(), contrato_id: editId }),
      })
      if (!r.ok) throw new Error((await r.json()).error || 'Error generando PDF')
      const blob = await r.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${def.id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      flash('PDF generado y descargado.')
      loadHistorial()
    } catch (e: any) {
      flash(e.message, false)
    } finally { setBusy(null) }
  }

  // ── Guardar borrador ────────────────────────────────────────────────────
  const guardar = async () => {
    setBusy('save')
    try {
      const method = editId ? 'PATCH' : 'POST'
      const url = editId ? `/api/admin/contracts?id=${editId}` : '/api/admin/contracts'
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: tipoId, datos: payloadDatos() }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Error guardando')
      if (!editId && d.data?.id) setEditId(d.data.id)
      flash('Borrador guardado.')
      loadHistorial()
    } catch (e: any) {
      flash(e.message, false)
    } finally { setBusy(null) }
  }

  // ── Enviar por email (dispara n8n) ──────────────────────────────────────
  const enviar = async () => {
    if (!datos.email_destinatario) { flash('Añade el email del destinatario primero.', false); return }
    setBusy('send')
    try {
      const r = await fetch('/api/admin/contracts/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: tipoId, datos: payloadDatos(), contrato_id: editId }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Error al enviar')
      if (d.contrato_id) setEditId(d.contrato_id)
      flash(`Contrato enviado a ${datos.email_destinatario}.`)
      loadHistorial()
    } catch (e: any) {
      flash(e.message, false)
    } finally { setBusy(null) }
  }

  // ── Cargar un contrato del historial para editar/reenviar ───────────────
  const cargarContrato = (c: Contrato) => {
    setTipoId(c.tipo)
    const { plantilla: pl, ...rest } = c.datos_json || {}
    setPlantilla(pl || getContractType(c.tipo)?.plantilla || '')
    setDatos(rest)
    setEditId(c.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const borrar = async (id: string) => {
    if (!confirm('¿Eliminar este contrato del historial?')) return
    await fetch(`/api/admin/contracts?id=${id}`, { method: 'DELETE' })
    if (editId === id) { setEditId(null); setDatos({}) }
    loadHistorial()
  }

  return (
    <main className="min-h-screen p-6" style={{ backgroundColor: NEGRO }}>
      {/* Toast */}
      {toast && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg text-sm font-medium border ${toast.ok ? 'bg-[#1FA67A]/15 border-[#1FA67A]/40 text-[#1FA67A]' : 'bg-red-500/15 border-red-500/40 text-red-400'}`}>
          {toast.msg}
        </motion.div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <h1 className="font-playfair text-3xl font-bold">
              <span style={{ color: ESMERALDA }}>Contratos</span>{' '}
              <span style={{ color: ORO }}>360</span>
              <span className="text-white/40 text-lg ml-3">Generación &amp; firma</span>
            </h1>
          </div>
          {editId && (
            <span className="text-xs px-3 py-1.5 rounded-full border" style={{ color: ORO, borderColor: `${ORO}55` }}>
              Editando contrato existente
            </span>
          )}
        </div>

        {/* Selector de tipo */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {CONTRACT_TYPES.map(t => {
            const active = t.id === tipoId
            return (
              <button key={t.id} onClick={() => selectTipo(t.id)}
                className="text-left p-4 rounded-xl border transition-all"
                style={{
                  backgroundColor: active ? `${ESMERALDA}14` : '#14161a',
                  borderColor: active ? ESMERALDA : 'rgba(255,255,255,0.06)',
                }}>
                <div className="text-2xl mb-2">{t.emoji}</div>
                <div className="text-sm font-semibold text-white leading-tight">{t.nombre}</div>
              </button>
            )
          })}
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Formulario */}
          <div className="lg:col-span-3 space-y-6">
            <div className="rounded-xl border border-white/5 p-6" style={{ backgroundColor: '#111316' }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{def.emoji}</span>
                <h2 className="font-playfair text-xl font-bold text-white">{def.nombre}</h2>
              </div>
              <p className="text-gray-400 text-sm mb-6">{def.descripcion}</p>

              <div className="grid md:grid-cols-2 gap-4">
                {def.campos.map(campo => (
                  <div key={campo.key} className={campo.tipo === 'textarea' ? 'md:col-span-2' : ''}>
                    <label className="text-xs text-gray-400 block mb-1.5">{campo.label}</label>
                    {campo.tipo === 'textarea' ? (
                      <textarea className="input-c resize-none h-20" placeholder={campo.placeholder}
                        value={datos[campo.key] || ''} onChange={e => setCampo(campo.key, e.target.value)} />
                    ) : (
                      <input
                        type={campo.tipo === 'number' ? 'number' : campo.tipo === 'date' ? 'date' : campo.tipo === 'email' ? 'email' : 'text'}
                        className="input-c" placeholder={campo.placeholder}
                        value={datos[campo.key] || ''} onChange={e => setCampo(campo.key, e.target.value)} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Plantilla editable */}
            <div className="rounded-xl border border-white/5 p-6" style={{ backgroundColor: '#111316' }}>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-white">Plantilla del contrato (editable)</label>
                <button onClick={() => setPlantilla(def.plantilla)} className="text-xs text-gray-400 hover:text-white transition-colors">
                  ↺ Restaurar plantilla
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Usa <code className="text-[#C9A64E]">{'{{campo}}'}</code> como marcadores — se rellenan con los datos de arriba al generar el PDF.
              </p>
              <textarea className="input-c font-mono text-xs leading-relaxed h-72" value={plantilla}
                onChange={e => setPlantilla(e.target.value)} />
            </div>

            {/* Acciones */}
            <div className="flex flex-wrap gap-3">
              <button onClick={generarPdf} disabled={busy !== null}
                className="flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-sm transition-all disabled:opacity-50"
                style={{ backgroundColor: ORO, color: NEGRO }}>
                {busy === 'pdf' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Generar PDF
              </button>
              <button onClick={enviar} disabled={busy !== null}
                className="flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-sm transition-all disabled:opacity-50"
                style={{ backgroundColor: ESMERALDA, color: NEGRO }}>
                {busy === 'send' ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Enviar por email
              </button>
              <button onClick={guardar} disabled={busy !== null}
                className="flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-sm border border-white/10 text-gray-300 hover:text-white transition-all disabled:opacity-50">
                {busy === 'save' ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Guardar borrador
              </button>
            </div>
          </div>

          {/* Historial */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-white/5 p-6" style={{ backgroundColor: '#111316' }}>
              <div className="flex items-center gap-2 mb-5">
                <FileText size={18} style={{ color: ORO }} />
                <h2 className="font-playfair text-lg font-bold text-white">Historial</h2>
                <span className="text-gray-500 text-xs">({historial.length})</span>
              </div>

              {historial.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-sm border border-dashed border-white/5 rounded-lg">
                  Aún no hay contratos generados.
                </div>
              ) : (
                <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
                  {historial.map(c => {
                    const t = getContractType(c.tipo)
                    const est = c.estado
                    const Icon = est === 'enviado' || est === 'firmado' ? CheckCircle2 : est === 'error' ? AlertCircle : Clock
                    return (
                      <div key={c.id} className="p-4 rounded-lg border border-white/5 hover:border-white/10 transition-colors"
                        style={{ backgroundColor: '#161a1f' }}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{t?.emoji} {t?.nombre || c.tipo}</p>
                            <p className="text-xs text-gray-400 truncate">{c.nombre_destinatario || '—'} · {c.destinatario || 'sin email'}</p>
                          </div>
                          <span className={`shrink-0 flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border font-semibold ${ESTADO_STYLE[est] || ESTADO_STYLE.borrador}`}>
                            <Icon size={10} /> {ESTADO_LABEL[est] || est}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-500">{new Date(c.fecha).toLocaleString('es-ES')}</span>
                          <div className="flex items-center gap-2">
                            <button onClick={() => cargarContrato(c)} className="text-[10px] px-2 py-1 rounded transition-colors"
                              style={{ color: ESMERALDA }}>Abrir</button>
                            <button onClick={() => borrar(c.id)} className="text-gray-500 hover:text-red-400 transition-colors">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Estilos locales de input (paleta contratos) */}
      <style jsx>{`
        :global(.input-c) {
          width: 100%;
          background: #0A0A0A;
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 0.5rem;
          padding: 0.6rem 0.85rem;
          color: #fff;
          font-size: 0.875rem;
          transition: border-color .2s;
        }
        :global(.input-c::placeholder) { color: #4A5568; }
        :global(.input-c:focus) { outline: none; border-color: ${ESMERALDA}; }
      `}</style>
    </main>
  )
}
