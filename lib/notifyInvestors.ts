import { supabaseAdmin } from '@/lib/supabase'
import { sendWhatsAppMessage, sendWhatsAppTemplate, sendTelegramNotification, normalizePhone } from '@/lib/notifications'

const CATEGORY_NAMES: Record<string, string> = {
  npl: 'NPL — Hipoteca Impagada',
  reo: 'REO — Activo Adjudicado',
  cesion_remate: 'Cesión de Remate',
  producto_ocupado: 'Producto Ocupado',
  propiedades_inversion: 'Propiedades de Inversión',
  fondo: 'Fondo GROUP 360',
}

// Nombre de la plantilla aprobada en Meta (crear con scripts/create-wa-template.mjs).
const OPP_TEMPLATE = process.env.WHATSAPP_TEMPLATE_OPPORTUNITY || 'nueva_oportunidad'

const PORTAL_URL = 'https://www.group360iniciativas.com/inversores'

function buildMessage(opportunity: any): string {
  const catName = CATEGORY_NAMES[opportunity.category] || opportunity.category
  const roi = opportunity.roi_estimated || opportunity.annual_return_pct
  const price = opportunity.offer_price || opportunity.minimum_investment
  return (
    `🔔 Nueva oportunidad disponible\n\n` +
    `📂 ${catName}\n` +
    `🏠 ${opportunity.title}\n` +
    (opportunity.location ? `📍 ${opportunity.location}\n` : '') +
    (price ? `💰 ${Number(price).toLocaleString('es-ES')} €\n` : '') +
    (roi ? `📊 ROI estimado: ${roi}%\n` : '') +
    `\nMírala en el portal 👉 ${PORTAL_URL}\n` +
    `O responde a este mensaje para más información.`
  )
}

export async function notifyNewOpportunity(opportunity: any): Promise<void> {
  const message = buildMessage(opportunity)
  const catName = CATEGORY_NAMES[opportunity.category] || opportunity.category
  const sentPhones = new Set<string>()
  let sent = 0

  const pushTo = async (rawPhone?: string | null) => {
    const phone = normalizePhone(rawPhone)
    if (!phone || sentPhones.has(phone)) return false
    sentPhones.add(phone)
    // Intenta plantilla (llega aunque lleve días sin escribir). Si no está
    // aprobada todavía, Meta rechaza y caemos al texto libre (solo dentro de 24h).
    const ok = await sendWhatsAppTemplate(phone, OPP_TEMPLATE, 'es', [opportunity.title, catName])
    if (!ok) await sendWhatsAppMessage(phone, message)
    sent++
    return true
  }

  // 1) Inversores registrados en la web (tabla profiles: nombre + teléfono).
  //    Aquí es donde el registro de /inversores/register guarda a la gente.
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id, phone')
    .not('phone', 'is', null)

  for (const p of profiles || []) {
    const ok = await pushTo(p.phone)
    if (ok) {
      await supabaseAdmin.from('investor_notifications').insert({
        opportunity_id: opportunity.id,
        investor_id: p.id,
        channel: 'whatsapp',
      }).catch(() => {})
    }
  }

  // 2) Inversores verificados (si existe la tabla investors_private). Degrada solo.
  const { data: investors } = await supabaseAdmin
    .from('investors_private')
    .select('id, profiles(phone)')
    .eq('is_verified', true)

  for (const investor of investors || []) {
    const profile = Array.isArray(investor.profiles) ? investor.profiles[0] : investor.profiles
    await pushTo(profile?.phone)
  }

  // 3) Suscriptores por WhatsApp (lista ligera, sin registro web)
  const { data: subscribers } = await supabaseAdmin
    .from('investor_subscribers')
    .select('id, phone')
    .eq('is_active', true)

  const now = new Date().toISOString()
  for (const sub of subscribers || []) {
    const ok = await pushTo(sub.phone)
    if (ok) {
      await supabaseAdmin.from('investor_subscribers')
        .update({ last_notified_at: now })
        .eq('id', sub.id)
        .catch(() => {})
    }
  }

  // El resumen de "oportunidad publicada" va al canal interno de Telegram,
  // NO al WhatsApp del CEO (ese solo recibe prospectos).
  await sendTelegramNotification(
    `📢 <b>Oportunidad publicada — avisados ${sent} inversores</b>\n\n🏠 ${opportunity.title}\n📂 ${catName}`
  )
}
