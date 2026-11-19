import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import JSZip from 'jszip'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { supabaseAdmin } from '@/lib/supabase'

export const BUCKET = 'contabilidad'

export const CATEGORIAS = [
  'comisiones', 'gestoria_asesoria', 'marketing_publicidad', 'software_suscripciones',
  'suministros', 'telefono_internet', 'alquiler_oficina', 'vehiculo_combustible',
  'viajes_dietas', 'notaria_registro', 'impuestos_tasas', 'banco_comisiones',
  'seguros', 'material_oficina', 'reformas_mantenimiento', 'honorarios', 'ventas', 'otros',
] as const

const DIRECTIONS = ['gasto', 'ingreso', 'otro'] as const
const DOC_TYPES = ['factura', 'ticket', 'nomina', 'extracto', 'impuesto', 'contrato', 'otro'] as const
const CONFIDENCES = ['alta', 'media', 'baja'] as const

// Quién sube el documento. Telegram usa el nombre de quien envía si lo hay.
export const SUBIDORES = ['Moisés', 'José Luis', 'Telegram'] as const

// Los valores cerrados se piden como texto y se normalizan después: el helper
// de structured outputs no traslada los enum de zod al esquema, y un valor
// fuera de lista haría fallar el parseo completo y se perdería la lectura.
const ExtraccionSchema = z.object({
  direction: z.string().describe(DIRECTIONS.join(' | ')),
  doc_type: z.string().describe(DOC_TYPES.join(' | ')),
  issue_date: z.string().nullable(),
  counterparty: z.string().nullable(),
  counterparty_nif: z.string().nullable(),
  invoice_number: z.string().nullable(),
  concept: z.string().nullable(),
  category: z.string().describe(CATEGORIAS.join(' | ')),
  base_amount: z.number().nullable(),
  vat_rate: z.number().nullable(),
  vat_amount: z.number().nullable(),
  irpf_rate: z.number().nullable(),
  irpf_amount: z.number().nullable(),
  total_amount: z.number().nullable(),
  currency: z.string(),
  ai_confidence: z.string().describe(CONFIDENCES.join(' | ')),
  ai_notes: z.string().nullable(),
})
export type Extraccion = z.infer<typeof ExtraccionSchema>

const pick = <T extends string>(v: string, allowed: readonly T[], fallback: T): T => {
  const s = (v || '').toLowerCase().trim()
  return (allowed as readonly string[]).includes(s) ? (s as T) : fallback
}

function normalizar(x: Extraccion): Extraccion {
  return {
    ...x,
    direction: pick(x.direction, DIRECTIONS, 'gasto'),
    doc_type: pick(x.doc_type, DOC_TYPES, 'otro'),
    category: pick(x.category, CATEGORIAS, 'otros'),
    ai_confidence: pick(x.ai_confidence, CONFIDENCES, 'media'),
    currency: (x.currency || 'EUR').toUpperCase().slice(0, 3),
  }
}

const SYSTEM = `Eres el asistente contable de GROUP 360 INICIATIVAS S.L. (NIF B13911979), sociedad inmobiliaria española.
Recibes un documento (foto de factura o ticket, PDF de factura, modelo de impuestos…) y extraes sus datos para la contabilidad que se envía a la gestoría.

Criterios:
- direction: "ingreso" si el emisor es GROUP 360 (o B13911979) y factura a un tercero; "gasto" si GROUP 360 es el receptor/pagador; "otro" para documentos sin importe a contabilizar.
- counterparty / counterparty_nif: la OTRA parte (proveedor en gastos, cliente en ingresos), nunca GROUP 360.
- issue_date en formato AAAA-MM-DD.
- Importes como números con punto decimal (1234.56), sin símbolos. vat_rate e irpf_rate en porcentaje (21, 10, 4, 0, 15…).
- Si hay varios tipos de IVA, base_amount y vat_amount son la suma y explica el desglose en ai_notes.
- Tickets simplificados sin desglose: si el IVA no aparece, deja base/IVA a null y pon solo total_amount.
- No inventes: si un dato no aparece o no se lee, null. ai_confidence "baja" si la imagen es ilegible o faltan datos clave.
- ai_notes: avisos útiles para la gestoría (falta NIF del proveedor, ticket no deducible sin factura completa, suplidos, intracomunitaria, etc.). Breve.`

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const

