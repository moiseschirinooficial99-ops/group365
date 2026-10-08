'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Upload, Download, FileText, Pencil, Trash2, X, CheckCircle2, AlertTriangle } from 'lucide-react'

const CATEGORIAS: Record<string, string> = {
  comisiones: 'Comisiones', gestoria_asesoria: 'Gestoría / asesoría', marketing_publicidad: 'Marketing / publicidad',
  software_suscripciones: 'Software / suscripciones', suministros: 'Suministros', telefono_internet: 'Teléfono / internet',
  alquiler_oficina: 'Alquiler oficina', vehiculo_combustible: 'Vehículo / combustible', viajes_dietas: 'Viajes / dietas',
  notaria_registro: 'Notaría / registro', impuestos_tasas: 'Impuestos / tasas', banco_comisiones: 'Comisiones bancarias',
  seguros: 'Seguros', material_oficina: 'Material oficina', reformas_mantenimiento: 'Reformas / mantenimiento',
  honorarios: 'Honorarios', ventas: 'Ventas', otros: 'Otros',
}
const STATUS: Record<string, { label: string; cls: string }> = {
  pendiente: { label: 'Por revisar', cls: 'text-[#C9A84C] border-[#C9A84C]/30 bg-[#C9A84C]/10' },
  revisado: { label: 'Revisado', cls: 'text-[#1B7F6F] border-[#1B7F6F]/30 bg-[#1B7F6F]/10' },
  enviado_gestoria: { label: 'Enviado a gestoría', cls: 'text-green-400 border-green-500/30 bg-green-500/10' },
}
const eur = (v: any) => v === null || v === undefined || v === '' ? '—'
  : Number(v).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })

