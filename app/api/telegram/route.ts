import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

async function sendTelegram(chatId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })
}

function parseProperty(text: string) {
  const lines = text.split('\n').map(l => l.trim())
  const prop: any = { is_active: true, is_featured: false }

  for (const line of lines) {
    const l = line.toLowerCase()
    if (l.includes('título:') || l.includes('titulo:')) prop.title = line.split(':')[1]?.trim()
    if (l.includes('precio:') || l.includes('€')) {
      const match = line.match(/[\d.,]+/)
      if (match) prop.price = parseFloat(match[0].replace(/[.,]/g, ''))
    }
    if (l.includes('zona:') || l.includes('ubicación:') || l.includes('ubicacion:')) prop.location = line.split(':')[1]?.trim()
    if (l.includes('hab:') || l.includes('habitaciones:') || l.includes('dormitorios:')) {
      const m = line.match(/\d+/)
      if (m) prop.bedrooms = parseInt(m[0])
    }
    if (l.includes('baños:') || l.includes('banos:')) {
      const m = line.match(/\d+/)
      if (m) prop.bathrooms = parseInt(m[0])
    }
    if (l.includes('m2:') || l.includes('metros:') || l.includes('área:')) {
      const m = line.match(/\d+/)
      if (m) prop.area_sqm = parseInt(m[0])
    }
    if (l.includes('roi:') || l.includes('rentabilidad:')) {
      const m = line.match(/[\d.]+/)
      if (m) prop.estimated_roi = parseFloat(m[0])
    }
    if (l.includes('tipo:')) prop.property_type = line.split(':')[1]?.trim().toLowerCase()
    if (l.includes('canal:') || l.includes('fuente:')) prop.channel = line.split(':')[1]?.trim().toLowerCase()
    if (l.includes('destacada:') || l.includes('featured:')) prop.is_featured = l.includes('sí') || l.includes('si') || l.includes('yes')
  }

  if (!prop.title) prop.title = lines[0] || 'Nueva propiedad'
  if (!prop.channel) prop.channel = 'personal'
  if (!prop.property_type) prop.property_type = 'apartment'

  return prop
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const message = body.message
    if (!message) return NextResponse.json({ ok: true })

    const chatId = String(message.chat.id)
    const text = message.text || ''
    const photo = message.photo

    if (text === '/start') {
      await sendTelegram(chatId, `🏠 <b>Bot GROUP 360 INICIATIVAS</b>\n\nComandos disponibles:\n\n📸 /addprop - Añadir propiedad (envía foto + descripción)\n📋 /listprops - Ver propiedades activas\n📊 /stats - Ver estadísticas\n⏰ /disponible - Marcar disponibilidad\n\n<i>Para añadir propiedad: envía una foto con el texto en la descripción</i>`)
      return NextResponse.json({ ok: true })
    }

    if (text === '/stats') {
      const [leads, props] = await Promise.all([
        supabaseAdmin.from('leads').select('status'),
        supabaseAdmin.from('properties').select('channel').eq('is_active', true),
      ])
      const total = leads.data?.length || 0
      const converted = leads.data?.filter((l: any) => l.status === 'converted').length || 0
      const totalProps = props.data?.length || 0
      await sendTelegram(chatId, `📊 <b>Estadísticas 360GROUP</b>\n\n👥 Leads totales: ${total}\n✅ Convertidos: ${converted}\n🏠 Propiedades activas: ${totalProps}\n📈 Tasa conversión: ${total > 0 ? Math.round((converted / total) * 100) : 0}%`)
      return NextResponse.json({ ok: true })
    }

    if (text === '/listprops') {
      const { data } = await supabaseAdmin.from('properties').select('title,price,location,channel').eq('is_active', true).order('created_at', { ascending: false }).limit(10)
      if (!data || data.length === 0) {
        await sendTelegram(chatId, '📋 No hay propiedades activas.')
        return NextResponse.json({ ok: true })
      }
      const list = data.map((p: any) => `• ${p.title} — €${Number(p.price).toLocaleString('es-ES')} (${p.location})`).join('\n')
      await sendTelegram(chatId, `📋 <b>Propiedades activas:</b>\n\n${list}`)
      return NextResponse.json({ ok: true })
    }

    if (text.startsWith('/disponible')) {
      const parts = text.split(' ')
      const note = parts.slice(1).join(' ') || 'Disponible'
      const now = new Date()
      const dateFrom = new Date(now)
      const dateTo = new Date(now)
      dateTo.setHours(dateTo.getHours() + 2)

      await supabaseAdmin.from('agent_availability').insert({
        date_from: dateFrom.toISOString(),
        date_to: dateTo.toISOString(),
        notes: note,
        source: 'telegram',
      })
      await sendTelegram(chatId, `✅ Disponibilidad registrada: ${note}`)
      return NextResponse.json({ ok: true })
    }

    if (photo && photo.length > 0) {
      const caption = message.caption || ''
      const propData = parseProperty(caption)

      const fileId = photo[photo.length - 1].file_id
      const fileRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`)
      const fileJson = await fileRes.json()
      const filePath = fileJson.result?.file_path
      const imageUrl = filePath ? `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}` : null

      if (imageUrl) propData.main_image = imageUrl

      const { data: saved, error } = await supabaseAdmin
        .from('properties')
        .insert(propData)
        .select().single()

      if (error) {
        await sendTelegram(chatId, `❌ Error al guardar: ${error.message}`)
      } else {
        await sendTelegram(chatId, `✅ <b>Propiedad publicada en la web</b>\n\n🏠 ${saved.title}\n💰 €${Number(saved.price || 0).toLocaleString('es-ES')}\n📍 ${saved.location || 'Sin ubicación'}\n🏷️ Canal: ${saved.channel}\n\n<i>Ya aparece en el dashboard de inversores.</i>`)
      }
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ ok: true })
  }
}