export function esTipoSoportado(mime: string) {
  return mime === 'application/pdf' || (IMAGE_TYPES as readonly string[]).includes(mime)
}

const esFechaISO = (s: string | null | undefined): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s)

function bloqueArchivo(buffer: Buffer, mime: string): Anthropic.ContentBlockParam {
  const data = buffer.toString('base64')
  return mime === 'application/pdf'
    ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data } }
    : { type: 'image', source: { type: 'base64', media_type: mime as (typeof IMAGE_TYPES)[number], data } }
}

export async function extraerDocumento(buffer: Buffer, mime: string): Promise<Extraccion | null> {
  if (!process.env.ANTHROPIC_API_KEY || !esTipoSoportado(mime)) return null
  const client = new Anthropic()
  try {
    const response = await client.messages.parse({
      model: 'claude-opus-5-5',
      max_tokens: 4000,
      system: SYSTEM,
      output_config: { effort: 'low', format: zodOutputFormat(ExtraccionSchema) },
      messages: [{
        role: 'user',
        content: [bloqueArchivo(buffer, mime), { type: 'text', text: 'Extrae los datos contables de este documento.' }],
      }],
    })
    if (response.stop_reason === 'refusal') return null
    return response.parsed_output ? normalizar(response.parsed_output) : null
  } catch (e: any) {
    console.error('Contabilidad: extracción IA falló:', e?.message)
    return null
  }
}

// ── Extractos bancarios: cabecera + una fila por movimiento ─────────────
const MovimientoSchema = z.object({
  fecha: z.string().describe('AAAA-MM-DD'),
  concepto: z.string(),
  importe: z.number().describe('positivo = entra dinero en la cuenta, negativo = sale'),
  saldo: z.number().nullable(),
})

const ExtractoSchema = z.object({
  banco: z.string().nullable(),
  cuenta_last4: z.string().nullable(),
  periodo_desde: z.string().nullable(),
  periodo_hasta: z.string().nullable(),
  saldo_inicial: z.number().nullable(),
  saldo_final: z.number().nullable(),
  movimientos: z.array(MovimientoSchema),
  ai_notes: z.string().nullable(),
})
export type Extracto = z.infer<typeof ExtractoSchema>

const SYSTEM_EXTRACTO = `Eres el asistente contable de GROUP 360 INICIATIVAS S.L. (NIF B13911979).
Recibes un extracto bancario de una cuenta de la empresa (PDF o captura de la banca online).
Extrae la cabecera y TODOS los movimientos, uno por línea, en orden cronológico.

Criterios:
- importe: positivo si entra dinero en la cuenta, negativo si sale. Números con punto decimal, sin símbolos.
- fecha en formato AAAA-MM-DD; si solo aparece día y mes, usa el año del periodo.
- saldo: saldo tras el movimiento si aparece; si no, null.
- No inventes movimientos ni importes. Si una línea no se lee bien, incluye lo legible y avisa en ai_notes.
- cuenta_last4: solo los 4 últimos dígitos de la cuenta, nunca el IBAN completo.
- Si la captura no cubre todo el periodo, dilo en ai_notes.`

export async function extraerExtracto(buffer: Buffer, mime: string): Promise<Extracto | null> {
  if (!process.env.ANTHROPIC_API_KEY || !esTipoSoportado(mime)) return null
  const client = new Anthropic()
  try {
    const response = await client.messages.parse({
      model: 'claude-opus-5-5',
      max_tokens: 16000,
      system: SYSTEM_EXTRACTO,
      output_config: { effort: 'medium', format: zodOutputFormat(ExtractoSchema) },
      messages: [{
        role: 'user',
        content: [bloqueArchivo(buffer, mime), { type: 'text', text: 'Extrae la cabecera y todos los movimientos de este extracto.' }],
      }],
    })
    if (response.stop_reason === 'refusal') return null
    return response.parsed_output ?? null
  } catch (e: any) {
    console.error('Contabilidad: lectura de extracto falló:', e?.message)
    return null
  }
}

