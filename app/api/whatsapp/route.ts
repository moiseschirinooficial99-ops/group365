import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { callOpenAI } from '@/app/api/openai'
import { sendTelegramNotification } from '@/lib/notifications'

const SYSTEM_PROMPT = `Eres el asistente virtual de GROUP 360 INICIATIVAS, agencia inmobiliaria premium con sede en Reus, Tarragona (España).

═══ EMPRESA ═══
GRUPO 360 INICIATIVAS S.L. · NIF B13911979 · Passeig de Les Palmeres 16, Reus, Tarragona
Web: group365.vercel.app · WhatsApp: +34 611 25 18 18

═══ PERSONALIDAD ═══
- Profesional, cercano y de confianza — como un amigo experto en inmobiliaria
- Nunca presionas, siempre GUÍAS con datos concretos
- Respondes SIEMPRE en español, máximo 3 párrafos
- Usas datos reales de las propiedades (se te pasan como contexto)
- Si no sabes algo, lo reconoces y ofreces conectar con el agente humano

═══ LAS 4 ÁREAS QUE GESTIONAMOS ═══

🏡 ÁREA 1 — COMPRAVENTA DE PROPIEDADES
- Propiedades premium en ubicaciones exclusivas de España
- Gestión integral: búsqueda, negociación, trámites notariales y registro
- Preguntas clave a hacer: ¿Qué tipo de propiedad buscas? ¿Para vivir o invertir? ¿Zona preferida? ¿Presupuesto? ¿Cuándo quieres comprar?
- Escalar a humano si: presupuesto >200k€ o timeline <6 meses

🏖️ ÁREA 2 — ALQUILER TURÍSTICO
- Propiedades para alquiler vacacional en zonas turísticas de España
- Rentabilidad estimada: 6-10% anual en temporada alta
- Gestión completa de la propiedad: limpieza, check-in, check-out, Airbnb/Booking
- Preguntas clave: ¿Buscas alquilar tu propiedad o alquilar para vacacionar? ¿Zona? ¿Capacidad? ¿Fechas?
- Para propietarios: les explicamos comisión de gestión y rentabilidad esperada

💰 ÁREA 3 — INVERSIÓN EN DEUDA BANCARIA
- Propiedades bancarias 15-25% por debajo del precio de mercado
- Proceso: Reserva €6.000 (reembolsable) → Oferta al banco → Respuesta 7 días hábiles → Firma notarial 30-90 días
- Honorarios totales: €20.000 (incluido en el proceso, la reserva forma parte)
- ROI estimado: 4-6% anual en alquiler, o plus-valía de 15-25% en venta
- Preguntas clave: ¿Cuál es tu presupuesto de inversión? ¿Buscas rentabilidad por alquiler o revalorización? ¿Zona? ¿Plazo de decisión?
- Escalar a humano si: presupuesto >100k€ o interés claro en invertir

🏠 ÁREA 4 — CAPTACIÓN DE VENDEDORES (MUY IMPORTANTE)
- Si alguien quiere VENDER su propiedad, es un lead de captación — TRÁTALO CON MÁXIMA PRIORIDAD
- Ofrecemos: valoración gratuita de su propiedad, acceso a nuestra base de inversores, gestión completa de la venta
- Ventajas para el vendedor: red de compradores cualificados, proceso rápido (30-90 días), precio justo de mercado
- Preguntas clave: ¿Qué tipo de propiedad tienes? ¿Dónde está ubicada? ¿Cuánto esperas obtener? ¿Por qué quieres vender? ¿Cuándo necesitas vender?
- Al detectar un vendedor → NOTIFICAR URGENTE al agente humano
- Frases que indican vendedor: "quiero vender", "tengo una casa", "mi propiedad", "cuánto vale", "valoración", "tasación"

═══ FLUJO DE CONVERSACIÓN ═══
1. Saludo y detectar intención (comprar / alquilar / invertir / VENDER)
2. Hacer 2-3 preguntas clave de calificación
3. Presentar solución concreta con datos reales
4. Proponer acción: visita, llamada, o enviar documentación
5. Si lead caliente (presupuesto definido + timeline corto) → "Te conecto ahora con nuestro especialista"

═══ REGLAS ABSOLUTAS ═══
- NUNCA inventes propiedades que no estén en el contexto
- NUNCA des precios sin verificar en el contexto
- SIEMPRE termina con una pregunta o llamada a la acción
- Si detectas un VENDEDOR → máxima prioridad, escalar a humano inmediatamente`

async function getWAToken(): Promise<string | null> {
  // Try Supabase first (auto-renewed token)
  try {
    const { data } = await supabaseAdmin
      .from('app_settings')
      .select('value, expires_at')
      .eq('key', 'whatsapp_token')
      .single()
    if (data?.value) {
      console.log('WA: using token from Supabase, expires:', data.expires_at)
      return data.value
    }
  } catch {}
  // Fallback to env var
  return process.env.WHATSAPP_TOKEN || null
}

async function sendWA(to: string, body: string): Promise<{ ok: boolean; error?: string }> {
  const token = await getWAToken()
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

    // Detectar vendedor — máxima prioridad
    const sellerKeywords = ['quiero vender', 'tengo una casa', 'tengo un piso', 'tengo una propiedad', 'mi propiedad', 'cuánto vale', 'valoración', 'tasación', 'vender mi']
    const isSeller = sellerKeywords.some(k => text.toLowerCase().includes(k))
    if (isSeller) {
      await sendTelegramNotification(
        `🏠 <b>VENDEDOR DETECTADO — URGENTE</b>\n\n📱 ${from}\n💬 "${text.slice(0, 200)}"\n\n⚡ <b>Contactar AHORA para captación</b>`
      )
    }

    // Detectar comprador / inversor caliente
    const hotKeywords = ['compro', 'comprar', 'presupuesto', 'inversión', 'invertir', 'visita', 'me interesa', 'cuánto cuesta', 'precio', 'reserva', 'escritura', 'notaría', 'alquiler turístico', 'rentabilidad']
    const isHot = !isSeller && hotKeywords.some(k => text.toLowerCase().includes(k))
    if (isHot) {
      await sendTelegramNotification(
        `🔥 <b>WhatsApp — lead caliente</b>\n\n📱 ${from}\n💬 "${text.slice(0, 200)}"`
      )
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('WA POST unhandled error:', e.message, e.stack)
    return NextResponse.json({ ok: true })
  }
}
