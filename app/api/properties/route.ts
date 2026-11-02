import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendTelegramNotification } from '@/lib/notifications'

// Columnas que necesitan los listados públicos (tarjetas y filtros).
// `?view=card` evita mandar descripciones y galerías: el catálogo pasa de
// ~1 MB a una fracción, y las páginas públicas cargan mucho antes.
const CARD_COLUMNS = [
  'id', 'title', 'price', 'price_per_night', 'location', 'city', 'zone', 'province',
  'channel', 'status', 'property_type', 'bedrooms', 'bathrooms', 'area_sqm', 'plot_m2',
  'main_image', 'estimated_roi', 'yearly_rent', 'is_featured', 'is_success_case',
  'sold_price', 'sold_date', 'created_at', 'min_nights', 'external_ref',
].join(',')

// Caché en la CDN de Vercel: 5 min fresca y hasta 1 h sirviendo la anterior
// mientras se regenera. Solo para listados públicos.
const PUBLIC_CACHE = { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' }

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams
  const idFilter = sp.get('id')
  const successOnly = sp.get('success') === 'true'
  const statusFilter = sp.get('status')
  const cardView = sp.get('view') === 'card'

  if (idFilter) {
    const { data } = await supabaseAdmin.from('properties').select('*').eq('id', idFilter).single()
    return NextResponse.json(data || null)
  }

  let query = supabaseAdmin.from('properties').select(cardView ? CARD_COLUMNS : '*')

  if (successOnly) {
    query = query.eq('status', 'vendida').eq('is_success_case', true)
  } else if (statusFilter) {
    query = query.eq('status', statusFilter).eq('is_active', true)
  } else {
    query = query.eq('is_active', true)
  }

  const { data } = await query.order('created_at', { ascending: false })
  return NextResponse.json(data || [], cardView ? { headers: PUBLIC_CACHE } : undefined)
}

const ALLOWED_COLUMNS = new Set([
  'title','description','price','price_per_night','price_high_season','price_low_season',
  'price_mid_season',
  'location','zone','latitude','longitude','property_type','channel','status',
  'bedrooms','bathrooms','area_sqm','plot_m2','yearly_rent','estimated_roi',
  'exp_property_id','main_image','images','features','is_featured','is_active',
  'created_by','min_nights',
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
  const token = req.cookies.get('admin_token')?.value
  if (!token || token !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
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

export async function PUT(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value
  if (!token || token !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  try {
    const body = await req.json()
    const { id, deleted_image_paths, changes_summary, ...updates } = body

    if (deleted_image_paths?.length) {
      await supabaseAdmin.storage.from('property-images').remove(deleted_image_paths)
    }

    const { data, error } = await supabaseAdmin
      .from('properties')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    const precioDisplay = updates.price_per_night > 0
      ? `€${Number(updates.price_per_night).toLocaleString('es-ES')}/noche`
      : `€${Number(updates.price || 0).toLocaleString('es-ES')}`
    await sendTelegramNotification(
      `✏️ <b>Propiedad actualizada</b>\n\n🏠 ${updates.title || 'Sin título'}\n💰 ${precioDisplay}\n📍 ${updates.location || '-'}${changes_summary ? `\n\n📝 Cambios: ${changes_summary}` : ''}\n\n🤖 El bot de WhatsApp ya refleja los datos nuevos automáticamente.`
    )

    return NextResponse.json({ data, ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value
  if (!token || token !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  try {
    const { id } = await req.json()
    const { error } = await supabaseAdmin
      .from('properties')
      .update({ is_active: false })
      .eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
