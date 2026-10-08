import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAdmin, unauthorized } from '@/lib/adminAuth'
import { crearCita, CITA_KINDS, CITA_STATUSES } from '@/lib/citas'

// GET ?from=ISO&to=ISO → citas del rango + bloques de disponibilidad.
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized()
  const sp = req.nextUrl.searchParams
  const from = sp.get('from') || new Date(Date.now() - 7 * 864e5).toISOString()
  const to = sp.get('to') || new Date(Date.now() + 60 * 864e5).toISOString()

  const [{ data: citas, error }, { data: bloques }] = await Promise.all([
    supabaseAdmin.from('appointments').select('*, properties(title)')
      .gte('starts_at', from).lte('starts_at', to).order('starts_at'),
    supabaseAdmin.from('agent_availability').select('*')
      .gte('date_from', from).lte('date_from', to).order('date_from'),
  ])
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ citas: citas || [], bloques: bloques || [] })
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized()
  try {
    const body = await req.json()
    if (!body.name || !body.starts_at || isNaN(Date.parse(body.starts_at))) {
      return NextResponse.json({ error: 'Faltan nombre o fecha válida' }, { status: 400 })
    }
    const cita = await crearCita({ ...body, source: body.source || 'panel' })
    return NextResponse.json({ ok: true, cita })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// PATCH ?id= → solo campos editables (estado, fecha, notas…).
export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized()
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })
  const body = await req.json()
  const update: Record<string, any> = {}
  for (const k of ['name', 'phone', 'email', 'notes', 'duration_min', 'property_id'] as const) {
    if (k in body) update[k] = body[k]
  }
  if (body.kind && CITA_KINDS.includes(body.kind)) update.kind = body.kind
  if (body.status && CITA_STATUSES.includes(body.status)) update.status = body.status
  if (body.starts_at && !isNaN(Date.parse(body.starts_at))) {
    update.starts_at = body.starts_at
    update.reminder_sent_at = null // si se mueve, se vuelve a recordar
  }
  const { error } = await supabaseAdmin.from('appointments').update(update).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized()
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })
  const { error } = await supabaseAdmin.from('appointments').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
