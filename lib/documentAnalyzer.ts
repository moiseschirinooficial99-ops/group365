// ═══════════════════════════════════════════════════════
// ANALIZADOR DE DOCUMENTOS — GROUP 360
// Recibe un PDF (dossier, ficha, flyer) o una imagen subida al bucket privado
// y devuelve:
//   · los datos estructurados (oportunidad de inversión o propiedad) leídos con IA
//   · las fotos que lleva el PDF dentro, ya subidas al bucket público de fotos
// ═══════════════════════════════════════════════════════
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { PDFDocument, PDFName, PDFNumber, PDFRawStream, PDFArray } from 'pdf-lib'
import { supabaseAdmin } from '@/lib/supabase'

export const DOCS_BUCKET = 'property-docs'   // privado: PDFs originales
const PHOTOS_BUCKET = 'property-images'      // público: fotos de fichas
const MAX_PHOTOS = 15
const MIN_W = 400, MIN_H = 300, MIN_BYTES = 25_000 // descarta logos e iconos

export type DocKind = 'opportunity' | 'property'

// ── Esquemas de extracción ────────────────────────────
const OpportunitySchema = z.object({
  category: z.string().describe('npl | reo | cesion_remate | producto_ocupado | fondo'),
  title: z.string().describe('Título corto y comercial, máx 80 caracteres'),
  location: z.string().nullable(),
  offer_price: z.number().nullable().describe('Precio de venta/oferta en euros, entero'),
  property_value: z.number().nullable().describe('Valor de mercado en euros, entero'),
  debt_value: z.number().nullable().describe('Valor de la deuda en euros, solo NPL'),
  roi_estimated: z.number().nullable().describe('ROI estimado en %, solo el número'),
  estimated_timeline: z.string().nullable(),
  description: z.string().describe('Resumen profesional de 2-4 frases'),
})

const PropertySchema = z.object({
  tipo: z.string().describe('venta | alquiler | bancaria'),
  title: z.string().describe('Título corto y comercial, máx 80 caracteres'),
  location: z.string().nullable().describe('Municipio y zona'),
  price: z.number().nullable().describe('Precio en euros, entero (en alquiler turístico: precio por semana)'),
  area_sqm: z.number().nullable().describe('Superficie construida en m²'),
  plot_m2: z.number().nullable().describe('Superficie de parcela en m²'),
  bedrooms: z.number().nullable(),
  bathrooms: z.number().nullable(),
  estimated_roi: z.number().nullable().describe('Rentabilidad estimada en %, solo si aparece'),
  price_per_night: z.number().nullable().describe('Solo alquiler turístico'),
  description: z.string().describe('Descripción comercial de 3-5 frases'),
})

const SYSTEM_OPPORTUNITY = `Eres el analista de inversión inmobiliaria de GROUP 360 INICIATIVAS (Costa Dorada, Tarragona).
Recibes el dossier, flyer o ficha de una oportunidad de inversión y extraes sus datos.
- category: NPL = hipoteca impagada / derecho de cobro; REO = activo adjudicado o venta directa de inmueble o sociedad; cesion_remate = subasta desierta; producto_ocupado = inmueble con ocupante; fondo = pool de GROUP 360. Venta directa de un inmueble o complejo → "reo".
- Importes en euros como enteros, sin puntos ni símbolos (7000000).
- description: tono de firma de asesoría patrimonial, con los datos clave (unidades, superficie, estado, ubicación). Sin promesas de rentabilidad garantizada.
- No inventes: si un dato no aparece, null.`

const SYSTEM_PROPERTY = `Eres el comercial de GROUP 360 INICIATIVAS (inmobiliaria en la Costa Dorada, Tarragona).
Recibes la ficha, dossier o folleto de un inmueble y extraes sus datos para publicarlo en la web.
- tipo: "alquiler" si es alquiler vacacional/turístico; "bancaria" si es activo de banco, subasta o NPL; si no, "venta".
- Importes en euros como enteros, sin puntos ni símbolos. Superficies en m² como números.
- description: texto comercial en español, cálido y profesional, que destaque ubicación, distribución y puntos fuertes. Sin inventar nada que no esté en el documento.
- No inventes: si un dato no aparece, null.`

const pick = (v: string, allowed: string[], fallback: string) => {
  const s = (v || '').toLowerCase().trim()
  return allowed.includes(s) ? s : fallback
}

