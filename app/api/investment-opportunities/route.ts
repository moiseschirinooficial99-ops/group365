import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendTelegramNotification } from '@/lib/notifications'
import { notifyNewOpportunity } from '@/lib/notifyInvestors'

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams
  const category = sp.get('category')
  const isPublic = sp.get('is_public')
  const status = sp.get('status')
  const id = sp.get('id')

  if (id) {
    const { data } = await supabaseAdmin.from('investment_opportunities').select('*').eq('id', id).single()
    return NextResponse.json(data || null)
  }

  let query = supabaseAdmin.from('investment_opportunities').select('*')

  if (category) query = query.eq('category', category)
  if (isPublic === 'true') query = query.eq('is_public', true)
  if (isPublic === 'false') query = query.eq('is_public', false)
  if (status) query = query.eq('status', status)

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) return NextResponse.json([], { status: 200 })
  return NextResponse.json(data || [])
}

function requireAdmin(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value
  return token === process.env.ADMIN_SECRET
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const body = await req.json()
    const { notify_investors, ...fields } = body

    const { data, error } = await supabaseAdmin
      .from('investment_opportunities')
      .insert(fields)
      .select()
      .single()

    if (error) throw error

    if (notify_investors && data?.is_public) {
      notifyNewOpportunity(data).catch(() => {})
    } else {
      await sendTelegramNotification(
        `✅ <b>Nueva oportunidad publicada</b>\n\n📂 ${data.category?.toUpperCase()}\n🏠 ${data.title}\n📍 ${data.location || '-'}\n📊 ROI: ${data.roi_estimated || data.annual_return_pct || '-'}%`
      )
    }

    return NextResponse.json({ data, ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const body = await req.json()
    const { id, ...updates } = body

    const { data, error } = await supabaseAdmin
      .from('investment_opportunities')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ data, ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const sp = new URL(req.url).searchParams
    const id = sp.get('id')
    const body = await req.json()
    const { error } = await supabaseAdmin.from('investment_opportunities').update(body).eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
