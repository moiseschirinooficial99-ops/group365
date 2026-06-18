import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get('phone')

  if (phone) {
    const { data } = await supabaseAdmin
      .from('wa_conversations')
      .select('*')
      .eq('phone', phone)
      .order('created_at', { ascending: true })
    return NextResponse.json(data || [])
  }

  // Try the grouped view first (needs SQL migration to exist)
  const { data: viewData, error: viewErr } = await supabaseAdmin
    .from('wa_conversations_grouped')
    .select('*')

  let conversations: any[]

  if (!viewErr && viewData) {
    conversations = viewData
  } else {
    // Fallback: manual grouping from raw table
    const { data: raw } = await supabaseAdmin
      .from('wa_conversations')
      .select('phone, message, direction, created_at, is_read')
      .order('created_at', { ascending: false })
      .limit(2000)

    const map: Record<string, any> = {}
    for (const row of raw || []) {
      if (!map[row.phone]) {
        map[row.phone] = {
          phone: row.phone,
          last_message: row.message,
          last_message_at: row.created_at,
          last_direction: row.direction,
          total_messages: 0,
          unread_count: 0,
        }
      }
      map[row.phone].total_messages++
      if (row.is_read === false && row.direction === 'inbound') {
        map[row.phone].unread_count++
      }
    }
    conversations = Object.values(map).sort(
      (a: any, b: any) =>
        new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
    )
  }

  // Enrich with lead scores (match by last 9 digits of phone)
  const { data: leads } = await supabaseAdmin
    .from('leads')
    .select('phone, name, scoring_result, status')
    .not('phone', 'is', null)

  const leadMap: Record<string, any> = {}
  for (const lead of leads || []) {
    const key = (lead.phone || '').replace(/\D/g, '').slice(-9)
    if (key) leadMap[key] = lead
  }

  conversations = conversations.map((c: any) => ({
    ...c,
    lead: leadMap[String(c.phone).replace(/\D/g, '').slice(-9)] || null,
  }))

  return NextResponse.json(conversations)
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { phone, action } = body

  if (!phone) return NextResponse.json({ error: 'phone required' }, { status: 400 })

  if (action === 'mark_read') {
    await supabaseAdmin
      .from('wa_conversations')
      .update({ is_read: true })
      .eq('phone', phone)
      .eq('direction', 'inbound')
    return NextResponse.json({ ok: true })
  }

  if (action === 'mark_hot') {
    const { data: allLeads } = await supabaseAdmin
      .from('leads')
      .select('id, phone')
      .not('phone', 'is', null)

    const key = String(phone).replace(/\D/g, '').slice(-9)
    const match = (allLeads || []).find(
      (l: any) => (l.phone || '').replace(/\D/g, '').slice(-9) === key
    )

    if (match) {
      await supabaseAdmin
        .from('leads')
        .update({ scoring_result: 90, status: 'qualified' })
        .eq('id', match.id)
    } else {
      await supabaseAdmin.from('leads').insert({
        phone: `+${phone}`,
        source: 'whatsapp',
        type: 'buyer',
        scoring_result: 90,
        status: 'qualified',
      })
    }
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 })
}