// ── Lectura con IA ────────────────────────────────────
async function extractFields(kind: DocKind, buffer: Buffer, mime: string) {
  const client = new Anthropic()
  const data = buffer.toString('base64')
  const fileBlock: Anthropic.ContentBlockParam = mime === 'application/pdf'
    ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data } }
    : { type: 'image', source: { type: 'base64', media_type: mime as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif', data } }

  const schema = kind === 'opportunity' ? OpportunitySchema : PropertySchema
  const response = await client.messages.parse({
    model: 'claude-opus-5-5',
    max_tokens: 4000,
    system: kind === 'opportunity' ? SYSTEM_OPPORTUNITY : SYSTEM_PROPERTY,
    output_config: { effort: 'low', format: zodOutputFormat(schema as any) },
    messages: [{
      role: 'user',
      content: [fileBlock, { type: 'text', text: 'Extrae los datos de este documento.' }],
    }],
  })
  if (response.stop_reason === 'refusal' || !response.parsed_output) return null
  const out: any = response.parsed_output
  if (kind === 'opportunity') out.category = pick(out.category, ['npl', 'reo', 'cesion_remate', 'producto_ocupado', 'fondo'], 'reo')
  else out.tipo = pick(out.tipo, ['venta', 'alquiler', 'bancaria'], 'venta')
  return out
}

// ── Fotos incrustadas en el PDF ───────────────────────
// Las fotos de un dossier van casi siempre como JPEG (filtro DCTDecode): los
// bytes del stream son el .jpg tal cual, así que se copian sin recodificar.
// Se descartan logos/iconos (pequeños) y los JPEG en CMYK (salen con colores
// raros en el navegador).
export async function extractPdfPhotos(buffer: Buffer): Promise<Buffer[]> {
  const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true, updateMetadata: false })
  const found: { bytes: Buffer; area: number }[] = []
  const seen = new Set<string>()

  for (const [, obj] of pdf.context.enumerateIndirectObjects()) {
    if (!(obj instanceof PDFRawStream)) continue
    const dict = obj.dict
    if (dict.get(PDFName.of('Subtype')) !== PDFName.of('Image')) continue

    const filter = dict.get(PDFName.of('Filter'))
    const filters = filter instanceof PDFArray ? filter.asArray() : [filter]
    if (filters.length !== 1 || filters[0] !== PDFName.of('DCTDecode')) continue
    if (dict.get(PDFName.of('ColorSpace')) === PDFName.of('DeviceCMYK')) continue

    const w = (dict.get(PDFName.of('Width')) as PDFNumber | undefined)?.asNumber() ?? 0
    const h = (dict.get(PDFName.of('Height')) as PDFNumber | undefined)?.asNumber() ?? 0
    const bytes = Buffer.from(obj.contents)
    if (w < MIN_W || h < MIN_H || bytes.length < MIN_BYTES) continue

    const key = `${bytes.length}-${bytes.subarray(0, 64).toString('hex')}`
    if (seen.has(key)) continue // la misma foto repetida en varias páginas
    seen.add(key)
    found.push({ bytes, area: w * h })
  }
  // Orden del documento, pero si hay demasiadas, nos quedamos con las más grandes
  if (found.length > MAX_PHOTOS) {
    const top = new Set([...found].sort((a, b) => b.area - a.area).slice(0, MAX_PHOTOS))
    return found.filter(f => top.has(f)).map(f => f.bytes)
  }
  return found.map(f => f.bytes)
}

async function uploadPhoto(bytes: Buffer, ext: string, contentType: string): Promise<string | null> {
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabaseAdmin.storage.from(PHOTOS_BUCKET)
    .upload(path, bytes, { contentType, upsert: false })
  if (error) { console.warn('Foto no subida:', error.message); return null }
  return supabaseAdmin.storage.from(PHOTOS_BUCKET).getPublicUrl(path).data.publicUrl
}

// ── Bucket privado para los originales ────────────────
export async function ensureDocsBucket() {
  const { data } = await supabaseAdmin.storage.getBucket(DOCS_BUCKET)
  if (data) return
  const { error } = await supabaseAdmin.storage.createBucket(DOCS_BUCKET, {
    public: false,
    fileSizeLimit: '20MB', // la IA admite hasta 32 MB por petición (el PDF va en base64, +33 %)
    allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
  })
  if (error && !/already exists/i.test(error.message)) throw error
}

// ── Punto de entrada ─────────────────────────────────
export async function analyzeDocument(kind: DocKind, path: string) {
  const { data: blob, error } = await supabaseAdmin.storage.from(DOCS_BUCKET).download(path)
  if (error || !blob) throw new Error('No se pudo leer el archivo subido')
  const buffer = Buffer.from(await blob.arrayBuffer())
  const mime = blob.type || (path.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg')
  const isPdf = mime === 'application/pdf'

  const [fields, photos] = await Promise.all([
    extractFields(kind, buffer, mime).catch(e => { console.error('IA documento:', e?.message); return null }),
    isPdf
      ? extractPdfPhotos(buffer).catch(e => { console.warn('Fotos PDF:', e?.message); return [] as Buffer[] })
      : Promise.resolve([buffer]),
  ])

  // En paralelo para no agotar el tiempo de la función con dossieres de muchas fotos
  const urls = await Promise.all(photos.map(bytes => isPdf
    ? uploadPhoto(bytes, 'jpg', 'image/jpeg')
    : uploadPhoto(bytes, mime.split('/')[1] || 'jpg', mime)))
  const images = urls.filter((u): u is string => !!u)
  return { fields, images, isPdf }
}
