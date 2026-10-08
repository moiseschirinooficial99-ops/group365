import { NextRequest, NextResponse } from 'next/server'

// Misma comprobación que hace middleware.ts para las páginas /admin, pero para
// las rutas /api: el middleware no cubre /api, así que cada ruta del panel
// tiene que validar la cookie por sí misma.
// También acepta `Authorization: Bearer <ADMIN_SECRET>` para llamadas de
// servidor a servidor (n8n).
export function isAdmin(req: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET
  if (!secret) return false
  return req.cookies.get('admin_token')?.value === secret
    || req.headers.get('authorization') === `Bearer ${secret}`
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
