import { NextRequest, NextResponse } from 'next/server'
import { safeEqual } from '@/lib/adminAuth'
import { rateLimited, clientIp } from '@/lib/leadInput'

export async function POST(req: NextRequest) {
  // Máx. 8 intentos cada 15 min por IP: corta los ataques de fuerza bruta.
  if (rateLimited(`login:${clientIp(req.headers)}`, 8, 15 * 60 * 1000)) {
    return NextResponse.json({ error: 'Demasiados intentos. Espera 15 minutos.' }, { status: 429 })
  }

  const { password } = await req.json().catch(() => ({ password: '' }))
  const secret = process.env.ADMIN_SECRET

  if (!secret) {
    return NextResponse.json({ error: 'ADMIN_SECRET not configured' }, { status: 500 })
  }

  if (!safeEqual(password, secret)) {
    await new Promise(r => setTimeout(r, 600))
    return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set('admin_token', secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 30, // 30 días
    path: '/',
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete('admin_token')
  return res
}
