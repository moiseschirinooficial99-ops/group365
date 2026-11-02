'use client'
// ═══════════════════════════════════════════════════════
// Origen de campaña (primer contacto)
// Guarda los parámetros UTM y si la visita viene de un clic en anuncio de
// Meta (fbclid) o Google (gclid). Cada formulario lo manda con el lead y el
// CRM sabe qué campaña lo trajo. Dura 30 días; solo se guarda en el navegador.
// ═══════════════════════════════════════════════════════
const KEY = 'g360_origen'
const TTL = 30 * 24 * 60 * 60 * 1000
const UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const

type Origen = Partial<Record<(typeof UTM)[number], string>> & {
  anuncio?: 'meta' | 'google'
  landing?: string
  ts: number
}

export function captureAttribution() {
  try {
    const sp = new URLSearchParams(window.location.search)
    const o: Origen = { ts: Date.now() }
    for (const k of UTM) {
      const v = sp.get(k)
      if (v) o[k] = v.slice(0, 80)
    }
    if (sp.get('fbclid')) o.anuncio = 'meta'
    else if (sp.get('gclid')) o.anuncio = 'google'
    const tieneOrigen = UTM.some(k => o[k]) || o.anuncio
    if (!tieneOrigen) return
    // Primer contacto: no se pisa un origen vigente con otro posterior
    const prev = read()
    if (prev) return
    o.landing = window.location.pathname.slice(0, 80)
    localStorage.setItem(KEY, JSON.stringify(o))
  } catch { /* modo privado o storage bloqueado */ }
}

function read(): Origen | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const o = JSON.parse(raw) as Origen
    if (!o?.ts || Date.now() - o.ts > TTL) { localStorage.removeItem(KEY); return null }
    return o
  } catch { return null }
}

// Texto corto para el CRM, p. ej. "facebook / cpc / captacion-salou · anuncio meta · landing /vender"
export function getAttributionText(): string | undefined {
  const o = read()
  if (!o) return undefined
  const utm = [o.utm_source, o.utm_medium, o.utm_campaign].filter(Boolean).join(' / ')
  return [utm, o.utm_content && `contenido ${o.utm_content}`, o.anuncio && `anuncio ${o.anuncio}`, o.landing && `landing ${o.landing}`]
    .filter(Boolean).join(' · ').slice(0, 200) || undefined
}
