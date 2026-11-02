import { NextRequest, NextResponse } from 'next/server'

// Comparación de longitud y contenido sin atajos (evita medir tiempos
// para adivinar la clave carácter a carácter). Funciona en Node y Edge.
export function safeEqual(a: string | undefined | null, b: string | undefined | null): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  let diff = a.length ^ b.length
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    // charCodeAt fuera de rango da NaN; `| 0` lo convierte en 0
    diff |= (a.charCodeAt(i) | 0) ^ (b.charCodeAt(i) | 0)
  }
  return diff === 0
}

// Misma comprobación que hace middleware.ts para las páginas /admin, pero para
// las rutas /api: el middleware no cubre /api, así que cada ruta del panel
// tiene que validar la cookie por sí misma.
// También acepta `Authorization: Bearer <ADMIN_SECRET>` para llamadas de
// servidor a servidor (n8n).
export function isAdmin(req: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET
  if (!secret) return false
  return safeEqual(req.cookies.get('admin_token')?.value, secret)
    || safeEqual(req.headers.get('authorization'), `Bearer ${secret}`)
}

export function unauthorized() {
  return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
}

// Chats de Telegram autorizados a usar los comandos del panel (leads, stats,
// facturas…). TELEGRAM_ADMIN_CHAT_IDS admite varios separados por coma; si no
// está definido se usa el chat de notificaciones TELEGRAM_CHAT_ID.
export function isAdminChat(chatId: string): boolean {
  const raw = process.env.TELEGRAM_ADMIN_CHAT_IDS || process.env.TELEGRAM_CHAT_ID || ''
  return raw.split(',').map(s => s.trim()).filter(Boolean).includes(chatId)
}
