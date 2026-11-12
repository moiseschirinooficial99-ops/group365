import { createHmac } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { safeEqual } from '@/lib/adminAuth'
import { supabaseAdmin } from '@/lib/supabase'

// Agente de voz Alejandra (ElevenLabs Agents + número de Twilio). El bot de WhatsApp sigue siendo Alejandro.
// Variables de entorno (Vercel → 360group → Settings → Environment Variables):
//   ELEVENLABS_API_KEY         clave de la API de ElevenLabs
//   ELEVENLABS_AGENT_ID        id del agente (en ElevenLabs se llama "Alejandro voz")
//   ELEVENLABS_PHONE_ID        id del número importado en ElevenLabs (Phone Numbers)
//   VOZ_TOOLS_SECRET           clave larga inventada; ElevenLabs la manda en la cabecera X-Voz-Secret
//   ELEVENLABS_WEBHOOK_SECRET  secreto del webhook "post-call" que da ElevenLabs

const SITE = 'https://www.group360iniciativas.com'

// Las herramientas que el agente llama durante la conversación traen X-Voz-Secret.
export function vozAutorizada(req: NextRequest): boolean {
  const secret = process.env.VOZ_TOOLS_SECRET
  return !!secret && safeEqual(req.headers.get('x-voz-secret'), secret)
}

export function noAutorizado() {
  return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
}

// "612 34 56 78", "0034612…", "+34 612…" → "+34612345678". Solo móviles y fijos españoles.
export function telefonoE164(raw: string): string | null {
  let d = (raw || '').replace(/\D/g, '')
  if (d.startsWith('0034')) d = d.slice(4)
  else if (d.length === 11 && d.startsWith('34')) d = d.slice(2)
  return /^[6789]\d{8}$/.test(d) ? `+34${d}` : null
}

// Ficha corta de un piso para decirla en voz alta (sin enlaces ni listas largas).
export function fichaHablada(p: any): string {
  const alquiler = p.channel === 'alquiler' || p.channel === 'alquiler_turistico'
  const precio = alquiler
    ? (p.price_per_night ? `desde ${p.price_per_night} euros la noche` : 'precio a consultar')
    : (Number(p.price) > 0 ? `${Number(p.price).toLocaleString('es-ES')} euros` : 'precio a consultar')
  const partes = [
    p.title,
    p.location && `en ${p.location}`,
    p.bedrooms && `${p.bedrooms} dormitorios`,
    p.bathrooms && `${p.bathrooms} baños`,
    (p.area_sqm || p.area_m2) && `${p.area_sqm || p.area_m2} metros`,
    precio,
    p.external_ref && `referencia ${p.external_ref}`,
  ].filter(Boolean)
  return partes.join(', ')
}

// Búsqueda de pisos para la llamada: por referencia, por zona y por precio máximo.
export async function buscarPisos(f: { referencia?: string; zona?: string; operacion?: string; precio_max?: number }) {
  let q = supabaseAdmin.from('properties').select('*').eq('is_active', true)
  const limpio = (s: string) => s.replace(/[%_,()]/g, ' ').trim().slice(0, 60)
  if (f.referencia) q = q.ilike('external_ref', `%${limpio(f.referencia)}%`)
  if (f.zona) {
    const z = limpio(f.zona)
    q = q.or(`location.ilike.%${z}%,city.ilike.%${z}%,zone.ilike.%${z}%`)
  }
  if (f.operacion === 'alquiler') q = q.in('channel', ['alquiler', 'alquiler_turistico'])
  if (f.operacion === 'compra') q = q.not('channel', 'in', '(alquiler,alquiler_turistico)')
  if (f.precio_max && f.precio_max > 0) q = q.lte('price', f.precio_max)
  const { data, error } = await q.order('price', { ascending: true }).limit(3)
  if (error) throw error
  return data || []
}

export function enlaceFicha(id: string) {
  return `${SITE}/propiedades/${id}`
}

// Firma del webhook post-call: cabecera "ElevenLabs-Signature: t=<seg>,v0=<hmac sha256 de `${t}.${body}`>".
export function firmaWebhookValida(raw: string, header: string | null): boolean {
  const secret = process.env.ELEVENLABS_WEBHOOK_SECRET
  if (!secret || !header) return false
  const partes = Object.fromEntries(header.split(',').map(s => s.trim().split('=') as [string, string]))
  const t = Number(partes.t)
  if (!t || Math.abs(Date.now() / 1000 - t) > 30 * 60) return false
  const esperado = createHmac('sha256', secret).update(`${partes.t}.${raw}`).digest('hex')
  return safeEqual(partes.v0, esperado)
}

// Pide a ElevenLabs que Alejandra llame ya a este número.
export async function lanzarLlamada(to: string, variables: Record<string, string>) {
  const key = process.env.ELEVENLABS_API_KEY
  const agent = process.env.ELEVENLABS_AGENT_ID
  const phone = process.env.ELEVENLABS_PHONE_ID
  if (!key || !agent || !phone) throw new Error('Faltan ELEVENLABS_API_KEY, ELEVENLABS_AGENT_ID o ELEVENLABS_PHONE_ID')
  const res = await fetch('https://api.elevenlabs.io/v1/convai/twilio/outbound-call', {
    method: 'POST',
    headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agent_id: agent,
      agent_phone_number_id: phone,
      to_number: to,
      conversation_initiation_client_data: { dynamic_variables: variables },
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data?.success === false) throw new Error(`ElevenLabs ${res.status}: ${data?.message || data?.detail?.message || 'sin detalle'}`)
  return data as { conversation_id?: string; callSid?: string }
}

// ¿El mensaje de WhatsApp pide una llamada? ("llámame", "quiero que me llames", "puedes llamarme",
// "me puede llamar José Luis", "prefiero hablar por teléfono"…). "No me llames" no cuenta.
export function pideLlamada(texto: string): boolean {
  const t = texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  if (/\bno (me )?(llames|llameis|llamen|llame|llamar|llameme)\b/.test(t)) return false
  return /\b(llamame|llamadme|llameme|llamenme|llamarme|me (llamas|llames|llamais|llameis|llame|llamen)|me (puedes|podeis|podrias|pueden|puede|podria|podrian) (llamar|telefonear)|(quiero|prefiero|pido|solicito) (una )?llamada|hablar por (telefono|llamada)|llamada (ahora|ya|por favor))\b/.test(t)
}

// Resumen corto del chat para que Alejandra sepa de qué se ha hablado.
export function resumenChat(historial: Array<{ direction: string; message: string }>, ultimo: string): string {
  const lineas = historial.slice(0, 8).reverse()
    .map(m => `${m.direction === 'inbound' ? 'Cliente' : 'GROUP 360'}: ${(m.message || '').replace(/\s+/g, ' ').slice(0, 160)}`)
  lineas.push(`Cliente: ${ultimo.slice(0, 160)}`)
  return lineas.join('\n').slice(0, 1500)
}
