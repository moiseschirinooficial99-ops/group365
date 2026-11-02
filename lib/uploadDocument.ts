'use client'
// Sube un PDF o imagen al bucket privado y pide a la IA que lo analice.
// Lo usan "Nueva propiedad" y "Oportunidades" del panel.
import { supabase } from '@/lib/supabase'

export type AnalyzeResult = { fields: any | null; images: string[]; isPdf: boolean }

export async function uploadAndAnalyze(file: File, kind: 'opportunity' | 'property'): Promise<AnalyzeResult> {
  if (file.size > 20 * 1024 * 1024) {
    throw new Error('El archivo pesa más de 20 MB. Comprime el PDF (por ejemplo en ilovepdf.com) y vuelve a subirlo.')
  }
  const contentType = file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : '')
  const urlRes = await fetch('/api/admin/documents/upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contentType }),
  })
  const signed = await urlRes.json()
  if (!urlRes.ok) throw new Error(signed.error || 'No se pudo preparar la subida')

  const { error: upErr } = await supabase.storage.from(signed.bucket)
    .uploadToSignedUrl(signed.path, signed.token, file, { contentType })
  if (upErr) throw new Error('Error subiendo el archivo: ' + upErr.message)

  const res = await fetch('/api/admin/documents/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: signed.path, kind }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error analizando el documento')
  return { fields: data.fields ?? null, images: data.images ?? [], isPdf: !!data.isPdf }
}