// Comprueba que saldo inicial + movimientos = saldo final. Si no cuadra, avisa.
export function comprobarCuadre(ex: Extracto): string | null {
  if (ex.saldo_inicial === null || ex.saldo_final === null) return null
  const neto = ex.movimientos.reduce((s, m) => s + (Number(m.importe) || 0), 0)
  const dif = Math.round((ex.saldo_inicial + neto - ex.saldo_final) * 100) / 100
  return Math.abs(dif) < 0.01 ? null : `Los movimientos no cuadran con el saldo final (diferencia ${dif} €): revisar a mano.`
}

// ── Subida de archivos ──────────────────────────────────────────────────
async function subirArchivo(buffer: Buffer, mime: string, fileName: string) {
  const ext = (fileName.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '')
  const d = new Date()
  const path = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabaseAdmin.storage.from(BUCKET).upload(path, buffer, { contentType: mime, upsert: false })
  if (error) throw error
  return path
}

// Sube el archivo al bucket privado, lo lee con IA y guarda la fila.
export async function guardarDocumento(params: {
  buffer: Buffer
  mime: string
  fileName: string
  source: 'panel' | 'telegram'
  subidoPor?: string | null
  notes?: string | null
}) {
  const path = await subirArchivo(params.buffer, params.mime, params.fileName)
  const datos = await extraerDocumento(params.buffer, params.mime)

  const { data: doc, error } = await supabaseAdmin.from('accounting_documents').insert({
    ...(datos || { ai_confidence: 'baja', ai_notes: 'No se pudo leer automáticamente: revisar a mano.' }),
    issue_date: esFechaISO(datos?.issue_date) ? datos!.issue_date : null,
    file_path: path,
    file_name: params.fileName,
    file_mime: params.mime,
    source: params.source,
    subido_por: params.subidoPor || null,
    notes: params.notes || null,
    status: 'pendiente',
  }).select().single()
  if (error) throw error
  return doc
}

// Extracto: una fila de documento (doc_type 'extracto') + una fila por movimiento.
// Los extractos no entran en IVA ni en los totales de facturas.
export async function guardarExtracto(params: {
  buffer: Buffer
  mime: string
  fileName: string
  source: 'panel' | 'telegram'
  subidoPor?: string | null
  notes?: string | null
}) {
  const path = await subirArchivo(params.buffer, params.mime, params.fileName)
  const ex = await extraerExtracto(params.buffer, params.mime)
  const cuadre = ex ? comprobarCuadre(ex) : null
  const notas = [ex?.ai_notes, cuadre].filter(Boolean).join(' ') || null

  const { data: doc, error } = await supabaseAdmin.from('accounting_documents').insert({
    direction: 'otro',
    doc_type: 'extracto',
    issue_date: ex && esFechaISO(ex.periodo_hasta) ? ex.periodo_hasta : null,
    counterparty: ex?.banco ?? null,
    concept: ex
      ? `Extracto${ex.cuenta_last4 ? ` ···${ex.cuenta_last4}` : ''} ${ex.periodo_desde ?? '?'} a ${ex.periodo_hasta ?? '?'}`
      : 'Extracto sin leer',
    category: 'otros',
    saldo_inicial: ex?.saldo_inicial ?? null,
    saldo_final: ex?.saldo_final ?? null,
    ai_confidence: ex ? (cuadre ? 'baja' : 'media') : 'baja',
    ai_notes: notas ?? 'No se pudo leer automáticamente: revisar a mano.',
    file_path: path,
    file_name: params.fileName,
    file_mime: params.mime,
    source: params.source,
    subido_por: params.subidoPor || null,
    notes: params.notes || null,
    status: 'pendiente',
  }).select().single()
  if (error) throw error

  if (ex && ex.movimientos.length) {
    const filas = ex.movimientos.map(m => ({
      document_id: doc.id,
      fecha: esFechaISO(m.fecha) ? m.fecha : null,
      concepto: m.concepto,
      importe: m.importe,
      saldo: m.saldo,
    }))
    const { error: mErr } = await supabaseAdmin.from('movimientos_bancarios').insert(filas)
    if (mErr) {
      // Sin movimientos el extracto no sirve: se deshace la fila para no dejar medio dato.
      await supabaseAdmin.from('accounting_documents').delete().eq('id', doc.id)
      await supabaseAdmin.storage.from(BUCKET).remove([path])
      throw mErr
    }
  }
  return { doc, movimientos: ex?.movimientos.length ?? 0, leido: !!ex }
}

