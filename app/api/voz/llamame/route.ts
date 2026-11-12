import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { clientIp, isHoneypotHit, rateLimited } from '@/lib/leadInput'
import { sendTelegramNotification } from '@/lib/notifications'
import { fichaHablada, lanzarLlamada, telefonoE164 } from '@/lib/voz'

// "Llámame ahora" desde la ficha de un piso: guarda el lead y Alejandra llama en segundos.
// Solo llama si la persona marcó que acepta la llamada (consentimiento).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as Record<string, any>
  if (isHoneypotHit(body)) return NextResponse.json({ ok: true })

  const nombre = String(body.nombre || '').trim().slice(0, 60)
  const tel = telefonoE164(String(body.telefono || ''))
  if (!nombre || !tel) return NextResponse.json({ error: 'Pon tu nombre y un teléfono español válido.' }, { status: 400 })
  if (body.acepta !== true) return NextResponse.json({ error: 'Marca la casilla para que podamos llamarte.' }, { status: 400 })

  if (rateLimited(`voz:${clientIp(req.headers)}`, 3, 30 * 60 * 1000) || rateLimited(`voz:${tel}`, 2, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Ya te estamos llamando. Si no te llega, escríbenos por WhatsApp.' }, { status: 429 })
  }

  let piso: any = null
  if (body.propiedad_id) {
    const { data } = await supabaseAdmin.from('properties').select('*').eq('id', String(body.propiedad_id)).limit(1)
    piso = data?.[0] || null
  }

  await supabaseAdmin.from('leads').insert({
    name: nombre, phone: tel, source: 'voz_llamame', status: 'new', type: 'buyer',
    message: piso ? `Pidió llamada desde la ficha: ${piso.title}` : 'Pidió llamada desde la web',
  })

  try {
    const r = await lanzarLlamada(tel, {
      nombre,
      saludo: `Hola ${nombre.split(' ')[0]}`,
      motivo: piso ? `me has pedido que te llame por ${piso.title}` : 'me has pedido que te llame desde la web',
      resumen_chat: '(sin chat previo: pidió la llamada desde la ficha de la web)',
      telefono: tel,
      propiedad: piso?.title || 'ninguna en concreto',
      propiedad_id: piso?.id ? String(piso.id) : '',
      propiedad_ficha: piso ? fichaHablada(piso) : 'Sin piso concreto: pregúntale qué busca.',
    })
    sendTelegramNotification(`📞 <b>Alejandra está llamando</b> a ${nombre} (${tel})${piso ? `\n🏠 ${piso.title}` : ''}`).catch(() => {})
    return NextResponse.json({ ok: true, conversation_id: r.conversation_id })
  } catch (e: any) {
    console.error('VOZ llamame:', e.message)
    sendTelegramNotification(`⚠️ <b>No se pudo lanzar la llamada</b> a ${nombre} (${tel}). Llámale tú.\n${e.message}`).catch(() => {})
    return NextResponse.json({ error: 'No hemos podido llamarte ahora. Te llamamos en unos minutos.' }, { status: 502 })
  }
}
