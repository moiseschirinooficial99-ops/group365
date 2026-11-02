// Envío de leads desde los formularios públicos.
// Antes los formularios marcaban "enviado" aunque el servidor fallara y el
// contacto se perdía sin que nadie se enterase. Ahora:
//  - si hay un fallo de red, reintenta una vez;
//  - si el servidor responde con error, lanza un Error con un texto que
//    se puede enseñar al usuario.

import { trackLead } from '@/lib/consent'
import { getAttributionText } from '@/lib/attribution'

const HONEYPOT_FIELD = 'website'

export async function sendLead(
  payload: Record<string, unknown>,
  form?: HTMLFormElement | null,
): Promise<void> {
  const trap = form?.elements.namedItem(HONEYPOT_FIELD) as HTMLInputElement | null
  const campaign = getAttributionText()
  const body = JSON.stringify({
    ...payload,
    ...(campaign ? { campaign } : {}),
    ...(trap?.value ? { [HONEYPOT_FIELD]: trap.value } : {}),
  })

  let res: Response | null = null
  for (let attempt = 0; attempt < 2 && !res; attempt++) {
    try {
      res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      })
    } catch {
      if (attempt === 1) throw new Error('No hay conexión. Revisa tu internet e inténtalo de nuevo.')
      await new Promise(r => setTimeout(r, 800))
    }
  }

  if (!res!.ok) {
    const data = await res!.json().catch(() => ({}))
    throw new Error(data?.error && res!.status < 500
      ? data.error
      : 'No hemos podido enviar tu mensaje. Escríbenos por WhatsApp o inténtalo de nuevo.')
  }
  trackLead(typeof payload.source === 'string' ? payload.source : undefined)
}
