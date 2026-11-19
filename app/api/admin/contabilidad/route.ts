import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAdmin, unauthorized } from '@/lib/adminAuth'
import {
  BUCKET, SUBIDORES, rangoTrimestre, resumenBancario, resumenFiscal, subirArchivosContables,
} from '@/lib/contabilidad'

export const maxDuration = 300 // leer extractos largos con IA puede tardar

// GET ?year=2026&q=4 (q opcional: sin q = año completo)
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized()
  const sp = req.nextUrl.searchParams
  const year = Number(sp.get('year')) || new Date().getFullYear()
  const q = Number(sp.get('q')) || 0

  let query = supabaseAdmin.from('accounting_documents').select('*')
  if (q >= 1 && q <= 4) {
    const { from, to } = rangoTrimestre(year, q)
    // Incluye también los que aún no tienen fecha (para que no se pierdan).
    query = query.or(`and(issue_date.gte.${from},issue_date.lte.${to}),issue_date.is.null`)
  } else {
    query = query.or(`and(issue_date.gte.${year}-01-01,issue_date.lte.${year}-12-31),issue_date.is.null`)
  }
  const { data, error } = await query.order('issue_date', { ascending: false, nullsFirst: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const docs: any[] = data || []

  const ids = docs.map(d => d.id)
  const { data: movs } = ids.length
    ? await supabaseAdmin.from('movimientos_bancarios').select('*').in('document_id', ids).order('fecha', { ascending: false })
    : { data: [] as any[] }
  const movimientos: any[] = movs || []

  const conFecha = docs.filter(d => d.issue_date)
  return NextResponse.json({
    docs,
    movimientos,
    resumen: resumenFiscal(conFecha),
    banco: resumenBancario(movimientos.filter(m => m.fecha)),
  })
}

// POST multipart: file (uno o varios) + tipo ('factura' | 'extracto') + subido_por + notes opcional
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized()
  try {
    const form = await req.formData()
    const files = form.getAll('file').filter((f): f is File => f instanceof File)
    if (!files.length) return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 })
    const tipo = form.get('tipo') === 'extracto' ? 'extracto' : 'factura'
    const quien = String(form.get('subido_por') || '')
    const subidoPor = (SUBIDORES as readonly string[]).includes(quien) ? quien : SUBIDORES[0]
    const notes = (form.get('notes') as string) || null

    const results = await subirArchivosContables(files, { tipo, subidoPor, notes })
    return NextResponse.json({ ok: true, results })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

const EDITABLE = [
  'direction', 'doc_type', 'issue_date', 'counterparty', 'counterparty_nif', 'invoice_number', 'concept',
  'category', 'base_amount', 'vat_rate', 'vat_amount', 'irpf_rate', 'irpf_amount', 'total_amount',
  'status', 'notes',
] as const

export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized()
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })
  const body = await req.json()
  const update: Record<string, any> = {}
  for (const k of EDITABLE) if (k in body) update[k] = body[k] === '' ? null : body[k]
  const { error } = await supabaseAdmin.from('accounting_documents').update(update).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized()
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })
  const { data: doc } = await supabaseAdmin.from('accounting_documents').select('file_path').eq('id', id).single()
  // Los movimientos del extracto se borran solos (ON DELETE CASCADE).
  const { error } = await supabaseAdmin.from('accounting_documents').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (doc?.file_path) await supabaseAdmin.storage.from(BUCKET).remove([doc.file_path])
  return NextResponse.json({ ok: true })
}