export default function ContabilidadPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [q, setQ] = useState(Math.ceil((now.getMonth() + 1) / 3))
  const [docs, setDocs] = useState<any[]>([])
  const [resumen, setResumen] = useState<any>(null)
  const [uploading, setUploading] = useState(0)
  const [log, setLog] = useState<string[]>([])
  const [edit, setEdit] = useState<any>(null)
  const [drag, setDrag] = useState(false)
  const [filtro, setFiltro] = useState('todos')
  const inputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/contabilidad?year=${year}&q=${q}`)
    if (res.ok) { const d = await res.json(); setDocs(d.docs); setResumen(d.resumen) }
  }, [year, q])
  useEffect(() => { load() }, [load])

  const upload = async (files: FileList | File[]) => {
    const list = Array.from(files)
    if (!list.length) return
    setUploading(list.length); setLog([])
    // De uno en uno: cada archivo pasa por la lectura con IA.
    for (const f of list) {
      const fd = new FormData(); fd.append('file', f)
      try {
        const res = await fetch('/api/admin/contabilidad', { method: 'POST', body: fd })
        const data = await res.json()
        const r = data.results?.[0]
        setLog(l => [...l, r?.error ? `❌ ${f.name}: ${r.error}` : `✅ ${f.name}: ${r?.doc?.counterparty || 'leído'} · ${eur(r?.doc?.total_amount)}`])
      } catch {
        setLog(l => [...l, `❌ ${f.name}: error de red`])
      }
      setUploading(n => n - 1)
    }
    load()
  }

  const saveEdit = async () => {
    const { id, ...body } = edit
    await fetch(`/api/admin/contabilidad?id=${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setEdit(null); load()
  }
  const setStatus = async (id: string, status: string) => {
    await fetch(`/api/admin/contabilidad?id=${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    load()
  }
  const remove = async (d: any) => {
    if (!window.confirm(`¿Eliminar "${d.counterparty || d.file_name}"? Se borra también el archivo.`)) return
    await fetch(`/api/admin/contabilidad?id=${d.id}`, { method: 'DELETE' }); load()
  }

  const visibles = docs.filter(d => filtro === 'todos' || d.direction === filtro || d.status === filtro)

  return (
    <main className="min-h-screen bg-[#0F1419] p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="p-2 rounded-lg bg-[#161D26] border border-white/5 text-[#8B96A5] hover:text-white"><ArrowLeft size={16} /></Link>
            <h1 className="font-playfair text-2xl md:text-3xl font-bold"><span className="gold-text">Contabilidad</span> <span className="text-white/40 text-lg">facturas, gastos e IVA</span></h1>
          </div>
          <div className="flex gap-2 items-center">
            <select className="input" value={year} onChange={e => setYear(Number(e.target.value))}>
              {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => <option key={y}>{y}</option>)}
            </select>
            <select className="input" value={q} onChange={e => setQ(Number(e.target.value))}>
              {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}º trimestre</option>)}
            </select>
          </div>
        </div>

        {/* Resumen */}
        {resumen && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            {[
              { label: 'Ingresos (total)', value: eur(resumen.ingresos_total), cls: 'text-[#1B7F6F]' },
              { label: 'Gastos (total)', value: eur(resumen.gastos_total), cls: 'text-white' },
              { label: 'IVA repercutido', value: eur(resumen.iva_repercutido), cls: 'text-white' },
              { label: 'IVA soportado', value: eur(resumen.iva_soportado), cls: 'text-white' },
              { label: resumen.iva_resultado >= 0 ? 'IVA a ingresar (orient.)' : 'IVA a compensar (orient.)', value: eur(Math.abs(resumen.iva_resultado)), cls: 'gold-text' },
            ].map(s => (
              <div key={s.label} className="card p-4">
                <div className={`text-xl font-bold font-playfair ${s.cls}`}>{s.value}</div>
                <div className="text-[#8B96A5] text-xs mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-[1fr_320px] gap-6 mb-6">
          {/* Subida */}
          <div
            onDragOver={e => { e.preventDefault(); setDrag(true) }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files) }}
            onClick={() => inputRef.current?.click()}
            className={`card p-8 border-2 border-dashed cursor-pointer text-center transition-colors ${drag ? 'border-[#C9A84C] bg-[#C9A84C]/5' : 'border-white/10 hover:border-white/25'}`}>
            <input ref={inputRef} type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden"
              onChange={e => { if (e.target.files) upload(e.target.files); e.target.value = '' }} />
            <Upload className="mx-auto text-[#C9A84C] mb-3" size={28} />
            <p className="text-white font-medium">{uploading ? `Leyendo ${uploading} documento(s)…` : 'Arrastra facturas, tickets o PDFs aquí'}</p>
            <p className="text-[#8B96A5] text-sm mt-1">La IA extrae proveedor, NIF, base, IVA, IRPF y total. Tú solo revisas.</p>
            <p className="text-[#8B96A5] text-xs mt-3">📱 También por Telegram: envía la foto o el PDF al bot.</p>
            {log.length > 0 && <div className="text-left mt-4 space-y-1 text-xs text-[#8B96A5]">{log.map((l, i) => <div key={i}>{l}</div>)}</div>}
          </div>

          {/* Gestoría */}
          <div className="card p-5">
            <h2 className="text-white font-semibold mb-2">Enviar a la gestoría</h2>
            <p className="text-[#8B96A5] text-sm mb-4">ZIP del {q}º trimestre con el libro (Excel/CSV), el resumen y todos los archivos ordenados en gastos/ e ingresos/.</p>
            {resumen?.pendientes_revision > 0 && (
              <p className="text-[#C9A84C] text-xs mb-3 flex items-center gap-1"><AlertTriangle size={12} /> {resumen.pendientes_revision} documento(s) sin revisar</p>
            )}
            <a href={`/api/admin/contabilidad/exportar?year=${year}&q=${q}`} className="btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2 mb-2">
              <Download size={15} /> Descargar ZIP
            </a>
            <a href={`/api/admin/contabilidad/exportar?year=${year}&q=${q}&marcar=1`} onClick={() => setTimeout(load, 4000)}
              className="w-full py-2.5 text-sm flex items-center justify-center gap-2 rounded-lg border border-[#1B7F6F]/30 text-[#1B7F6F] hover:bg-[#1B7F6F]/10">
              <CheckCircle2 size={15} /> Descargar y marcar enviado
            </a>
            <p className="text-[#8B96A5] text-[11px] mt-4">Cifras orientativas para control interno. La liquidación oficial (303, 111, 115…) la presenta la gestoría.</p>
          </div>
        </div>

        {/* Listado */}
        <div className="flex gap-1 mb-3 bg-[#161D26] rounded-xl p-1 w-fit flex-wrap">
          {[['todos', 'Todos'], ['gasto', 'Gastos'], ['ingreso', 'Ingresos'], ['pendiente', 'Por revisar']].map(([k, l]) => (
            <button key={k} onClick={() => setFiltro(k)} className={`px-3 py-1.5 rounded-lg text-sm ${filtro === k ? 'bg-[#C9A84C] text-[#0F1419]' : 'text-[#8B96A5] hover:text-white'}`}>{l}</button>
          ))}
        </div>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[#8B96A5] text-xs border-b border-white/5">
                <th className="p-3">Fecha</th><th className="p-3">Proveedor / cliente</th><th className="p-3">Concepto</th>
                <th className="p-3 text-right">Base</th><th className="p-3 text-right">IVA</th><th className="p-3 text-right">Total</th>
                <th className="p-3">Estado</th><th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {visibles.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-[#8B96A5]">No hay documentos en este trimestre.</td></tr>}
              {visibles.map(d => (
                <tr key={d.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="p-3 whitespace-nowrap text-[#8B96A5]">{d.issue_date ? new Date(`${d.issue_date}T12:00:00`).toLocaleDateString('es-ES') : <span className="text-red-400">sin fecha</span>}</td>
                  <td className="p-3">
                    <div className="text-white">{d.direction === 'ingreso' ? '📈' : d.direction === 'gasto' ? '📉' : '📄'} {d.counterparty || '—'}</div>
                    <div className="text-[11px] text-[#8B96A5]">{d.counterparty_nif || 'sin NIF'} · {d.invoice_number || d.doc_type}</div>
                  </td>
                  <td className="p-3 text-[#8B96A5] max-w-[220px]">
                    <div className="truncate">{d.concept || '—'}</div>
                    <div className="text-[11px]">{CATEGORIAS[d.category] || d.category}{d.ai_confidence === 'baja' && <span className="text-red-400"> · lectura dudosa</span>}</div>
                  </td>
                  <td className="p-3 text-right whitespace-nowrap text-[#8B96A5]">{eur(d.base_amount)}</td>
                  <td className="p-3 text-right whitespace-nowrap text-[#8B96A5]">{eur(d.vat_amount)}{d.vat_rate !== null && d.vat_rate !== undefined && <span className="text-[10px]"> ({Number(d.vat_rate)}%)</span>}</td>
                  <td className="p-3 text-right whitespace-nowrap text-white font-medium">{eur(d.total_amount)}</td>
                  <td className="p-3">
                    <button onClick={() => setStatus(d.id, d.status === 'pendiente' ? 'revisado' : 'pendiente')}
                      className={`text-[10px] px-2 py-0.5 rounded border whitespace-nowrap ${STATUS[d.status]?.cls}`} title="Cambiar revisado / por revisar">
                      {STATUS[d.status]?.label}
                    </button>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <div className="flex gap-1">
                      {d.file_path && <a href={`/api/admin/contabilidad/archivo?id=${d.id}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-white/5 text-[#8B96A5] hover:text-white" title="Ver archivo"><FileText size={14} /></a>}
                      <button onClick={() => setEdit({ ...d })} className="p-1.5 rounded hover:bg-white/5 text-[#8B96A5] hover:text-white" title="Editar"><Pencil size={14} /></button>
                      <button onClick={() => remove(d)} className="p-1.5 rounded hover:bg-white/5 text-[#8B96A5] hover:text-red-400" title="Eliminar"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {edit && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setEdit(null)}>
          <div className="card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Revisar documento</h3>
              <button onClick={() => setEdit(null)} className="text-[#8B96A5] hover:text-white"><X size={18} /></button>
            </div>
            {edit.ai_notes && <p className="text-[#C9A84C] text-xs mb-4">📝 IA: {edit.ai_notes}</p>}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tipo"><select className="input w-full" value={edit.direction} onChange={e => setEdit({ ...edit, direction: e.target.value })}>
                <option value="gasto">Gasto</option><option value="ingreso">Ingreso</option><option value="otro">Otro</option></select></Field>
              <Field label="Documento"><select className="input w-full" value={edit.doc_type} onChange={e => setEdit({ ...edit, doc_type: e.target.value })}>
                {['factura', 'ticket', 'nomina', 'extracto', 'impuesto', 'contrato', 'otro'].map(t => <option key={t}>{t}</option>)}</select></Field>
              <Field label="Fecha"><input type="date" className="input w-full" value={edit.issue_date || ''} onChange={e => setEdit({ ...edit, issue_date: e.target.value })} /></Field>
              <Field label="Nº factura"><input className="input w-full" value={edit.invoice_number || ''} onChange={e => setEdit({ ...edit, invoice_number: e.target.value })} /></Field>
              <Field label="Proveedor / cliente"><input className="input w-full" value={edit.counterparty || ''} onChange={e => setEdit({ ...edit, counterparty: e.target.value })} /></Field>
              <Field label="NIF"><input className="input w-full" value={edit.counterparty_nif || ''} onChange={e => setEdit({ ...edit, counterparty_nif: e.target.value })} /></Field>
              <Field label="Concepto" wide><input className="input w-full" value={edit.concept || ''} onChange={e => setEdit({ ...edit, concept: e.target.value })} /></Field>
              <Field label="Categoría"><select className="input w-full" value={edit.category || 'otros'} onChange={e => setEdit({ ...edit, category: e.target.value })}>
                {Object.entries(CATEGORIAS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
              <Field label="Base (€)"><input type="number" step="0.01" className="input w-full" value={edit.base_amount ?? ''} onChange={e => setEdit({ ...edit, base_amount: e.target.value })} /></Field>
              <Field label="% IVA"><input type="number" step="0.01" className="input w-full" value={edit.vat_rate ?? ''} onChange={e => setEdit({ ...edit, vat_rate: e.target.value })} /></Field>
              <Field label="Cuota IVA (€)"><input type="number" step="0.01" className="input w-full" value={edit.vat_amount ?? ''} onChange={e => setEdit({ ...edit, vat_amount: e.target.value })} /></Field>
              <Field label="% IRPF"><input type="number" step="0.01" className="input w-full" value={edit.irpf_rate ?? ''} onChange={e => setEdit({ ...edit, irpf_rate: e.target.value })} /></Field>
              <Field label="Retención IRPF (€)"><input type="number" step="0.01" className="input w-full" value={edit.irpf_amount ?? ''} onChange={e => setEdit({ ...edit, irpf_amount: e.target.value })} /></Field>
              <Field label="Total (€)"><input type="number" step="0.01" className="input w-full" value={edit.total_amount ?? ''} onChange={e => setEdit({ ...edit, total_amount: e.target.value })} /></Field>
              <Field label="Notas" wide><textarea className="input w-full" rows={2} value={edit.notes || ''} onChange={e => setEdit({ ...edit, notes: e.target.value })} /></Field>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={saveEdit} className="btn-primary flex-1 py-3 text-sm">Guardar</button>
              <button onClick={async () => { const { id, ...body } = edit; await fetch(`/api/admin/contabilidad?id=${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, status: 'revisado' }) }); setEdit(null); load() }}
                className="flex-1 py-3 text-sm rounded-lg border border-[#1B7F6F]/40 text-[#1B7F6F] hover:bg-[#1B7F6F]/10">Guardar y marcar revisado</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={`block ${wide ? 'col-span-2' : ''}`}>
      <span className="text-[#8B96A5] text-[11px] mb-1 block">{label}</span>
      {children}
    </label>
  )
}
