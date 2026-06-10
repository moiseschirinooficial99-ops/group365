import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const MENU = `¡Hola! 👋 Soy el asistente de *GROUP 360 INICIATIVAS*.\n\n¿En qué puedo ayudarte?\n\n1️⃣ Alquilar una villa vacacional\n2️⃣ Comprar una propiedad\n3️⃣ Invertir en inmobiliario\n4️⃣ Ver propiedades bancarias\n5️⃣ Hablar con un agente\n\n_Escribe el número de tu opción_`

const RESPONSES: Record<string, string> = {
  '1': `🏖️ *Alquileres Vacacionales*\n\nTenemos villas exclusivas en Costa del Sol, Barcelona, Madrid y Valencia.\n\n¿Para cuántas personas y qué fechas buscas? 📅`,
  '2': `🏠 *Compra de Propiedades*\n\nDisponemos de:\n• Cartera eXp Realty\n• Propiedades bancarias (-20%)\n• Exclusivos off-market\n\n¿Cuál es tu presupuesto aproximado? 💰`,
  '3': `💰 *Inversión Inmobiliaria*\n\nAccede a oportunidades con ROI del *4-6% anual*.\n\n👉 Regístrate aquí:\n${process.env.NEXT_PUBLIC_BASE_URL}/inversores/register\n\nO dime tu presupuesto y te busco opciones ahora mismo.`,
  '4': `🏦 *Propiedades Bancarias*\n\nTenemos acceso a propiedades en procesos bancarios con descuentos del 15-25% sobre precio de mercado.\n\n¿En qué zona te interesa? 📍`,
  '5': `👨‍💼 *Conectando con agente...*\n\nEn menos de 2 horas te contactamos personalmente.\n\n¿Cuál es tu nombre y qué tipo de propiedad buscas?`,
}

async function sendWA(to: string, body: string) {
  const token = process.env.WHATSAPP_TOKEN
  const phoneId = process.env.WHATSAPP_PHONE_ID
  if (!token || !phoneId) return
  await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body } }),
  })
}

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams
  if (sp.get('hub.mode') === 'subscribe' && sp.get('hub.verify_token') === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(sp.get('hub.challenge'), { status: 200 })
  }
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const msg = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
    if (!msg) return NextResponse.json({ ok: true })

    const from = msg.from
    const text = (msg.text?.body || '').trim()
    const lower = text.toLowerCase()

    await supabaseAdmin.from('wa_conversations').insert({ phone: from, message: text, direction: 'inbound', wa_message_id: msg.id }).catch(() => {})

    let reply = ''
    if (['hola', 'buenas', 'info', 'buenos días', 'buenas tardes', 'hey'].some(w => lower.includes(w))) {
      reply = MENU
    } else if (RESPONSES[text]) {
      reply = RESPONSES[text]
    } else if (lower.includes('alquil')) {
      reply = RESPONSES['1']
    } else if (lower.includes('compr') || lower.includes('piso') || lower.includes('casa')) {
      reply = RESPONSES['2']
    } else if (lower.includes('invert') || lower.includes('roi') || lower.includes('rentab')) {
      reply = RESPONSES['3']
    } else if (lower.includes('banco') || lower.includes('bancari')) {
      reply = RESPONSES['4']
    } else if (lower.includes('agente') || lower.includes('hablar') || lower.includes('llamar')) {
      reply = RESPONSES['5']
    } else {
      reply = `Gracias por escribirnos. 🏠\n\nUn especialista de *GROUP 360* te contactará pronto.\n\nO escribe *MENU* para ver todas las opciones.`
    }

    await sendWA(from, reply)
    await supabaseAdmin.from('wa_conversations').insert({ phone: from, message: reply, direction: 'outbound' }).catch(() => {})

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ ok: true })
  }
}
