import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { scoreLead } from '@/lib/scoring'
import { notifyNewLead, notifyHotLead } from '@/lib/notifications'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { score, redirect } = scoreLead(body)

    const { data: lead, error } = await supabaseAdmin
      .from('leads')
      .insert({ ...body, scoring_result: score, redirect_type: redirect, status: 'new' })
      .select().single()

    if (error) throw error

    // Notifications (non-blocking)
    notifyNewLead({ ...body, scoring_result: score }).catch(() => {})
    if (score > 70) notifyHotLead({ ...body, scoring_result: score }).catch(() => {})

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
  const { searchParams } = new URL(req.url)
  const hot = searchParams.get('hot')

  let query = supabaseAdmin.from('leads').select('*').order('created_at', { ascending: false })
  if (hot) query = query.gt('scoring_result', 70)

  const { data } = await query
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
