import { NextRequest, NextResponse } from 'next/server'
import { isAdmin, unauthorized } from '@/lib/adminAuth'
import { enviarPaqueteMensual } from '@/lib/contabilidad'

export const maxDuration = 300

// Envía a la gestoría el paquete del mes anterior (o ?mes=2026-10 para uno concreto).
// Lo dispara el cron de Vercel (día 5, `Authorization: Bearer CRON_SECRET`)
// o una llamada manual del panel con sesión de admin.
function autorizado(req: NextRequest) {
  const s = process.env.CRON_SECRET
  return (!!s && req.headers.get('authorization') === `Bearer ${s}`) || isAdmin(req)
}

function mesAnterior() {
  const d = new Date()
  d.setUTCDate(1)
  d.setUTCMonth(d.getUTCMonth() - 1)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

export async function GET(req: NextRequest) {
  if (!autorizado(req)) return unauthorized()
  const mes = req.nextUrl.searchParams.get('mes') || mesAnterior()
  if (!/^\d{4}-\d{2}$/.test(mes)) return NextResponse.json({ error: 'mes debe ser AAAA-MM' }, { status: 400 })
  try {
    const r = await enviarPaqueteMensual(mes)
    return NextResponse.json({ ok: true, ...r })
  } catch (e: any) {
    console.error('Envío mensual contabilidad:', e?.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
