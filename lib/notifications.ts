const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const CHAT_ID = process.env.TELEGRAM_CHAT_ID

export async function sendTelegramNotification(message: string): Promise<void> {
  if (!BOT_TOKEN || !CHAT_ID) return
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT_ID, text: message, parse_mode: 'HTML' }),
  }).catch(() => {})
}

export async function sendWhatsAppMessage(phone: string, message: string): Promise<void> {
  const token = process.env.WHATSAPP_TOKEN
  const phoneId = process.env.WHATSAPP_PHONE_ID
  if (!token || !phoneId) return
  await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to: phone, type: 'text', text: { body: message } }),
  }).catch(() => {})
}

export async function notifyNewLead(lead: any): Promise<void> {
  await sendTelegramNotification(
    `🔔 <b>Nuevo lead</b>\n\n👤 ${lead.name || 'Sin nombre'}\n📧 ${lead.email || '-'}\n📱 ${lead.phone || '-'}\n💰 €${lead.budget_max || '-'}\n📍 ${lead.preferred_zone || '-'}\n📌 ${lead.source}`
  )
}

export async function notifyHotLead(lead: any): Promise<void> {
  await sendTelegramNotification(
    `🔥 <b>LEAD CALIENTE</b>\n\n👤 ${lead.name || 'Sin nombre'}\n📧 ${lead.email || '-'}\n📱 ${lead.phone || '-'}\n💰 €${lead.budget_max || '-'}\n📊 Score: ${lead.scoring_result || 0}%\n📌 ${lead.source}`
  )
}

export async function notifyVisitBooked(leadName: string, propertyTitle: string, date: string): Promise<void> {
  await sendTelegramNotification(
    `📅 <b>Visita agendada</b>\n\n👤 ${leadName}\n🏠 ${propertyTitle}\n📅 ${date}`
  )
}

export async function notifyPropertyPublished(property: any): Promise<void> {
  await sendTelegramNotification(
    `✅ <b>Propiedad publicada</b>\n\n🏠 ${property.title}\n💰 €${Number(property.price || 0).toLocaleString('es-ES')}\n📍 ${property.location || '-'}`
  )
}

export async function notifyDailySummary(stats: { leads: number; hot: number; properties: number; visits: number }): Promise<void> {
  await sendTelegramNotification(
    `📊 <b>Resumen diario — GROUP 360</b>\n\n👥 Leads hoy: ${stats.leads}\n🔥 Leads calientes: ${stats.hot}\n🏠 Propiedades activas: ${stats.properties}\n📅 Visitas agendadas: ${stats.visits}`
  )
}

export async function notifyPropertySold(property: any): Promise<void> {
  await sendTelegramNotification(
    `🏆 <b>PROPIEDAD VENDIDA</b>\n\n🏠 ${property.title}\n📍 ${property.location}\n💰 Precio venta: ${Number(property.sold_price || 0).toLocaleString('es-ES')}€\n📅 Fecha: ${property.sold_date}\n\n¡Felicidades! 🎉`
  )
}

export async function notifyNewRentalBooking(booking: any): Promise<void> {
  await sendTelegramNotification(
    `🏖️ <b>NUEVA RESERVA ALQUILER</b>\n\n🏠 ${booking.property_name}\n👤 ${booking.guest_name || '-'}\n📱 ${booking.guest_phone || '-'}\n📅 ${booking.date_start} → ${booking.date_end}\n💰 Total: ${booking.total_price ? booking.total_price + '€' : '-'}\n📲 Plataforma: ${booking.platform || 'directo'}`
  )
}

export async function notifyRentalBlocked(data: any): Promise<void> {
  await sendTelegramNotification(
    `🚫 <b>FECHAS BLOQUEADAS</b>\n\n🏠 ${data.property_name}\n📅 ${data.date_start} → ${data.date_end}\n📝 Motivo: ${data.notes || 'Sin especificar'}`
  )
}