// Procesa varios archivos del panel o de la web. Devuelve un resultado por archivo.
export async function subirArchivosContables(files: File[], opts: {
  tipo: 'factura' | 'extracto'
  subidoPor: string
  notes: string | null
}) {
  const results: any[] = []
  for (const file of files) {
    if (file.size > 15 * 1024 * 1024) {
      results.push({ file: file.name, error: 'Archivo mayor de 15 MB' })
      continue
    }
    const mime = file.type || 'application/octet-stream'
    if (!esTipoSoportado(mime)) {
      results.push({ file: file.name, error: 'Formato no admitido (usa JPG, PNG, WEBP o PDF)' })
      continue
    }
    try {
      const buffer = Buffer.from(await file.arrayBuffer())
      if (opts.tipo === 'extracto') {
        const r = await guardarExtracto({ buffer, mime, fileName: file.name, source: 'panel', subidoPor: opts.subidoPor, notes: opts.notes })
        results.push({ file: file.name, doc: r.doc, movimientos: r.movimientos, leido: r.leido })
      } else {
        const doc = await guardarDocumento({ buffer, mime, fileName: file.name, source: 'panel', subidoPor: opts.subidoPor, notes: opts.notes })
        results.push({ file: file.name, doc })
      }
    } catch (e: any) {
      results.push({ file: file.name, error: e.message })
    }
  }
  return results
}

// ── Periodos y resúmenes ────────────────────────────────────────────────
export function trimestreDe(fecha: string | null | undefined) {
  if (!fecha) return null
  const [y, m] = fecha.split('-').map(Number)
  return `${y}-T${Math.ceil(m / 3)}`
}

export function rangoTrimestre(year: number, q: number) {
  const from = `${year}-${String((q - 1) * 3 + 1).padStart(2, '0')}-01`
  const endMonth = q * 3
  const lastDay = new Date(year, endMonth, 0).getDate()
  const to = `${year}-${String(endMonth).padStart(2, '0')}-${lastDay}`
  return { from, to }
}

export function rangoMes(mes: string) {
  const [y, m] = mes.split('-').map(Number)
  const lastDay = new Date(y, m, 0).getDate()
  return { from: `${y}-${String(m).padStart(2, '0')}-01`, to: `${y}-${String(m).padStart(2, '0')}-${lastDay}` }
}

// Resumen fiscal orientativo (IVA repercutido vs soportado, IRPF retenido).
// La liquidación oficial (303/111/115/200) la presenta la gestoría.
export function resumenFiscal(docs: any[]) {
  const n = (v: any) => Number(v) || 0
  const ingresos = docs.filter(d => d.direction === 'ingreso')
  const gastos = docs.filter(d => d.direction === 'gasto')
  const sum = (arr: any[], k: string) => Math.round(arr.reduce((s, d) => s + n(d[k]), 0) * 100) / 100
  const ivaRepercutido = sum(ingresos, 'vat_amount')
  const ivaSoportado = sum(gastos, 'vat_amount')
  return {
    ingresos_base: sum(ingresos, 'base_amount'),
    ingresos_total: sum(ingresos, 'total_amount'),
    gastos_base: sum(gastos, 'base_amount'),
    gastos_total: sum(gastos, 'total_amount'),
    iva_repercutido: ivaRepercutido,
    iva_soportado: ivaSoportado,
    iva_resultado: Math.round((ivaRepercutido - ivaSoportado) * 100) / 100,
    irpf_retenido_proveedores: sum(gastos, 'irpf_amount'),
    pendientes_revision: docs.filter(d => d.status === 'pendiente').length,
    sin_fecha: docs.filter(d => !d.issue_date).length,
  }
}

