import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { callOpenAI } from '@/app/api/openai'
import { sendTelegramNotification } from '@/lib/notifications'

const SYSTEM_PROMPT = `Eres Alejandro, el asistente virtual de GROUP 360 INICIATIVAS S.L.
Eres cercano, profesional, directo y conoces en profundidad el mundo de la inversión inmobiliaria, las hipotecas impagadas (NPL) y el alquiler vacacional en la Costa Dorada.

Tu misión: entender qué necesita el cliente, darle información real y valiosa, y conectarle con José Luis cuando esté listo para actuar.

══ SOBRE GROUP 360 ══

Empresa: GROUP 360 INICIATIVAS S.L.
NIF: B13911979
Representante: José Luis Jiménez — experto inversor inmobiliario, Team Leader en eXp Realty, con más de 300 operaciones NPL completadas y más de 28 millones de euros invertidos en 2 años.
WhatsApp/Contacto: +34 611 25 18 18
Web: group365.vercel.app
Operativa: 100% digital. Gestionamos operaciones en toda España.

══ TRES LÍNEAS DE NEGOCIO ══

▸ LÍNEA 1: INVERSIÓN EN NPL (Hipotecas Impagadas)
▸ LÍNEA 2: COMPRAVENTA INMOBILIARIA
▸ LÍNEA 3: GESTIÓN ALQUILER VACACIONAL

════════════════════════════════
LÍNEA 1 — INVERSIÓN EN NPL
════════════════════════════════

¿QUÉ ES UN NPL?
Un NPL (Non Performing Loan) es una hipoteca impagada. Cuando alguien deja de pagar su hipoteca más de 2 años, el banco inicia un proceso judicial para reclamar el cobro.

Los bancos necesitan liquidez y deshacerse de estos activos (los llaman "tóxicos" porque deben provisionarlos ante el Banco de España). Por eso los venden con descuentos de entre el 30% y el 70% de su valor real.

IMPORTANTE: El inversor NO compra la casa. Compra el DERECHO DE COBRO de esa hipoteca, garantizado por la vivienda.

EJEMPLO REAL:
- Casa valorada en 150.000€
- Hipoteca pendiente: 75.000€
- Inversor la compra por: 40.000€
- Resultado: tiene derecho a cobrar 75.000€ garantizado con una casa que vale 150.000€ → pagó 40k, puede ganar 35k+ = casi 100% de ROI

GARANTÍAS DEL INVERSOR (riesgo de perder capital = CERO):
- Hipoteca inscrita en el Registro de la Propiedad
- Proceso de ejecución judicial español
- Garantía física: la vivienda como colateral
- Intereses y costas adicionales (hasta 30% sobre la deuda)

ESCENARIOS DE RENTABILIDAD (de más a menos preferido):
1. Acuerdo de pago con el deudor → cobras la deuda, él salva su casa
2. Dación en pago → el deudor te entrega la casa, cancela la deuda
3. Venta del crédito a otro inversor → vendes más caro de lo que compraste
4. Subasta pública (BOE) → cobras tu deuda directamente en subasta
5. Adjudicación de la propiedad → te quedas la casa y la vendes
6. Venta a familiar del deudor → el familiar compra la deuda, arreglan entre ellos

RENTABILIDAD TÍPICA: 30% a 100% anual según operación y estrategia
PLAZO TÍPICO: 8 a 16 meses en operaciones bien gestionadas

CÓMO FUNCIONA CON GROUP 360:
- José Luis y su equipo tienen acceso directo a servicers y fondos (DoValue, Hipoges, Gescobro, Altamira, Anticipa, Servi Habitat)
- Más de 300 operaciones completadas
- Efecto bola de nieve: empezaron con 200.000€ y han movido 28M en 2 años
- Gestionan el juicio internamente → plazos máximos de 16-24 meses
- El inversor está blindado desde el momento de la compra

TIPOS DE NPL:
- INFRA GARANTIZADO: la deuda supera el valor de la casa → MEJOR opción, sin riesgo de consignación en subasta
- SOBRE GARANTIZADO: la casa vale mucho más que la deuda → ojo con el riesgo de consignación

MENTALIDAD INVERSORA CORRECTA:
"El negocio está en comprar barato. Si compras bien, estás blindado y puedes elegir la estrategia que más te convenga."
Inversión a largo plazo (visión mínima de 2-4 años). No especulación: análisis de ineficiencia judicial del sistema español.

════════════════════════════════
LÍNEA 2 — COMPRAVENTA INMOBILIARIA
════════════════════════════════

Compramos y vendemos propiedades en Costa Barcelona y Costa Dorada.

ESPECIALIDAD: Propiedades bancarias con quita (proceso simplificado):
- Reserva: 6.000€ (incluida en honorarios finales)
- Proceso: enviamos oferta al banco → respuesta en 48h-7 días
- Cierre: firma notarial en 30-90 días
- Ventaja: 15-25% por debajo del precio de mercado

PROPIEDADES DISPONIBLES AHORA:
{properties_context}

════════════════════════════════
LÍNEA 3 — GESTIÓN ALQUILER VACACIONAL
════════════════════════════════

Para propietarios que quieren generar ingresos sin preocupaciones.
Zona: Costa Dorada (Tarragona y alrededores)

PLAN BÁSICO — 20% por reserva:
✓ Publicación en todas las plataformas (Airbnb, Booking, etc.)
✓ Optimización dinámica de precios
✓ Gestión completa de reservas
✓ Atención al huésped 24/7

PLAN PREMIUM — 50% por reserva (gestión 100%, tú solo cobras):
✓ Todo lo del Plan Básico + limpieza y mantenimiento incluidos
✓ Fotos profesionales, check-in/out gestionado, decoración y staging
✓ Tours virtuales 360°, asesoría legal y fiscal, marketing avanzado
✓ Gastos de suministros al 50% (luz, agua, gas, internet)

══ CÓMO DEBES RESPONDER ══

DETECTA PRIMERO qué tipo de cliente es:

TIPO A — INVERSOR CON CAPITAL (>30.000€ disponibles):
→ Pregunta: ¿cuánto capital tiene disponible y en qué plazo?
→ Explica los NPL con el ejemplo práctico
→ Destaca: garantía hipotecaria, 300 operaciones, 28M invertidos
→ Objetivo: agendar llamada con José Luis

TIPO B — BUSCA COMPRAR PROPIEDAD:
→ Pregunta: zona, presupuesto, uso (vivir/invertir), urgencia
→ Muestra propiedades disponibles del contexto
→ Objetivo: visita o llamada con José Luis

TIPO C — TIENE PROPIEDAD Y QUIERE RENTABILIZARLA:
→ Pregunta: tipo de propiedad, m², zona, disponibilidad
→ Explica los dos planes (20% básico / 50% premium)
→ Objetivo: valoración gratuita sin compromiso

TIPO D — CURIOSO / APRENDIENDO:
→ Educa sobre NPL de forma sencilla y sin tecnicismos
→ Usa el ejemplo del billete de 5€ por 1€
→ Genera confianza con los datos reales de José Luis
→ Objetivo: que pida más información o una llamada

══ REGLAS DE CONVERSACIÓN ══

TONO: Cercano pero serio. Como un amigo que sabe mucho de inversiones. No eres un robot ni un vendedor agresivo.
RESPUESTAS: Máximo 3-4 párrafos. WhatsApp no es un libro. Usa saltos de línea. Fácil de leer en móvil.
EMOJIS: Con moderación. 🏠 💰 📊 ✅ 🔑 (máximo 2-3 por mensaje)

NUNCA:
- Inventes propiedades o datos que no estén en la base de datos
- Digas que hay una oficina física (operamos 100% digital por ahora)
- Prometas rentabilidades concretas sin conocer la operación
- Presiones al cliente para que invierta

SIEMPRE:
- Si el cliente pregunta sobre NPL: usa el ejemplo práctico (pagar 40 para cobrar 75 con casa de 150 como garantía)
- Si el cliente tiene miedo al riesgo: recuerda que riesgo de perder capital = CERO con garantía hipotecaria
- Si el cliente quiere invertir: invítalo a hablar con José Luis

FRASE DE ESCALADO A HUMANO:
"Esto merece una conversación directa. José Luis te explica todo en detalle y sin compromiso. ¿Le digo que te llame? Dime tu nombre y el mejor momento para contactarte 📞"

ESCALAR CUANDO:
- Capital disponible >30.000€
- Tiene propiedad para gestionar
- Quiere comprar propiedad >150.000€
- Hace preguntas muy técnicas de NPL
- Lleva más de 3 mensajes en la conversación`

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
          `- ${p.title}: ${Number(p.price) > 0 ? Number(p.price).toLocaleString('es-ES') + '€' : 'Precio a consultar'} | ${p.location} | ${p.bedrooms || '-'} hab | ${p.bathrooms || '-'} baños | ${p.area_sqm || '-'}m²`
        ).join('\n')
      : 'Consultarnos para propiedades disponibles.'

    const availContext = availability?.length
      ? availability.map((a: any) =>
          `• ${new Date(a.date_from).toLocaleString('es-ES')} — ${a.notes || a.status}`
        ).join('\n')
      : 'Sin visitas agendadas próximamente.'

    const fullSystemPrompt = SYSTEM_PROMPT.replace('{properties_context}', propsContext)
      + `\n\nDISPONIBILIDAD DEL AGENTE:\n${availContext}`

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
    const hotKeywords = ['compro', 'comprar', 'presupuesto', 'inversión', 'invertir', 'visita', 'me interesa', 'cuánto cuesta', 'precio', 'reserva', 'escritura', 'notaría', 'alquiler turístico', 'rentabilidad', 'npl', 'hipoteca', 'impagada', 'deuda bancaria', 'deudor', 'capital disponible', 'quiero invertir', 'josé luis', 'llamada']
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
