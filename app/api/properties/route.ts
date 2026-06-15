import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data } = await supabaseAdmin
    .from('properties')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  return NextResponse.json(data || [])
}

const ALLOWED_COLUMNS = new Set([
  'title','description','price','price_per_night','location','zone',
  'latitude','longitude','property_type','channel','bedrooms','bathrooms',
  'area_sqm','yearly_rent','estimated_roi','exp_property_id',
  'main_image','images','features','is_featured','is_active','created_by',
])

function pickAllowed(body: Record<string, any>) {
  return Object.fromEntries(Object.entries(body).filter(([k]) => ALLOWED_COLUMNS.has(k)))
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value
  if (!token || token !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  try {
    const body = pickAllowed(await req.json())
    const { data, error } = await supabaseAdmin
      .from('properties')
      .insert(body)
      .select()
      .single()
    if (error) throw error
    return NextResponse.json({ data, ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const body = await req.json()
    const { error } = await supabaseAdmin.from('properties').update(body).eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
