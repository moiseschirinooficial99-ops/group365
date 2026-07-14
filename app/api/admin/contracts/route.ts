import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Autoriza al admin por cookie (panel) o por API key (n8n / integraciones).
function authorized(req: NextRequest): boolean {
  const cookie = req.cookies.get('admin_token')?.value
  const apiKey = req.headers.get('x-api-key')
  const secret = process.env.ADMIN_SECRET
  const contractsKey = process.env.CONTRACTS_API_KEY || secret
  return (!!secret && cookie === secret) || (!!contractsKey && apiKey === contractsKey)
}

// GET — historial de contratos (opcional ?id= para uno solo)
export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const id = new URL(req.url).searchParams.get('id')

  if (id) {
    const { data, error } = await supabaseAdmin.from('contratos').select('*').eq('id', id).single()
    if (error) return NextResponse.json({ error: error.message }, { status: 404 })
    return NextResponse.json(data)
  }

  const { data, error } = await supabaseAdmin
    .from('contratos')
    .select('*')
    .order('fecha', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

// POST — crear (o guardar) un contrato en borrador
export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try {
    const body = await req.json()
    const tipo = body.tipo || body.tipo_contrato
    const datos = body.datos || body.datos_contrato || {}
    if (!tipo) return NextResponse.json({ error: 'Falta el tipo de contrato' }, { status: 400 })

    const row = {
      tipo,
      datos_json: datos,
      estado: body.estado || 'borrador',
      destinatario: datos.email_destinatario || body.email_destinatario || null,
      nombre_destinatario: datos.nombre_destinatario || body.nombre_destinatario || null,
    }

    const { data, error } = await supabaseAdmin.from('contratos').insert(row).select().single()
    if (error) throw error
    return NextResponse.json({ ok: true, data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// PATCH — actualizar estado / datos (?id=)
export async function PATCH(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try {
    const id = new URL(req.url).searchParams.get('id') || (await req.clone().json()).id
    const body = await req.json()
    const updates: Record<string, any> = {}
    if (body.estado) updates.estado = body.estado
    if (body.datos || body.datos_json) {
      const datos = body.datos || body.datos_json
      updates.datos_json = datos
      updates.destinatario = datos.email_destinatario || updates.destinatario
      updates.nombre_destinatario = datos.nombre_destinatario || updates.nombre_destinatario
    }
    if (body.destinatario) updates.destinatario = body.destinatario

    const { error } = await supabaseAdmin.from('contratos').update(updates).eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// DELETE — borrar un contrato (?id=)
export async function DELETE(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })
  const { error } = await supabaseAdmin.from('contratos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
