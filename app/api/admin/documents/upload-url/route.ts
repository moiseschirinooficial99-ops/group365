import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAdmin, unauthorized } from '@/lib/adminAuth'
import { DOCS_BUCKET, ensureDocsBucket } from '@/lib/documentAnalyzer'

// Devuelve una URL firmada para que el panel suba el PDF directo a Supabase.
// Así no pasa por la función de Vercel (límite de 4,5 MB por petición) y se
// pueden subir dossieres grandes.
const ALLOWED: Record<string, string> = {
  'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized()
  try {
    const { contentType } = await req.json()
    const ext = ALLOWED[contentType]
    if (!ext) return NextResponse.json({ error: 'Formato no admitido (PDF, JPG, PNG o WEBP)' }, { status: 400 })

    await ensureDocsBucket()
    const path = `${new Date().toISOString().slice(0, 10)}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { data, error } = await supabaseAdmin.storage.from(DOCS_BUCKET).createSignedUploadUrl(path)
    if (error || !data) throw error || new Error('Sin URL de subida')
    return NextResponse.json({ path: data.path, token: data.token, bucket: DOCS_BUCKET })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
