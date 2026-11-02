// Consentimiento de cookies (solo navegador).
// Los píxeles (Meta, TikTok, GA) solo se cargan con "granted".
export type Consent = 'granted' | 'denied' | null

const KEY = 'g360_cookie_consent'
const EVENT = 'g360-consent'

export function getConsent(): Consent {
  if (typeof window === 'undefined') return null
  const v = window.localStorage.getItem(KEY)
  return v === 'granted' || v === 'denied' ? v : null
}

export function setConsent(v: Consent) {
  if (v) window.localStorage.setItem(KEY, v)
  else window.localStorage.removeItem(KEY)
  window.dispatchEvent(new CustomEvent(EVENT, { detail: v }))
}

export function onConsentChange(cb: (v: Consent) => void): () => void {
  const h = (e: Event) => cb((e as CustomEvent).detail ?? null)
  window.addEventListener(EVENT, h)
  return () => window.removeEventListener(EVENT, h)
}

export const hasTrackingPixels = !!(
  process.env.NEXT_PUBLIC_META_PIXEL_ID ||
  process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID ||
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
)

// Conversión "Lead" en las plataformas de anuncios tras un envío correcto.
// Si el usuario no aceptó cookies, los píxeles no existen y no pasa nada.
export function trackLead(source?: string) {
  const w = window as any
  try { w.fbq?.('track', 'Lead', { content_category: source }) } catch {}
  try { w.ttq?.track?.('SubmitForm', { content_category: source }) } catch {}
  try { w.gtag?.('event', 'generate_lead', { lead_source: source }) } catch {}
}
