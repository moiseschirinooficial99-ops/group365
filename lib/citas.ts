import { supabaseAdmin } from '@/lib/supabase'
import { sendTelegramNotification } from '@/lib/notifications'

export const CITA_KINDS = ['llamada', 'visita', 'videollamada', 'reunion'] as const
export const CITA_STATUSES = ['pendiente', 'confirmada', 'realizada', 'cancelada', 'no_show'] as const

export const KIND_LABEL: Record<string, string> = {
  llamada: '📞 Llamada',
  visita: '🏠 Visita',
  videollamada: '🎥 Videollamada',
  reunion: '🤝 Reunión',
}

export type NewCita = {
  name: string
  starts_at: string
  kind?: string
  duration_min?: number
  phone?: string | null
  email?: string | null
  notes?: string | null
  lead_id?: string | null
  property_id?: string | null
  source?: string
}

const TZ = 'Europe/Madrid'

export function fmtFecha(iso: string) {
  return new Date(iso).toLocaleString('es-ES', {
    timeZone: TZ, weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

// "dd/mm[/aaaa]" + "hh:mm" en hora de Madrid → ISO. Devuelve null si no es válida.
export function parseFechaMadrid(fecha: string, hora: string): string | null {
  const m = fecha.match(/^(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?$/)
  const h = hora.match(/^(\d{1,2})[:.h]?(\d{2})?$/)
  if (!m || !h) return null
  const year = m[3] ? (m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3])) : new Date().getFullYear()
  const local = `${year}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}T${h[1].padStart(2, '0')}:${h[2] || '00'}:00`
  // Desfase real de Madrid ese día (CET +01 / CEST +02).
  const probe = new Date(`${local}Z`)
  if (isNaN(probe.getTime())) return null
  // Rechaza fechas imposibles (31/02 → no se convierte en 3 de marzo).
  if (probe.getUTCDate() !== Number(m[1]) || probe.getUTCMonth() + 1 !== Number(m[2]) || Number(h[1]) > 23) return null
  const asMadrid = new Date(probe.toLocaleString('en-US', { timeZone: TZ }))
  const asUtc = new Date(probe.toLocaleString('en-US', { timeZone: 'UTC' }))
  return new Date(probe.getTime() - (asMadrid.getTime() - asUtc.getTime())).toISOString()
}

// Crea la cita, la vincula al lead (por id o por teléfono), mueve el lead a
// "qualified" y avisa por Telegram + n8n. Lo usan el panel y el bot de Telegram
// (y lo usará el bot de WhatsApp).
export async function crearCita(input: NewCita) {
  const kind = CITA_KINDS.includes(input.kind as any) ? input.kind! : 'llamada'
  let leadId = input.lead_id || null

  if (!leadId && input.phone) {
    const digits = input.phone.replace(/\D/g, '').slice(-9)
    if (digits.length === 9) {
      const { data } = await supabaseAdmin.from('leads').select('id')
        .ilike('phone', `%${digits}%`).order('created_at', { ascending: false }).limit(1)
      leadId = data?.[0]?.id ?? null
    }
  }

  const { data: cita, error } = await supabaseAdmin.from('appointments').insert({
    name: input.name,
    starts_at: input.starts_at,
    kind,
    duration_min: input.duration_min || (kind === 'visita' ? 60 : 30),
    phone: input.phone || null,
    email: input.email || null,
    notes: input.notes || null,
    lead_id: leadId ? String(leadId) : null,
    property_id: input.property_id || null,
    source: input.source || 'panel',
  }).select().single()
  if (error) throw error

  if (leadId) {
    await supabaseAdmin.from('leads')
      .update({ status: 'qualified', last_contact_at: new Date().toISOString() })
      .eq('id', leadId)
  }

  await sendTelegramNotification(
    `📅 <b>Nueva cita</b> — ${KIND_LABEL[kind]}\n\n👤 ${cita.name}${cita.phone ? `\n📱 ${cita.phone}` : ''}\n🕐 ${fmtFecha(cita.starts_at)}${cita.notes ? `\n📝 ${cita.notes}` : ''}\n\n🔗 https://www.group360iniciativas.com/admin/agenda`
  ).catch(() => {})

  const n8nUrl = process.env.N8N_WEBHOOK_URL
  if (n8nUrl) {
    fetch(`${n8nUrl}/cita-nueva`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cita }),
    }).catch(() => {})
  }

  return cita
}
