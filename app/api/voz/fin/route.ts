import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendTelegramNotification } from '@/lib/notifications'
import { firmaWebhookValida } from '@/lib/voz'

// Webhook "post-call" de ElevenLabs: al colgar, guarda el resumen en el lead y avisa por Telegram.
export async function POST(req: NextRequest) {
  const raw = await req.text()
  if (!firmaWebhookValida(raw, req.headers.get('elevenlabs-signature'))) {
    return NextResponse.json({ error: 'Firma no válida' }, { status: 401 })
  }
  const evento = JSON.parse(raw)
  if (evento?.type !== 'post_call_transcription') return NextResponse.json({ ok: true })

  const d = evento.data || {}
  const vars = d.conversation_initiation_client_data?.dynamic_variables || {}
  const telefono: string = vars.system__called_number || d.metadata?.phone_call?.external_number || ''
  const resumen: string = d.analysis?.transcript_summary || 'Sin resumen'
  const datos = d.analysis?.data_collection_results || {}
  const valor = (k: string) => datos[k]?.value ?? null
  const temperatura = valor('temperatura') || 'sin dato'
  const segundos = Math.round(d.metadata?.call_duration_secs || 0)

  const transcripcion = (d.transcript || [])
    .map((t: any) => `${t.role === 'agent' ? 'Alejandro' : 'Cliente'}: ${t.message || ''}`)
    .join('\n').slice(0, 20000)

  const digitos = telefono.replace(/\D/g, '').slice(-9)
  if (digitos.length === 9) {
    const { data } = await supabaseAdmin.from('leads').select('id, notes')
      .ilike('phone', `%${digitos}%`).order('created_at', { ascending: false }).limit(1)
    const lead = data?.[0]
    if (lead) {
      const nota = `📞 Llamada con Alejandro (${segundos}s, ${temperatura}): ${resumen}`
      await supabaseAdmin.from('leads').update({
        notes: [lead.notes, nota].filter(Boolean).join('\n\n').slice(0, 10000),
        last_contact_at: new Date().toISOString(),
      }).eq('id', lead.id)
    }
  }

  await sendTelegramNotification(
    `📞 <b>Llamada terminada</b> (${segundos}s) — ${temperatura}\n👤 ${vars.nombre || 'sin nombre'} ${telefono}\n` +
    `${valor('operacion') ? `🔑 ${valor('operacion')} · ` : ''}${valor('zona') || ''} ${valor('presupuesto') ? `· 💶 ${valor('presupuesto')}` : ''}\n\n📝 ${resumen}`
  ).catch(() => {})

  console.log('VOZ fin', d.conversation_id, segundos, transcripcion.length)
  return NextResponse.json({ ok: true })
}
