import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAdmin, unauthorized } from '@/lib/adminAuth'
import { BUCKET } from '@/lib/contabilidad'

// GET ?id= → redirige a un enlace firmado de 5 minutos al archivo original.
// El bucket es privado: nunca hay URL pública permanente de una factura.
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized()
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })
  const { data: doc } = await supabaseAdmin.from('accounting_documents').select('file_path').eq('id', id).single()
  if (!doc?.file_path) return NextResponse.json({ error: 'Sin archivo' }, { status: 404 })
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(doc.file_path, 300)
  if (error || !data) return NextResponse.json({ error: error?.message || 'Error' }, { status: 500 })
  return NextResponse.redirect(data.signedUrl)
}
