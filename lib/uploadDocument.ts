'use client'
// Sube un PDF o imagen al bucket privado y pide a la IA que lo analice.
// Lo usan "Nueva propiedad" y "Oportunidades" del panel.
import { supabase } from '@/lib/supabase'

export type AnalyzeResult = { fields: any | null; images: string[]; isPdf: boolean }

const MAX_BYTES = 20 * 1024 * 1024

// Tipo real del archivo: el navegador a veces lo deja vacío o pone variantes
// (image/jpg, image/pjpeg). Se deduce también por la extensión.
function detectType(file: File): string {
  const t = (file.type || '').toLowerCase()
  const ext = file.name.toLowerCase().split('.').pop() || ''
  if (t === 'application/pdf' || ext === 'pdf') return 'application/pdf'
  if (['image/jpeg', 'image/jpg', 'image/pjpeg'].includes(t) || ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
  if (t === 'image/png' || ext === 'png') return 'image/png'
  if (t === 'image/webp' || ext === 'webp') return 'image/webp'
  if (t.includes('heic') || t.includes('heif') || ext === 'heic' || ext === 'heif') {
    throw new Error('Las fotos HEIC del iPhone no se admiten. Haz captura de pantalla o expórtala como JPG y vuelve a subirla.')
  }
  throw new Error('Formato no admitido. Sube un PDF o una imagen JPG, PNG o WEBP.')
}

// Lee la respuesta aunque el servidor no devuelva JSON (timeout, error 500 de
// Vercel…), para enseñar un mensaje claro en vez de "Unexpected token".
async function readJson(res: Response, paso: string): Promise<any> {
  const text = await res.text()
  try { return JSON.parse(text) } catch { /* no es JSON */ }
  if (res.status === 504 || /timeout/i.test(text)) {
    throw new Error(`${paso}: el documento tardó demasiado en procesarse. Prueba con un PDF más ligero o con menos páginas.`)
  }
  if (res.status === 413) throw new Error(`${paso}: el archivo es demasiado grande.`)
  if (res.status === 401) throw new Error(`${paso}: la sesión del panel ha caducado. Vuelve a entrar.`)
  throw new Error(`${paso}: error del servidor (${res.status}).`)
}

export async function uploadAndAnalyze(file: File, kind: 'opportunity' | 'property'): Promise<AnalyzeResult> {
  if (file.size > MAX_BYTES) {
    throw new Error('El archivo pesa más de 20 MB. Comprime el PDF (por ejemplo en ilovepdf.com) y vuelve a subirlo.')
  }
  const contentType = detectType(file)

  // 1. Pedir URL firmada
  const urlRes = await fetch('/api/admin/documents/upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contentType }),
  })
  const signed = await readJson(urlRes, 'Preparando la subida')
  if (!urlRes.ok) throw new Error(signed.error || 'No se pudo preparar la subida')

  // 2. Subir directo a Supabase. Se envían los bytes en crudo (no el File):
  // con un File la librería lo manda como formulario e ignora contentType, y
  // el bucket rechaza el archivo si el navegador no le puso tipo.
  const bytes = await file.arrayBuffer()
  const { error: upErr } = await supabase.storage.from(signed.bucket)
    .uploadToSignedUrl(signed.path, signed.token, bytes, { contentType })
  if (upErr) throw new Error('Subiendo el archivo: ' + upErr.message)

  // 3. Analizar con IA
  const res = await fetch('/api/admin/documents/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: signed.path, kind }),
  })
  const data = await readJson(res, 'Analizando')
  if (!res.ok) throw new Error(data.error || 'Error analizando el documento')
  return { fields: data.fields ?? null, images: data.images ?? [], isPdf: !!data.isPdf }
}
