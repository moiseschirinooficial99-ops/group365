import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAdmin, unauthorized } from '@/lib/adminAuth'
import { BOT_STYLES, styleFor } from '@/lib/botKnowledge'

// Compara los estilos de conversación del bot (A/B/C).
// GET /api/admin/bot-estilos?dias=30
// Por estilo: conversaciones nuevas, cuántas siguen hablando (3+ mensajes),
// cuántas dan su nombre, cuántas acaban en cita y cuántas en cliente ganado.
const last9 = (p?: string | null) => (p || '').replace(/\D/g, '').slice(-9)

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized()
  const dias = Math.min(Math.max(Number(req.nextUrl.searchParams.get('dias')) || 30, 1), 365)
  const desde = new Date(Date.now() - dias * 864e5).toISOString()

  const [{ data: msgs }, { data: leads }, { data: citas }] = await Promise.all([
    supabaseAdmin.from('wa_conversations').select('phone')
      .eq('direction', 'inbound').gte('created_at', desde).limit(20000),
    supabaseAdmin.from('leads').select('phone, name, status').not('phone', 'is', null).limit(20000),
    supabaseAdmin.from('appointments').select('phone').gte('created_at', desde).limit(5000),
  ])

  const porTelefono = new Map<string, { phone: string; mensajes: number }>()
  for (const m of msgs || []) {
    const k = last9(m.phone)
    if (!k) continue
    const x = porTelefono.get(k) || { phone: m.phone, mensajes: 0 }
    x.mensajes++
    porTelefono.set(k, x)
  }
  const leadPorTel = new Map((leads || []).map((l: any) => [last9(l.phone), l]))
  const conCita = new Set((citas || []).map((c: any) => last9(c.phone)).filter(Boolean))

  const stats = Object.fromEntries(BOT_STYLES.map(s => [s.id, {
    estilo: `${s.id} — ${s.nombre}`, conversaciones: 0, enganchados: 0, con_nombre: 0, citas: 0, ganados: 0,
  }]))
  for (const [k, x] of Array.from(porTelefono)) {
    const st = stats[styleFor(x.phone).id]
    const lead: any = leadPorTel.get(k)
    st.conversaciones++
    if (x.mensajes >= 3) st.enganchados++
    if (lead?.name) st.con_nombre++
    if (conCita.has(k)) st.citas++
    if (lead?.status === 'converted') st.ganados++
  }
  const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0)
  const resultado = Object.values(stats).map(s => ({
    ...s,
    pct_enganchados: pct(s.enganchados, s.conversaciones),
    pct_con_nombre: pct(s.con_nombre, s.conversaciones),
    pct_citas: pct(s.citas, s.conversaciones),
  }))
  return NextResponse.json({ dias, resultado, nota: 'Con menos de ~30 conversaciones por estilo las diferencias no son fiables.' })
}
