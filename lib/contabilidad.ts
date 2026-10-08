import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
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
Recibes un documento (foto de factura o ticket, PDF de factura, extracto bancario, modelo de impuestos…) y extraes sus datos para la contabilidad que se envía a la gestoría.

Criterios:
- direction: "ingreso" si el emisor es GROUP 360 (o B13911979) y factura a un tercero; "gasto" si GROUP 360 es el receptor/pagador; "otro" para extractos, contratos o documentos sin importe a contabilizar.
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

export async function extraerDocumento(buffer: Buffer, mime: string): Promise<Extraccion | null> {
  if (!process.env.ANTHROPIC_API_KEY || !esTipoSoportado(mime)) return null
  const client = new Anthropic()
  const data = buffer.toString('base64')
  const fileBlock: Anthropic.ContentBlockParam = mime === 'application/pdf'
    ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data } }
    : { type: 'image', source: { type: 'base64', media_type: mime as (typeof IMAGE_TYPES)[number], data } }

  try {
    const response = await client.messages.parse({
      model: 'claude-opus-5-5',
      max_tokens: 4000,
      system: SYSTEM,
      output_config: { effort: 'low', format: zodOutputFormat(ExtraccionSchema) },
      messages: [{
        role: 'user',
        content: [fileBlock, { type: 'text', text: 'Extrae los datos contables de este documento.' }],
      }],
    })
    if (response.stop_reason === 'refusal') return null
    return response.parsed_output ? normalizar(response.parsed_output) : null
  } catch (e: any) {
    console.error('Contabilidad: extracción IA falló:', e?.message)
    return null
  }
}

// Sube el archivo al bucket privado, lo lee con IA y guarda la fila.
export async function guardarDocumento(params: {
  buffer: Buffer
  mime: string
  fileName: string
  source: 'panel' | 'telegram'
  notes?: string | null
}) {
  const ext = (params.fileName.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '')
  const d = new Date()
  const path = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { error: upErr } = await supabaseAdmin.storage.from(BUCKET)
    .upload(path, params.buffer, { contentType: params.mime, upsert: false })
  if (upErr) throw upErr

  const datos = await extraerDocumento(params.buffer, params.mime)

  const { data: doc, error } = await supabaseAdmin.from('accounting_documents').insert({
    ...(datos || { ai_confidence: 'baja', ai_notes: 'No se pudo leer automáticamente: revisar a mano.' }),
    issue_date: datos?.issue_date && /^\d{4}-\d{2}-\d{2}$/.test(datos.issue_date) ? datos.issue_date : null,
    file_path: path,
    file_name: params.fileName,
    file_mime: params.mime,
    source: params.source,
    notes: params.notes || null,
    status: 'pendiente',
  }).select().single()
  if (error) throw error
  return doc
}

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
