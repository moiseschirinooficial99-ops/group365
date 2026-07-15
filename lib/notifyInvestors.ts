import { supabaseAdmin } from '@/lib/supabase'
import { sendWhatsAppMessage, sendTelegramNotification } from '@/lib/notifications'

const CATEGORY_NAMES: Record<string, string> = {
  npl: 'NPL — Hipoteca Impagada',
  reo: 'REO — Activo Adjudicado',
  cesion_remate: 'Cesión de Remate',
  producto_ocupado: 'Producto Ocupado',
  fondo: 'Fondo GROUP 360',
}

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
  const sentPhones = new Set<string>()
  let sent = 0

  // 1) Inversores verificados registrados en la web
  const { data: investors } = await supabaseAdmin
    .from('investors_private')
    .select('id, profile_id, profiles(phone, name)')
    .eq('is_verified', true)

  for (const investor of investors || []) {
    const profile = Array.isArray(investor.profiles) ? investor.profiles[0] : investor.profiles
    const phone = profile?.phone
    if (!phone || sentPhones.has(phone)) continue
    sentPhones.add(phone)

    await sendWhatsAppMessage(phone, message)
    await supabaseAdmin.from('investor_notifications').insert({
      opportunity_id: opportunity.id,
      investor_id: investor.id,
      channel: 'whatsapp',
    }).catch(() => {})
    sent++
  }

  // 2) Suscriptores por WhatsApp (lista ligera, sin registro web)
  const { data: subscribers } = await supabaseAdmin
    .from('investor_subscribers')
    .select('id, phone')
    .eq('is_active', true)

  const now = new Date().toISOString()
  for (const sub of subscribers || []) {
    const phone = sub.phone
    if (!phone || sentPhones.has(phone)) continue
    sentPhones.add(phone)

    await sendWhatsAppMessage(phone, message)
    await supabaseAdmin.from('investor_subscribers')
      .update({ last_notified_at: now })
      .eq('id', sub.id)
      .catch(() => {})
    sent++
  }

  await sendTelegramNotification(
    `📢 <b>Notificación enviada a ${sent} inversores</b>\n\n🏠 ${opportunity.title}\n📂 ${CATEGORY_NAMES[opportunity.category] || opportunity.category}`
  )
}
