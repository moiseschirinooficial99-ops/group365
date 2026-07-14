import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getContractType } from '@/lib/contracts'

// Dispara el workflow de n8n que genera el PDF, lo envía por email (SMTP Hostalia),
// actualiza el estado en Supabase y notifica por Telegram.
export async function POST(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value
  if (!token || token !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const webhookUrl = process.env.N8N_CONTRACT_WEBHOOK_URL
  if (!webhookUrl) {
    return NextResponse.json({ error: 'Falta configurar N8N_CONTRACT_WEBHOOK_URL' }, { status: 500 })
  }

  try {
    const body = await req.json()
    const tipo = body.tipo || body.tipo_contrato
    const datos = body.datos || body.datos_contrato || {}
    let contratoId = body.contrato_id || body.id

    const emailDestinatario = datos.email_destinatario || body.email_destinatario
    const nombreDestinatario = datos.nombre_destinatario || body.nombre_destinatario || ''

    if (!tipo || !getContractType(tipo)) {
      return NextResponse.json({ error: 'Tipo de contrato inválido' }, { status: 400 })
    }
    if (!emailDestinatario) {
      return NextResponse.json({ error: 'Falta el email del destinatario' }, { status: 400 })
    }

    // Si aún no existe en BD, lo creamos como borrador para tener un contrato_id
    if (!contratoId) {
      const { data, error } = await supabaseAdmin
        .from('contratos')
        .insert({
          tipo,
          datos_json: datos,
          estado: 'borrador',
          destinatario: emailDestinatario,
          nombre_destinatario: nombreDestinatario,
        })
        .select()
        .single()
      if (error) throw error
      contratoId = data.id
    } else {
      // Refrescamos los datos por si el admin editó justo antes de enviar
      await supabaseAdmin
        .from('contratos')
        .update({ datos_json: datos, destinatario: emailDestinatario, nombre_destinatario: nombreDestinatario })
        .eq('id', contratoId)
    }

    // Payload que espera el webhook de n8n
    const payload = {
      tipo_contrato: tipo,
      datos_contrato: datos,
      email_destinatario: emailDestinatario,
      nombre_destinatario: nombreDestinatario,
      contrato_id: contratoId,
    }

    const n8nRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!n8nRes.ok) {
      await supabaseAdmin.from('contratos').update({ estado: 'error' }).eq('id', contratoId)
      const errText = await n8nRes.text().catch(() => '')
      return NextResponse.json(
        { error: `n8n respondió ${n8nRes.status}`, detail: errText, contrato_id: contratoId },
        { status: 502 },
      )
    }

    const result = await n8nRes.json().catch(() => ({ success: true }))
    return NextResponse.json({ ok: true, contrato_id: contratoId, n8n: result })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
