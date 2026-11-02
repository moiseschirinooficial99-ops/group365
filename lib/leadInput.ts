import { z } from 'zod'

// ═══════════════════════════════════════════════════════
// Entrada pública de leads (POST /api/leads)
//
// Antes se hacía `insert({ ...body })`: cualquiera podía escribir en
// cualquier columna (status, scoring_result…) y un campo que no existe en
// la tabla hacía fallar el insert y el lead se perdía. Ahora solo pasan
// las columnas conocidas; lo demás que mande un formulario (fechas,
// nº de personas, asunto…) se añade al texto del mensaje.
// ═══════════════════════════════════════════════════════

const str = (max: number) => z.string().trim().max(max).optional().or(z.literal('').transform(() => undefined))
const num = z.coerce.number().finite().nonnegative().max(1e10).optional()

const LeadSchema = z.object({
  name: str(120),
  email: z.string().trim().toLowerCase().email().max(160).optional().or(z.literal('').transform(() => undefined)),
  phone: str(30),
  type: str(40),
  source: str(60),
  message: str(3000),
  notes: str(3000),
  preferred_zone: str(120),
  investment_timeline: str(60),
  budget_max: num,
  expected_roi: num,
})

export type LeadInput = z.infer<typeof LeadSchema>

// Campos de formulario que no son columnas: se guardan dentro de `message`.
const EXTRA_LABELS: Record<string, string> = {
  subject: 'Asunto',
  guests: 'Personas',
  dates: 'Fechas',
}

// Campo trampa: invisible para personas, los bots lo rellenan.
export const HONEYPOT_FIELD = 'website'

export function isHoneypotHit(body: Record<string, unknown>): boolean {
  const v = body?.[HONEYPOT_FIELD]
  return typeof v === 'string' && v.trim() !== ''
}

export function parseLead(body: Record<string, unknown>):
  { ok: true; lead: LeadInput } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Datos no válidos' }

  const known = Object.fromEntries(
    Object.entries(body).filter(([k]) => k in LeadSchema.shape),
  )
  const parsed = LeadSchema.safeParse(known)
  if (!parsed.success) return { ok: false, error: 'Revisa los datos del formulario' }

  const lead = parsed.data
  if (!lead.email && !lead.phone) return { ok: false, error: 'Indica un email o un teléfono' }

  const extras = Object.entries(EXTRA_LABELS)
    .map(([k, label]) => {
      const v = body[k]
      return typeof v === 'string' && v.trim() ? `${label}: ${v.trim().slice(0, 200)}` : null
    })
    .filter(Boolean)
  if (extras.length) {
    lead.message = [lead.message, ...extras].filter(Boolean).join('\n')
  }
  return { ok: true, lead }
}

// Fuentes del área privada de inversores que siempre son leads calientes
// (antes el navegador mandaba scoring_result: 90; ahora lo decide el servidor).
export function isPrivateInvestorSource(source?: string): boolean {
  return !!source && (source === 'npl_investor' || source.startsWith('inversor_privado_'))
}

// Límite simple por IP (en memoria de cada instancia). No es infalible,
// pero corta el spam a ráfagas contra el formulario.
const hits = new Map<string, number[]>()
export function rateLimited(key: string, max = 5, windowMs = 10 * 60 * 1000): boolean {
  const now = Date.now()
  const recent = (hits.get(key) || []).filter(t => now - t < windowMs)
  recent.push(now)
  hits.set(key, recent)
  if (hits.size > 5000) hits.clear()
  return recent.length > max
}

export function clientIp(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() || headers.get('x-real-ip') || 'unknown'
}