// Resumen de la cuenta bancaria a partir de los movimientos de los extractos del periodo.
export function resumenBancario(movs: any[]) {
  const n = (v: any) => Number(v) || 0
  const r2 = (x: number) => Math.round(x * 100) / 100
  const entradas = movs.filter(m => n(m.importe) > 0).reduce((s, m) => s + n(m.importe), 0)
  const salidas = movs.filter(m => n(m.importe) < 0).reduce((s, m) => s + n(m.importe), 0)
  return { movimientos: movs.length, entradas: r2(entradas), salidas: r2(salidas), neto: r2(entradas + salidas) }
}

// ── ZIP para la gestoría ────────────────────────────────────────────────
// Facturas + extractos + movimientos del periodo [from, to] en un único ZIP.
export async function construirZip(from: string, to: string, titulo: string) {
  const { data: docs, error } = await supabaseAdmin.from('accounting_documents').select('*')
    .gte('issue_date', from).lte('issue_date', to).order('issue_date')
  if (error) throw error
  const lista: any[] = docs || []
  const ids = lista.map(d => d.id)
  const { data: movsData } = ids.length
    ? await supabaseAdmin.from('movimientos_bancarios').select('*').in('document_id', ids).order('fecha')
    : { data: [] as any[] }
  const movs: any[] = movsData || []
  const porId = new Map(lista.map(d => [d.id, d]))

  const zip = new JSZip()
  const num = (v: any) => (v === null || v === undefined || v === '' ? '' : Number(v).toFixed(2).replace('.', ','))
  const txt = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const cols = ['Fecha', 'Tipo', 'Documento', 'Nº factura', 'Proveedor/Cliente', 'NIF', 'Concepto', 'Categoría',
    'Base', '% IVA', 'Cuota IVA', '% IRPF', 'Retención IRPF', 'Total', 'Saldo inicial', 'Saldo final',
    'Estado', 'Subido por', 'Archivo', 'Notas IA', 'Notas']
  const rows = [cols.map(txt).join(';')]

  const usados = new Set<string>()
  for (const d of lista) {
    let archivo = ''
    if (d.file_path) {
      const ext = d.file_path.split('.').pop()
      const base = `${d.issue_date}_${String(d.counterparty || 'sin-nombre').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '-').slice(0, 40)}_${num(d.total_amount) || '0'}`
      const carpeta = d.doc_type === 'extracto' ? 'extractos' : d.direction === 'ingreso' ? 'ingresos' : d.direction === 'gasto' ? 'gastos' : 'otros'
      let nombre = `${carpeta}/${base}.${ext}`
      for (let i = 2; usados.has(nombre); i++) nombre = nombre.replace(/(\.\w+)$/, `-${i}$1`)
      usados.add(nombre)
      const { data: blob } = await supabaseAdmin.storage.from(BUCKET).download(d.file_path)
      if (blob) {
        zip.file(nombre, Buffer.from(await blob.arrayBuffer()))
        archivo = nombre
      }
    }
    rows.push([
      txt(d.issue_date), txt(d.direction), txt(d.doc_type), txt(d.invoice_number), txt(d.counterparty),
      txt(d.counterparty_nif), txt(d.concept), txt(d.category), num(d.base_amount), num(d.vat_rate),
      num(d.vat_amount), num(d.irpf_rate), num(d.irpf_amount), num(d.total_amount), num(d.saldo_inicial),
      num(d.saldo_final), txt(d.status), txt(d.subido_por), txt(archivo), txt(d.ai_notes), txt(d.notes),
    ].join(';'))
  }
  // BOM + ";" para que Excel en español lo abra con columnas y acentos bien.
  zip.file('libro.csv', '﻿' + rows.join('\r\n'))

  const movRows = [['Fecha', 'Concepto', 'Importe', 'Saldo', 'Extracto'].map(txt).join(';')]
  for (const m of movs) {
    movRows.push([txt(m.fecha), txt(m.concepto), num(m.importe), num(m.saldo), txt(porId.get(m.document_id)?.concept)].join(';'))
  }
  zip.file('movimientos_bancarios.csv', '﻿' + movRows.join('\r\n'))

  const r = resumenFiscal(lista)
  const b = resumenBancario(movs)
  const e = (v: number) => v.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
  const lineasBanco = movs.length
    ? [`Cuenta bancaria — movimientos: ${b.movimientos} | entradas: ${e(b.entradas)} | salidas: ${e(b.salidas)} | neto: ${e(b.neto)}`]
    : []
  zip.file('resumen.txt', [
    `GROUP 360 INICIATIVAS S.L. — B13911979`,
    `Documentación contable ${titulo} (${from} a ${to})`,
    ``,
    `Documentos: ${lista.length}  (pendientes de revisar: ${r.pendientes_revision})`,
    `Ingresos — base: ${e(r.ingresos_base)} | total: ${e(r.ingresos_total)}`,
    `Gastos   — base: ${e(r.gastos_base)} | total: ${e(r.gastos_total)}`,
    `IVA repercutido: ${e(r.iva_repercutido)}`,
    `IVA soportado:   ${e(r.iva_soportado)}`,
    `Diferencia IVA (orientativa): ${e(r.iva_resultado)}`,
    `Retenciones IRPF practicadas a proveedores: ${e(r.irpf_retenido_proveedores)}`,
    ...lineasBanco,
    ``,
    `Datos extraídos automáticamente y revisados en el panel. Cifras orientativas;`,
    `la liquidación oficial corresponde a la gestoría.`,
  ].join('\r\n'))

  const content = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
  return { content, lista, movs, resumen: r, banco: b }
}

