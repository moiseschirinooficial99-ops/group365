import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAdmin, unauthorized } from '@/lib/adminAuth'
import { scoreLead } from '@/lib/scoring'
import { notifyNewLead, notifyHotLead } from '@/lib/notifications'
import { parseLead, isHoneypotHit, isPrivateInvestorSource, rateLimited, clientIp } from '@/lib/leadInput'

export async function POST(req: NextRequest) {
  try {
    let body: Record<string, unknown>
    try { body = await req.json() } catch {
      return NextResponse.json({ error: 'Datos no válidos' }, { status: 400 })
    }

    // Bot que rellena el campo trampa: le decimos "ok" y no guardamos nada.
    if (isHoneypotHit(body)) return NextResponse.json({ ok: true })

    if (rateLimited(`lead:${clientIp(req.headers)}`)) {
      return NextResponse.json({ error: 'Demasiados envíos. Inténtalo en unos minutos.' }, { status: 429 })
    }

    const parsed = parseLead(body)
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })
    const input = parsed.lead

    let { score, redirect } = scoreLead(input)
    if (isPrivateInvestorSource(input.source)) score = Math.max(score, 90)

    const { data: lead, error } = await supabaseAdmin
      .from('leads')
      .insert({ ...input, scoring_result: score, redirect_type: redirect, status: 'new' })
      .select().single()

    if (error) throw error

    // Notifications (non-blocking)
    notifyNewLead({ ...input, scoring_result: score }).catch(() => {})
    if (score > 70) notifyHotLead({ ...input, scoring_result: score }).catch(() => {})

    // n8n webhook (non-blocking)
    const n8nUrl = process.env.N8N_WEBHOOK_URL
    if (n8nUrl) {
      fetch(`${n8nUrl}/new-lead`, {
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

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized()
  const { searchParams } = new URL(req.url)
  const hot = searchParams.get('hot')

  let query = supabaseAdmin.from('leads').select('*').order('created_at', { ascending: false })
  if (hot) query = query.gt('scoring_result', 70)

  const { data } = await query
  return NextResponse.json(data || [])
}

export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized()
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
