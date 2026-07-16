const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const CHAT_ID = process.env.TELEGRAM_CHAT_ID

// Número del CEO / encargado para avisos directos por WhatsApp.
// Configurable con la variable CEO_WHATSAPP; por defecto el número de dirección.
export const CEO_WHATSAPP = process.env.CEO_WHATSAPP || '34677780774'

// Normaliza un teléfono al formato que exige la API de WhatsApp: solo dígitos,
// con prefijo de país. Los números españoles de 9 cifras reciben el 34 delante.
export function normalizePhone(raw?: string | null): string | null {
  if (!raw) return null
  let p = String(raw).replace(/\D/g, '')
  if (!p) return null
  if (p.startsWith('00')) p = p.slice(2)
  if (p.length === 9) p = '34' + p
  return p
}

// Convierte el formato HTML de Telegram (<b>, <br>) al texto plano/negrita de WhatsApp.
export function htmlToWhatsApp(msg: string): string {
  return msg
    .replace(/<\/?b>/gi, '*')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
}

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
  const to = normalizePhone(phone)
  if (!to) return
  await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body: message } }),
  }).catch(() => {})
}

// Envío por PLANTILLA aprobada. A diferencia del texto libre, la plantilla se
// entrega aunque el destinatario lleve días sin escribir (fuera de la ventana
// de 24h de Meta). Devuelve true si Meta aceptó el envío.
export async function sendWhatsAppTemplate(
  phone: string,
  templateName: string,
  lang = 'es',
  bodyParams: string[] = []
): Promise<boolean> {
  const token = process.env.WHATSAPP_TOKEN
  const phoneId = process.env.WHATSAPP_PHONE_ID
  if (!token || !phoneId) return false
  const to = normalizePhone(phone)
  if (!to) return false
  const components = bodyParams.length
    ? [{ type: 'body', parameters: bodyParams.map(t => ({ type: 'text', text: t })) }]
    : []
  try {
    const res = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: { name: templateName, language: { code: lang }, components },
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

// Aviso directo al CEO/encargado por WhatsApp. Acepta mensaje en HTML (Telegram)
// y lo convierte al formato de WhatsApp automáticamente.
export async function notifyCeoWhatsApp(message: string): Promise<void> {
  await sendWhatsAppMessage(CEO_WHATSAPP, htmlToWhatsApp(message))
}

// Email al CEO vía Resend (opcional). Solo actúa si hay RESEND_API_KEY + CEO_EMAIL.
export async function sendCeoEmail(subject: string, text: string): Promise<void> {
  const key = process.env.RESEND_API_KEY
  const to = process.env.CEO_EMAIL
  if (!key || !to) return
  const from = process.env.EMAIL_FROM || 'GROUP 360 <onboarding@resend.dev>'
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject, text }),
  }).catch(() => {})
}

// Nombre de la plantilla aprobada para avisar al CEO de un prospecto.
const CEO_LEAD_TEMPLATE = process.env.WHATSAPP_TEMPLATE_LEAD || 'nuevo_prospecto'

// Aviso completo de un prospecto al CEO por los 3 canales: WhatsApp (plantilla,
// que llega sin ventana de 24h; si aún no está aprobada cae a texto libre),
// y Email (si está configurado). Telegram lo manda notifyNewLead aparte.
export async function notifyCeoLead(lead: any): Promise<void> {
  const name = lead.name || 'Sin nombre'
  const phone = lead.phone || '-'
  const source = lead.source || '-'
  const ok = await sendWhatsAppTemplate(CEO_WHATSAPP, CEO_LEAD_TEMPLATE, 'es', [name, phone, source])
  if (!ok) {
    await notifyCeoWhatsApp(`🔔 <b>Nuevo contacto</b>\n\n👤 ${name}\n📱 ${phone}\n📌 ${source}`)
  }
  await sendCeoEmail(
    'Nuevo contacto en GROUP 360',
    `Nombre: ${name}\nTeléfono: ${phone}\nEmail: ${lead.email || '-'}\nOrigen: ${source}\n\nEntra al panel: https://www.group360iniciativas.com/admin`
  )
}

// El CEO solo debe recibir avisos de PROSPECTOS reales: posibles compradores,
// vendedores, inversores o cualquiera que pida una llamada o reunión.
// Se excluye el ruido (altas de newsletter, acciones internas del bot, etc.).
const CEO_SKIP_SOURCES = new Set(['footer', 'telegram'])
export function isProspectLead(lead: any): boolean {
  const source = String(lead?.source || '').toLowerCase()
  const type = String(lead?.type || '').toLowerCase()
  if (type === 'newsletter') return false
  if (CEO_SKIP_SOURCES.has(source)) return false
  return true
}

export async function notifyNewLead(lead: any): Promise<void> {
  const msg = `🔔 <b>Nuevo contacto</b>\n\n👤 ${lead.name || 'Sin nombre'}\n📧 ${lead.email || '-'}\n📱 ${lead.phone || '-'}\n💰 €${lead.budget_max || '-'}\n📍 ${lead.preferred_zone || '-'}\n📌 ${lead.source}`
  await sendTelegramNotification(msg)
  // Solo al CEO si es un prospecto real (comprador/vendedor/inversor/quiere contacto).
  // WhatsApp por plantilla (llega sin ventana de 24h) + Email.
  if (isProspectLead(lead)) await notifyCeoLead(lead)
}

export async function notifyHotLead(lead: any): Promise<void> {
  // Un lead caliente es siempre prospecto; el CEO ya lo recibe vía notifyNewLead.
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
