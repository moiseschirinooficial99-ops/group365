import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { notifyPropertyPublished } from '@/lib/notifications'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

async function sendTelegram(chatId: string, text: string) {
  if (!BOT_TOKEN) return
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  }).catch(() => {})
}

function parsePipeSeparated(caption: string): Record<string, any> | null {
  const parts = caption.split('|').map(s => s.trim())
  if (parts.length < 4) return null
  const [title, price, zona, hab, banos, m2, tipo] = parts
  return {
    title: title || 'Nueva propiedad',
    price: parseFloat(price?.replace(/[^\d.]/g, '') || '0') || null,
    location: zona || null,
    bedrooms: parseInt(hab || '0') || null,
    bathrooms: parseInt(banos || '0') || null,
    area_sqm: parseInt(m2 || '0') || null,
    property_type: 'apartment',
    channel: tipo?.toLowerCase().includes('alquiler') ? 'alquiler' : tipo?.toLowerCase().includes('bancaria') ? 'bancaria' : 'personal',
    is_active: true,
    is_featured: false,
    main_image: null as string | null,
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const message = body.message
    if (!message) return NextResponse.json({ ok: true })

    const chatId = String(message.chat.id)
    const text = (message.text || '').trim()
    const photo = message.photo

    // /start
    if (text === '/start') {
      await sendTelegram(chatId, `🏠 <b>Panel GROUP 360 INICIATIVAS</b>\n\n━━━━━━━━━━━━━━━━━\n📊 /leads — Últimos 10 leads\n🔥 /vendedores — Leads de captación\n📈 /stats — Estadísticas del negocio\n━━━━━━━━━━━━━━━━━\n📅 /disponible [nota] — Marcar disponible\n🔴 /ocupado [nota] — Marcar ocupado\n📌 /visita [dd/mm] [hh:mm] [nombre] — Agendar visita\n✅ /sold [id] — Marcar propiedad vendida\n━━━━━━━━━━━━━━━━━\n📸 Añadir propiedad:\nEnvía una FOTO con caption:\n<code>Título | Precio | Zona | Hab | Baños | M2 | Tipo</code>\n\nEjemplo:\n<code>Villa Marbella | 650000 | Costa del Sol | 5 | 4 | 380 | venta</code>\n\nTipos: venta · alquiler · bancaria\n━━━━━━━━━━━━━━━━━\n🌐 Panel web: group360iniciativas.com/admin`)
      return NextResponse.json({ ok: true })
    }

    // /leads
    if (text === '/leads') {
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const { data } = await supabaseAdmin
        .from('leads')
        .select('name, email, phone, scoring_result, source, created_at, status')
        .order('created_at', { ascending: false })
        .limit(10)

      if (!data?.length) {
        await sendTelegram(chatId, '📋 No hay leads todavía.')
        return NextResponse.json({ ok: true })
      }

      const list = data.map((l: any) =>
        `👤 <b>${l.name || 'Sin nombre'}</b>\n📧 ${l.email || '-'} | 📱 ${l.phone || '-'}\n📊 Score: ${l.scoring_result || 0}% | 📌 ${l.source}\n🕐 ${new Date(l.created_at).toLocaleDateString('es-ES')}`
      ).join('\n\n')

      await sendTelegram(chatId, `📋 <b>Últimos 10 leads</b>\n\n${list}`)
      return NextResponse.json({ ok: true })
    }

    // /vendedores
    if (text === '/vendedores') {
      const { data } = await supabaseAdmin
        .from('leads')
        .select('name, email, phone, scoring_result, source, created_at, notes')
        .ilike('source', '%vendedor%')
        .order('created_at', { ascending: false })
        .limit(10)

      if (!data?.length) {
        await sendTelegram(chatId, '🏠 No hay leads de captación (vendedores) todavía.\n\nEl bot de WhatsApp notificará automáticamente cuando detecte uno.')
        return NextResponse.json({ ok: true })
      }

      const list = data.map((l: any) =>
        `🏠 <b>${l.name || 'Sin nombre'}</b>\n📱 ${l.phone || '-'}\n💬 ${(l.notes || '-').slice(0, 80)}\n🕐 ${new Date(l.created_at).toLocaleDateString('es-ES')}`
      ).join('\n\n')

      await sendTelegram(chatId, `🏠 <b>Leads de Captación (Vendedores)</b>\n\n${list}`)
      return NextResponse.json({ ok: true })
    }

    // /stats
    if (text === '/stats') {
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      const [leadsAll, leadsMonth, hotLeads, props, visits] = await Promise.all([
        supabaseAdmin.from('leads').select('status'),
        supabaseAdmin.from('leads').select('id').gte('created_at', monthStart),
        supabaseAdmin.from('leads').select('id').gt('scoring_result', 70),
        supabaseAdmin.from('properties').select('id').eq('is_active', true),
        supabaseAdmin.from('agent_availability').select('id').gte('date_from', now.toISOString()),
      ])

      const total = leadsAll.data?.length || 0
      const converted = leadsAll.data?.filter((l: any) => l.status === 'converted').length || 0

      await sendTelegram(chatId, `📊 <b>Estadísticas GROUP 360</b>\n\n👥 Leads este mes: ${leadsMonth.data?.length || 0}\n🔥 Leads calientes (>70%): ${hotLeads.data?.length || 0}\n🏠 Propiedades activas: ${props.data?.length || 0}\n📅 Visitas pendientes: ${visits.data?.length || 0}\n✅ Convertidos total: ${converted}\n📈 Tasa conversión: ${total > 0 ? Math.round((converted / total) * 100) : 0}%`)
      return NextResponse.json({ ok: true })
    }

    // /disponible [nota]
    if (text.startsWith('/disponible')) {
      const note = text.slice('/disponible'.length).trim() || 'Disponible'
      const now = new Date()
      const dateTo = new Date(now.getTime() + 2 * 60 * 60 * 1000)
      await supabaseAdmin.from('agent_availability').insert({
        date_from: now.toISOString(), date_to: dateTo.toISOString(),
        notes: note, status: 'available', source: 'telegram',
      })
      await sendTelegram(chatId, `✅ Disponibilidad registrada: <b>${note}</b>`)
      return NextResponse.json({ ok: true })
    }

    // /ocupado [nota]
    if (text.startsWith('/ocupado')) {
      const note = text.slice('/ocupado'.length).trim() || 'Ocupado'
      const now = new Date()
      const dateTo = new Date(now.getTime() + 2 * 60 * 60 * 1000)
      await supabaseAdmin.from('agent_availability').insert({
        date_from: now.toISOString(), date_to: dateTo.toISOString(),
        notes: note, status: 'busy', source: 'telegram',
      })
      await sendTelegram(chatId, `🔴 Marcado como ocupado: <b>${note}</b>`)
      return NextResponse.json({ ok: true })
    }

    // /visita [fecha] [hora] [nombre]
    if (text.startsWith('/visita')) {
      const parts = text.slice('/visita'.length).trim().split(' ')
      const fechaStr = parts[0] || ''
      const hora = parts[1] || '10:00'
      const nombre = parts.slice(2).join(' ') || 'Lead'

      let dateFrom: Date
      try {
        const [day, month, year] = fechaStr.includes('/') ? fechaStr.split('/') : fechaStr.split('-')
        dateFrom = new Date(`${year || new Date().getFullYear()}-${month?.padStart(2,'0')}-${day?.padStart(2,'0')}T${hora}:00`)
        if (isNaN(dateFrom.getTime())) dateFrom = new Date()
      } catch { dateFrom = new Date() }

      const dateTo = new Date(dateFrom.getTime() + 60 * 60 * 1000)

      await supabaseAdmin.from('agent_availability').insert({
        date_from: dateFrom.toISOString(), date_to: dateTo.toISOString(),
        notes: `Visita con ${nombre}`, status: 'visit', source: 'telegram',
      })
      await sendTelegram(chatId, `📅 Visita agendada\n\n👤 ${nombre}\n🕐 ${dateFrom.toLocaleString('es-ES')}\n\nRegistrada en el sistema.`)
      return NextResponse.json({ ok: true })
    }

    // /sold [id]
    if (text.startsWith('/sold')) {
      const id = text.slice('/sold'.length).trim()
      if (!id) {
        await sendTelegram(chatId, '❌ Uso: /sold [id-propiedad]')
        return NextResponse.json({ ok: true })
      }
      const { error } = await supabaseAdmin
        .from('properties')
        .update({ is_active: false })
        .eq('id', id)
      if (error) {
        await sendTelegram(chatId, `❌ No encontré la propiedad con id: ${id}`)
      } else {
        await sendTelegram(chatId, `✅ Propiedad marcada como vendida/inactiva.`)
      }
      return NextResponse.json({ ok: true })
    }

    // /addprop
    if (text === '/addprop') {
      await sendTelegram(chatId, `📸 <b>Añadir propiedad</b>\n\nEnvía una foto con el caption en este formato:\n\n<code>Título | Precio | Zona | Hab | Baños | M2 | Tipo</code>\n\n<b>Ejemplo:</b>\n<code>Villa Marbella | 650000 | Costa del Sol | 5 | 4 | 380 | venta</code>\n\nTipos válidos: venta, alquiler, bancaria`)
      return NextResponse.json({ ok: true })
    }

    // Photo with caption → add property
    if (photo?.length > 0) {
      const caption = message.caption || ''
      const propData = parsePipeSeparated(caption)

      if (!propData) {
        await sendTelegram(chatId, `❌ Formato incorrecto. Usa:\n<code>Título | Precio | Zona | Hab | Baños | M2 | Tipo</code>`)
        return NextResponse.json({ ok: true })
      }

      // Download photo from Telegram
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
        await sendTelegram(chatId, `✅ <b>Propiedad publicada en la web</b>\n\n🏠 ${saved.title}\n💰 €${Number(saved.price || 0).toLocaleString('es-ES')}\n📍 ${saved.location || '-'}\n🏷️ ${saved.channel}\n\nID: <code>${saved.id}</code>`)
        await notifyPropertyPublished(saved)
      }
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ ok: true })
  }
}
