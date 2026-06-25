import { supabaseAdmin } from '@/lib/supabase'
import { sendWhatsAppMessage, sendTelegramNotification } from '@/lib/notifications'

const CATEGORY_NAMES: Record<string, string> = {
  npl: 'NPL — Hipoteca Impagada',
  reo: 'REO — Activo Adjudicado',
  cesion_remate: 'Cesión de Remate',
  producto_ocupado: 'Producto Ocupado',
  fondo: 'Fondo GROUP 360',
}

export async function notifyNewOpportunity(opportunity: any): Promise<void> {
  const { data: investors } = await supabaseAdmin
    .from('investors_private')
    .select('id, profile_id, profiles(phone, name)')
    .eq('is_verified', true)

  const list = investors || []
  let sent = 0

  for (const investor of list) {
    const profile = Array.isArray(investor.profiles) ? investor.profiles[0] : investor.profiles
    const phone = profile?.phone
    if (!phone) continue

    const catName = CATEGORY_NAMES[opportunity.category] || opportunity.category
    const roi = opportunity.roi_estimated || opportunity.annual_return_pct
    const mensaje =
      `🔔 Nueva oportunidad disponible\n\n` +
      `📂 ${catName}\n` +
      `🏠 ${opportunity.title}\n` +
      `📍 ${opportunity.location || ''}\n` +
      (roi ? `📊 ROI estimado: ${roi}%\n` : '') +
      `\nRevisa los detalles en tu panel privado o responde a este mensaje para más información.`

    await sendWhatsAppMessage(phone, mensaje)

    await supabaseAdmin.from('investor_notifications').insert({
      opportunity_id: opportunity.id,
      investor_id: investor.id,
      channel: 'whatsapp',
    }).catch(() => {})

    sent++
  }

  await sendTelegramNotification(
    `📢 <b>Notificación enviada a ${sent} inversores</b>\n\n🏠 ${opportunity.title}\n📂 ${CATEGORY_NAMES[opportunity.category] || opportunity.category}`
  )
}
