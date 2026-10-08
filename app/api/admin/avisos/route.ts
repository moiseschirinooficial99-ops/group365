import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAdmin, unauthorized } from '@/lib/adminAuth'
import { sendTelegramNotification } from '@/lib/notifications'
import { fmtFecha, KIND_LABEL } from '@/lib/citas'

// Lo dispara pg_cron de Supabase cada 10 min (db/sql_avisos_pg_cron.sql) con
// `Authorization: Bearer <token>`; el token lo genera la propia base de datos y
// vive en app_settings.avisos_token, así nadie tiene que copiarlo a mano.
// También acepta la sesión de admin / Bearer ADMIN_SECRET. Envía a Telegram:
//  - recordatorio de cada cita que empieza en los próximos 45 min (una vez)
//  - seguimientos de leads que han vencido (una vez por fecha de seguimiento)
//  - resumen diario: primera pasada desde las 8:00 de Madrid, una vez al día
//    (o forzado con ?resumen=1)
export async function GET(req: NextRequest) { return run(req) }
export async function POST(req: NextRequest) { return run(req) }

const RESUMEN_KEY = 'avisos_resumen_ultimo_dia'

async function tokenAvisosValido(req: NextRequest) {
  const auth = req.headers.get('authorization') || ''
  if (!auth.startsWith('Bearer ')) return false
  const { data } = await supabaseAdmin.from('app_settings').select('value').eq('key', 'avisos_token').maybeSingle()
  const token = data?.value || ''
  return token.length >= 32 && auth.slice(7) === token
}

async function run(req: NextRequest) {
  if (!isAdmin(req) && !(await tokenAvisosValido(req))) return unauthorized()
  const now = new Date()
  const out = { recordatorios: 0, seguimientos: 0, resumen: false }

  // ── Recordatorios de citas ──
  const soon = new Date(now.getTime() + 45 * 60 * 1000).toISOString()
  const { data: proximas } = await supabaseAdmin.from('appointments')
    .select('*, properties(title)')
    .in('status', ['pendiente', 'confirmada'])
    .is('reminder_sent_at', null)
    .gte('starts_at', now.toISOString()).lte('starts_at', soon)
  for (const c of proximas || []) {
    await sendTelegramNotification(
      `⏰ <b>Cita en menos de 45 min</b> — ${KIND_LABEL[c.kind] || c.kind}\n\n👤 ${c.name}${c.phone ? `\n📱 ${c.phone}  https://wa.me/${String(c.phone).replace(/\D/g, '')}` : ''}\n🕐 ${fmtFecha(c.starts_at)}${c.properties?.title ? `\n🏠 ${c.properties.title}` : ''}${c.notes ? `\n📝 ${c.notes}` : ''}`
    ).catch(() => {})
    await supabaseAdmin.from('appointments').update({ reminder_sent_at: now.toISOString() }).eq('id', c.id)
    out.recordatorios++
  }

  // ── Seguimientos vencidos ──
  const { data: vencidos } = await supabaseAdmin.from('leads')
    .select('id, name, phone, type, status, notes, next_follow_up_at, follow_up_notified_at')
    .lte('next_follow_up_at', now.toISOString())
    .not('status', 'in', '(converted,lost)')
    .order('next_follow_up_at').limit(30)
  const pendientes = (vencidos || []).filter((l: any) =>
    !l.follow_up_notified_at || new Date(l.follow_up_notified_at) < new Date(l.next_follow_up_at))
  if (pendientes.length) {
    const lista = pendientes.slice(0, 10).map((l: any) =>
      `• <b>${l.name || 'Sin nombre'}</b> ${l.phone ? `— https://wa.me/${String(l.phone).replace(/\D/g, '')}` : ''}${l.notes ? `\n  ${String(l.notes).slice(0, 80)}` : ''}`
    ).join('\n')
    await sendTelegramNotification(
      `🔔 <b>Seguimientos pendientes (${pendientes.length})</b>\n\n${lista}\n\n🔗 https://www.group360iniciativas.com/admin/crm`
    ).catch(() => {})
    await supabaseAdmin.from('leads').update({ follow_up_notified_at: now.toISOString() })
      .in('id', pendientes.map((l: any) => l.id))
    out.seguimientos = pendientes.length
  }

  // ── Resumen diario ──
  const hoyMadrid = now.toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' }) // AAAA-MM-DD
  const horaMadrid = Number(now.toLocaleString('en-GB', { timeZone: 'Europe/Madrid', hour: '2-digit', hourCycle: 'h23' }))
  const { data: ultimo } = await supabaseAdmin.from('app_settings').select('value').eq('key', RESUMEN_KEY).maybeSingle()
  const tocaResumen = !!req.nextUrl.searchParams.get('resumen') || (horaMadrid >= 8 && ultimo?.value !== hoyMadrid)
  if (tocaResumen) {
    await supabaseAdmin.from('app_settings')
      .upsert({ key: RESUMEN_KEY, value: hoyMadrid, updated_at: now.toISOString() })
    const fin = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
    const { data: hoy } = await supabaseAdmin.from('appointments')
      .select('*').in('status', ['pendiente', 'confirmada'])
      .gte('starts_at', now.toISOString()).lte('starts_at', fin).order('starts_at')
    const { count: atrasados } = await supabaseAdmin.from('leads')
      .select('id', { count: 'exact', head: true })
      .lte('next_follow_up_at', now.toISOString()).not('status', 'in', '(converted,lost)')
    const { count: nuevos } = await supabaseAdmin.from('leads')
      .select('id', { count: 'exact', head: true }).eq('status', 'new')
    const agenda = (hoy || []).length
      ? (hoy || []).map((c: any) => `• ${fmtFecha(c.starts_at)} — ${KIND_LABEL[c.kind] || c.kind} con <b>${c.name}</b>`).join('\n')
      : 'Sin citas en las próximas 24 h.'
    await sendTelegramNotification(
      `☀️ <b>Buenos días, José Luis</b>\n\n📅 <b>Agenda</b>\n${agenda}\n\n🆕 Leads sin contactar: ${nuevos || 0}\n🔔 Seguimientos vencidos: ${atrasados || 0}\n\n🔗 https://www.group360iniciativas.com/admin/crm`
    ).catch(() => {})
    out.resumen = true
  }

  return NextResponse.json({ ok: true, ...out })
}
