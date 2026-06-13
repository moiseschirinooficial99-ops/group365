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
6. Si el lead es caliente → escalar a humano

Nunca inventes propiedades que no existan en la base de datos.
Si no tienes información, ofrece conectar con el agente humano.`

async function sendWA(to: string, body: string): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.WHATSAPP_TOKEN
  const phoneId = process.env.WHATSAPP_PHONE_ID
  if (!token || !phoneId) {
    console.error('WA SEND: missing token or phoneId', { hasToken: !!token, hasPhoneId: !!phoneId })
    return { ok: false, error: 'missing_credentials' }
  }

  const url = `https://graph.facebook.com/v18.0/${phoneId}/messages`
  console.log('WA SEND →', { phoneId, to, bodyPreview: body.slice(0, 80) })

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body } }),
    })
    const json = await res.json()
    console.log('WA SEND response:', res.status, JSON.stringify(json))

    if (!res.ok) {
      const errCode = json?.error?.code
      const errMsg = json?.error?.message || 'unknown'
      if (res.status === 401 || errCode === 190) {
        await sendTelegramNotification(
          `🚨 <b>WhatsApp token expirado</b>\n\nGenera un nuevo token en Meta Business y actualiza WHATSAPP_TOKEN en Vercel.\n\nError: ${errMsg}`
        )
        return { ok: false, error: 'token_expired' }
      }
      return { ok: false, error: errMsg }
    }
    return { ok: true }
  } catch (e: any) {
    console.error('WA SEND exception:', e.message)
    return { ok: false, error: e.message }
  }
}

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams
  const mode = sp.get('hub.mode')
  const token = sp.get('hub.verify_token')
  const challenge = sp.get('hub.challenge')
  console.log('WA VERIFY:', { mode, token: token?.slice(0, 8) })
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

export async function POST(req: NextRequest) {
  let rawBody: any
  try {
    rawBody = await req.json()
  } catch {
    return NextResponse.json({ ok: true })
  }

  console.log('WA WEBHOOK RECEIVED:', JSON.stringify(rawBody, null, 2))

  try {
    const msg = rawBody.entry?.[0]?.changes?.[0]?.value?.messages?.[0]

    if (!msg || msg.type !== 'text') {
      console.log('WA: skipping — no text message')
      return NextResponse.json({ ok: true })
    }

    const from = msg.from
    const text = (msg.text?.body || '').trim()
    console.log('WA MESSAGE from', from, ':', text)

    // Guardar mensaje entrante — patrón correcto Supabase v2
    const { error: insertErr } = await supabaseAdmin.from('wa_conversations').insert({
      phone: from, message: text, direction: 'inbound', wa_message_id: msg.id,
    })
    if (insertErr) console.error('WA: save inbound failed:', insertErr.message)

    // Historial
    const { data: history, error: histErr } = await supabaseAdmin
      .from('wa_conversations')
      .select('message, direction')
      .eq('phone', from)
      .order('created_at', { ascending: false })
      .limit(8)
    if (histErr) console.error('WA: history fetch failed:', histErr.message)

    // Propiedades activas
    const { data: properties, error: propsErr } = await supabaseAdmin
      .from('properties')
      .select('id, title, price, location, bedrooms, bathrooms, area_sqm, estimated_roi, channel')
      .eq('is_active', true)
      .limit(20)
    if (propsErr) console.error('WA: properties fetch failed:', propsErr.message)

    // Disponibilidad agente
    const { data: availability } = await supabaseAdmin
      .from('agent_availability')
      .select('date_from, date_to, notes, status')
      .gte('date_from', new Date().toISOString())
      .order('date_from')
      .limit(5)

    const propsContext = properties?.length
      ? properties.map((p: any) =>
          `• ${p.title} | €${Number(p.price).toLocaleString('es-ES')} | ${p.location} | ${p.bedrooms || '-'}hab ${p.area_sqm || '-'}m² | ROI: ${p.estimated_roi || '-'}%`
        ).join('\n')
      : 'No hay propiedades disponibles actualmente.'

    const availContext = availability?.length
      ? availability.map((a: any) =>
          `• ${new Date(a.date_from).toLocaleString('es-ES')} — ${a.notes || a.status}`
        ).join('\n')
      : 'Sin visitas agendadas próximamente.'

    const fullSystemPrompt = `${SYSTEM_PROMPT}\n\nPROPIEDADES DISPONIBLES:\n${propsContext}\n\nDISPONIBILIDAD DEL AGENTE:\n${availContext}`

    const conversationMessages: Array<{ role: string; content: string }> = [
      { role: 'system', content: fullSystemPrompt },
    ]
    if (history) {
      history.slice().reverse().forEach((m: any) => {
        conversationMessages.push({
          role: m.direction === 'inbound' ? 'user' : 'assistant',
          content: m.message,
        })
      })
    }

    // Respuesta IA
    let reply: string
    if (!process.env.OPENAI_API_KEY) {
      console.warn('WA: OPENAI_API_KEY not set — using fallback')
      reply = `Hola! Soy el asistente de GROUP 360 INICIATIVAS. 🏠\n\nUn especialista te contactará pronto.\n\nMás info: https://group365.vercel.app`
    } else {
      try {
        reply = await callOpenAI(conversationMessages, 'gpt-4o-mini', 500)
        console.log('WA AI reply:', reply.slice(0, 100))
      } catch (e: any) {
        console.error('WA: OpenAI error:', e.message)
        reply = `Gracias por escribirnos. 🏠\n\nUn especialista de GROUP 360 te contactará pronto.\n\nVisítanos: https://group365.vercel.app`
      }
    }

    // Enviar respuesta por WhatsApp
    const sendResult = await sendWA(from, reply)
    console.log('WA SEND result:', sendResult)

    // Guardar respuesta saliente
    const { error: outErr } = await supabaseAdmin.from('wa_conversations').insert({
      phone: from, message: reply, direction: 'outbound',
    })
    if (outErr) console.error('WA: save outbound failed:', outErr.message)

    // Notificar si lead caliente
    const hotKeywords = ['compro', 'comprar', 'presupuesto', 'inversión', 'invertir', 'visita', 'me interesa', 'cuánto cuesta', 'precio']
    const isHot = hotKeywords.some(k => text.toLowerCase().includes(k))
    if (isHot) {
      await sendTelegramNotification(
        `💬 <b>WhatsApp — lead caliente</b>\n\n📱 ${from}\n💬 "${text.slice(0, 150)}"`
      )
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('WA POST unhandled error:', e.message, e.stack)
    return NextResponse.json({ ok: true })
  }
}
