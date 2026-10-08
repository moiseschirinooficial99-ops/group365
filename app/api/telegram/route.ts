import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { notifyPropertyPublished } from '@/lib/notifications'
import { isAdminChat } from '@/lib/adminAuth'
import { crearCita, parseFechaMadrid, fmtFecha, KIND_LABEL } from '@/lib/citas'
import { guardarDocumento, esTipoSoportado, resumenFiscal, rangoTrimestre } from '@/lib/contabilidad'

export const maxDuration = 60 // lectura con IA de facturas

async function descargarArchivoTelegram(fileId: string): Promise<Buffer | null> {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`)
  const json = await res.json()
  const filePath = json.result?.file_path
  if (!filePath) return null
  const file = await fetch(`https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`)
  return file.ok ? Buffer.from(await file.arrayBuffer()) : null
}

const eur = (v: any) => v === null || v === undefined
  ? '—'
  : `${Number(v).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`

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

    // El bot da acceso a leads, estadísticas y altas de propiedades: solo
    // responde a los chats del equipo. El resto se ignora en silencio.
    if (!isAdminChat(chatId)) {
      console.warn('Telegram: chat no autorizado', chatId)
      return NextResponse.json({ ok: true })
    }

    // /start
    if (text === '/start') {
      await sendTelegram(chatId, `🏠 <b>Panel GROUP 360 INICIATIVAS</b>\n\n━━━━━━━━━━━━━━━━━\n📊 /leads — Últimos 10 leads\n🔥 /vendedores — Leads de captación\n📈 /stats — Estadísticas del negocio\n━━━━━━━━━━━━━━━━━\n📅 /disponible [nota] — Marcar disponible\n🔴 /ocupado [nota] — Marcar ocupado\n📌 /visita [dd/mm] [hh:mm] [nombre] — Agendar visita\n📞 /llamada [dd/mm] [hh:mm] [nombre] — Agendar llamada\n🗓️ /citas — Próximas citas\n━━━━━━━━━━━━━━━━━\n🧾 Contabilidad: envía la FOTO o el PDF de una factura o ticket (sin caption con |) y se guarda y lee sola\n💶 /gastos — Resumen del trimestre\n━━━━━━━━━━━━━━━━━\n✅ /sold [id] — Marcar propiedad vendida\n━━━━━━━━━━━━━━━━━\n📸 Añadir propiedad:\nEnvía una FOTO con caption:\n<code>Título | Precio | Zona | Hab | Baños | M2 | Tipo</code>\n\nEjemplo:\n<code>Villa Marbella | 650000 | Costa del Sol | 5 | 4 | 380 | venta</code>\n\nTipos: venta · alquiler · bancaria\n━━━━━━━━━━━━━━━━━\n🌐 Panel web: group360iniciativas.com/admin`)
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

    // /visita | /llamada [dd/mm] [hh:mm] [nombre] [— notas]
    if (text.startsWith('/visita') || text.startsWith('/llamada')) {
      const kind = text.startsWith('/visita') ? 'visita' : 'llamada'
      const parts = text.split(/\s+/).slice(1)
      const startsAt = parts[0] && parts[1] ? parseFechaMadrid(parts[0], parts[1]) : null
      if (!startsAt) {
        await sendTelegram(chatId, `❌ Uso: <code>/${kind} 15/10 17:30 Nombre del cliente</code>`)
        return NextResponse.json({ ok: true })
      }
      const [nombre, notas] = parts.slice(2).join(' ').split(/\s+[—-]\s+/)
      const cita = await crearCita({ name: nombre || 'Cliente', starts_at: startsAt, kind, notes: notas || null, source: 'telegram' })
      await sendTelegram(chatId, `✅ ${KIND_LABEL[kind]} agendada\n\n👤 ${cita.name}\n🕐 ${fmtFecha(cita.starts_at)}\n\nTe la recuerdo 45 min antes.`)
      return NextResponse.json({ ok: true })
    }

    // /citas
    if (text === '/citas') {
      const { data } = await supabaseAdmin.from('appointments').select('*')
        .in('status', ['pendiente', 'confirmada']).gte('starts_at', new Date().toISOString())
        .order('starts_at').limit(15)
      const list = (data || []).map((c: any) =>
        `• ${fmtFecha(c.starts_at)} — ${KIND_LABEL[c.kind] || c.kind} con <b>${c.name}</b>${c.phone ? ` (${c.phone})` : ''}`
      ).join('\n')
      await sendTelegram(chatId, list ? `🗓️ <b>Próximas citas</b>\n\n${list}` : '🗓️ No hay citas próximas.')
      return NextResponse.json({ ok: true })
    }

    // /gastos — resumen del trimestre en curso
    if (text === '/gastos') {
      const now = new Date()
      const q = Math.ceil((now.getMonth() + 1) / 3)
      const { from, to } = rangoTrimestre(now.getFullYear(), q)
      const { data } = await supabaseAdmin.from('accounting_documents').select('*')
        .gte('issue_date', from).lte('issue_date', to)
      const r = resumenFiscal(data || [])
      await sendTelegram(chatId, `💶 <b>Contabilidad ${q}T ${now.getFullYear()}</b>\n\n🧾 Documentos: ${(data || []).length} (por revisar: ${r.pendientes_revision})\n📈 Ingresos: ${eur(r.ingresos_total)}\n📉 Gastos: ${eur(r.gastos_total)}\n\nIVA repercutido: ${eur(r.iva_repercutido)}\nIVA soportado: ${eur(r.iva_soportado)}\n<b>Diferencia IVA (orientativa): ${eur(r.iva_resultado)}</b>\n\n🔗 https://www.group360iniciativas.com/admin/contabilidad`)
      return NextResponse.json({ ok: true })
    }

    // Foto o PDF sin el formato "Título | Precio | …" → documento contable.
    const caption = (message.caption || '').trim()
    const doc = message.document
    if ((photo?.length > 0 || doc) && !caption.includes('|')) {
      const fileId = doc ? doc.file_id : photo[photo.length - 1].file_id
      const mime = doc ? (doc.mime_type || '') : 'image/jpeg'
      const fileName = doc?.file_name || `telegram-${Date.now()}.jpg`
      if (!esTipoSoportado(mime)) {
        await sendTelegram(chatId, '❌ Formato no admitido. Envía una foto, JPG/PNG o PDF.')
        return NextResponse.json({ ok: true })
      }
      if (doc?.file_size && doc.file_size > 15 * 1024 * 1024) {
        await sendTelegram(chatId, '❌ El archivo supera 15 MB.')
        return NextResponse.json({ ok: true })
      }
      await sendTelegram(chatId, '🧾 Recibido, leyendo el documento…')
      const buffer = await descargarArchivoTelegram(fileId)
      if (!buffer) {
        await sendTelegram(chatId, '❌ No pude descargar el archivo de Telegram. Prueba otra vez.')
        return NextResponse.json({ ok: true })
      }
      try {
        const d = await guardarDocumento({ buffer, mime, fileName, source: 'telegram', notes: caption || null })
        const tipo = d.direction === 'ingreso' ? '📈 Ingreso' : d.direction === 'gasto' ? '📉 Gasto' : '📄 Documento'
        const aviso = d.ai_confidence === 'baja' ? '\n\n⚠️ Lectura dudosa: revísalo en el panel.' : ''
        await sendTelegram(chatId, `✅ <b>Guardado en contabilidad</b>\n\n${tipo} · ${d.doc_type}\n🏢 ${d.counterparty || '—'}${d.counterparty_nif ? ` (${d.counterparty_nif})` : ''}\n📅 ${d.issue_date || 'sin fecha'}\n💶 Base ${eur(d.base_amount)} · IVA ${eur(d.vat_amount)} · <b>Total ${eur(d.total_amount)}</b>\n🏷️ ${d.category || '—'}${d.ai_notes ? `\n📝 ${d.ai_notes}` : ''}${aviso}`)
      } catch (e: any) {
        console.error('Telegram contabilidad:', e?.message)
        await sendTelegram(chatId, '❌ No pude guardar el documento. Inténtalo de nuevo o súbelo desde el panel.')
      }
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
