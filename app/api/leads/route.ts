import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { scoreLead } from '@/lib/scoring'

async function notifyAgent(lead: any, score: number, redirect: string) {
  const token = process.env.WHATSAPP_TOKEN
  const phoneId = process.env.WHATSAPP_PHONE_ID
  const agentPhone = (process.env.AGENT_WHATSAPP || '').replace(/\D/g, '')
  if (!token || !phoneId || !agentPhone) return

  const emoji = redirect === 'exp' ? '🔵' : redirect === 'personal' ? '🟠' : '🟢'
  const msg = `${emoji} *NUEVO LEAD — 360GROUP*\n\n👤 ${lead.name || 'Sin nombre'}\n📧 ${lead.email || '-'}\n📱 ${lead.phone || '-'}\n💰 Presupuesto: €${lead.budget_max || '-'}\n📍 Zona: ${lead.preferred_zone || '-'}\n📊 Score: ${score}%\n🎯 Ruta: ${redirect.toUpperCase()}\n📌 Fuente: ${lead.source}`

  await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to: agentPhone, type: 'text', text: { body: msg } }),
  }).catch(() => {})
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { score, redirect } = scoreLead(body)

    const { data: lead, error } = await supabaseAdmin
      .from('leads')
      .insert({ ...body, scoring_result: score, redirect_type: redirect, status: 'new' })
      .select().single()

    if (error) throw error

    await notifyAgent(body, score, redirect)

    const n8nUrl = process.env.N8N_WEBHOOK_URL
    if (n8nUrl) {
      await fetch(`${n8nUrl}/new-lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead, score, redirect }),
      }).catch(() => {})
    }

    return NextResponse.json({ ok: true, lead, score, redirect })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}

export async function GET() {
  const { data } = await supabaseAdmin.from('leads').select('*').order('created_at', { ascending: false })
  return NextResponse.json(data || [])
}

export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const body = await req.json()
    const { error } = await supabaseAdmin.from('leads').update(body).eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
