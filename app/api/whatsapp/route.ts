import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { callOpenAI } from '@/app/api/openai'
import { sendTelegramNotification } from '@/lib/notifications'

const SYSTEM_PROMPT = `Eres el asistente virtual de GROUP 360 INICIATIVAS, la agencia inmobiliaria premium de España.

TU PERSONALIDAD:
- Profesional pero cercano y amigable
- Nunca presionas, GUÍAS al cliente
- Respondes siempre en español
- Máximo 3 párrafos por mensaje, directo y útil
- Usas datos reales de las propiedades del contexto

SABES:
- Todas las propiedades disponibles (se te pasan como contexto)
- Precios, ubicaciones, m², habitaciones, ROI estimado
- Proceso de compra en España
- Inversión en deuda bancaria (quitas): reserva €6.000 reembolsable, oferta al banco, respuesta 7 días, firma notarial 30-90 días
- Alquileres turísticos: precios por noche, temporadas, capacidad
- Empresa: GRUPO 360 INICIATIVAS S.L., NIF B13911979, Reus, Tarragona

TU OBJETIVO:
1. Detectar qué busca: comprar, alquilar vacacional, o invertir
2. Calificar: presupuesto, zona, timeline de decisión
3. Presentar 1-2 propiedades que encajen perfectamente
4. Resolver objeciones con datos concretos
5. Agendar visita o llamada — siempre propón una acción concreta
6. Si el lead es caliente (presupuesto alto, timeline corto) → escalar a humano

Cuando agendes una visita, confirma fecha, hora y dirección.
Nunca inventes propiedades que no existan en la base de datos.
Si no tienes información, ofrece conectar con el agente humano.`

async function sendWA(to: string, body: string) {
  const token = process.env.WHATSAPP_TOKEN
  const phoneId = process.env.WHATSAPP_PHONE_ID
  if (!token || !phoneId) return
  await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body } }),
  }).catch(() => {})
}

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams
  if (
    sp.get('hub.mode') === 'subscribe' &&
    sp.get('hub.verify_token') === process.env.WHATSAPP_VERIFY_TOKEN
  ) {
    return new NextResponse(sp.get('hub.challenge'), { status: 200 })
  }
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const msg = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
    if (!msg || msg.type !== 'text') return NextResponse.json({ ok: true })

    const from = msg.from
    const text = (msg.text?.body || '').trim()

    // Save inbound message
    await supabaseAdmin.from('wa_conversations').insert({
      phone: from, message: text, direction: 'inbound', wa_message_id: msg.id,
    }).catch(() => {})

    // Get last 8 messages for context
    const { data: history } = await supabaseAdmin
      .from('wa_conversations')
      .select('message, direction')
      .eq('phone', from)
      .order('created_at', { ascending: false })
      .limit(8)

    // Get available properties
    const { data: properties } = await supabaseAdmin
      .from('properties')
      .select('id, title, price, location, bedrooms, bathrooms, area_sqm, estimated_roi, channel, property_type')
      .eq('is_active', true)
      .limit(20)

    // Get agent availability
    const { data: availability } = await supabaseAdmin
      .from('agent_availability')
      .select('date_from, date_to, notes, status')
      .gte('date_from', new Date().toISOString())
      .order('date_from')
      .limit(5)

    // Build context
    const propsContext = properties?.length
      ? properties.map((p: any) =>
          `• ${p.title} | €${Number(p.price).toLocaleString('es-ES')} | ${p.location} | ${p.bedrooms}hab ${p.area_sqm}m² | ROI: ${p.estimated_roi || '-'}%`
        ).join('\n')
      : 'No hay propiedades disponibles actualmente.'

    const availContext = availability?.length
      ? availability.map((a: any) =>
          `• ${new Date(a.date_from).toLocaleString('es-ES')} — ${a.notes || a.status}`
        ).join('\n')
      : 'Consulta disponibilidad con el agente.'

    const fullSystemPrompt = `${SYSTEM_PROMPT}

PROPIEDADES DISPONIBLES:
${propsContext}

DISPONIBILIDAD DEL AGENTE:
${availContext}`

    // Build conversation history for OpenAI
    const conversationMessages: Array<{ role: string; content: string }> = [
      { role: 'system', content: fullSystemPrompt },
    ]

    if (history) {
      const sorted = history.slice().reverse()
      sorted.forEach((m: any) => {
        conversationMessages.push({
          role: m.direction === 'inbound' ? 'user' : 'assistant',
          content: m.message,
        })
      })
    }

    // Generate AI reply
    let reply: string
    try {
      reply = await callOpenAI(conversationMessages, 'gpt-4o-mini', 500)
    } catch {
      reply = `Gracias por escribirnos. 🏠\n\nUn especialista de *GROUP 360* te contactará pronto.\n\nPuedes también llamarnos o visitar group365.vercel.app`
    }

    // Send response
    await sendWA(from, reply)

    // Save outbound message
    await supabaseAdmin.from('wa_conversations').insert({
      phone: from, message: reply, direction: 'outbound',
    }).catch(() => {})

    // Detect hot lead keywords → notify owner
    const hotKeywords = ['compro', 'comprar', 'presupuesto', 'inversión', 'invertir', 'cuándo podemos', 'visita', 'me interesa']
    const isHot = hotKeywords.some(k => text.toLowerCase().includes(k))
    if (isHot) {
      await sendTelegramNotification(
        `💬 <b>WhatsApp activo — posible lead caliente</b>\n\n📱 ${from}\n💬 "${text.slice(0, 100)}"`
      )
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ ok: true })
  }
}