// Envío mensual a la gestoría por correo (Resend). Solo marca como enviados
// los documentos cuando el correo se ha aceptado.
export async function enviarPaqueteMensual(mes: string) {
  const to = process.env.GESTORA_EMAIL
  const key = process.env.RESEND_API_KEY
  if (!to) throw new Error('Falta GESTORA_EMAIL en Vercel')
  if (!key) throw new Error('Falta RESEND_API_KEY en Vercel')
  const from = process.env.EMAIL_FROM || 'GROUP 360 <onboarding@resend.dev>'

  const { from: desde, to: hasta } = rangoMes(mes)
  const { content, lista, movs, resumen } = await construirZip(desde, hasta, `mes ${mes}`)
  if (!lista.length && !movs.length) return { enviado: false, motivo: 'Sin documentos en el mes', mes }

  const e = (v: number) => v.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `GROUP 360 · Documentación contable ${mes}`,
      text: [
        `Adjunto la documentación contable de GROUP 360 INICIATIVAS S.L. del mes ${mes}.`,
        ``,
        `Documentos: ${lista.length} · Movimientos bancarios: ${movs.length}`,
        `IVA repercutido: ${e(resumen.iva_repercutido)} · IVA soportado: ${e(resumen.iva_soportado)}`,
        ``,
        `Incluye libro.csv, movimientos_bancarios.csv, resumen.txt y los archivos originales.`,
      ].join('\n'),
      attachments: [{ filename: `GROUP360_contabilidad_${mes}.zip`, content: content.toString('base64') }],
    }),
  })
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`)

  const ids = lista.map(d => d.id)
  if (ids.length) {
    await supabaseAdmin.from('accounting_documents').update({ status: 'enviado_gestoria' }).in('id', ids)
  }
  return { enviado: true, mes, documentos: lista.length, movimientos: movs.length, to }
}
