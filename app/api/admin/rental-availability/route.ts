import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { notifyNewRentalBooking, notifyRentalBlocked } from '@/lib/notifications'

function isAdmin(req: NextRequest) {
  return req.cookies.get('admin_token')?.value === process.env.ADMIN_SECRET
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const propertyId = new URL(req.url).searchParams.get('property_id')
  const query = supabaseAdmin.from('rental_availability').select('*').order('date_start')
  if (propertyId) query.eq('property_id', propertyId)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try {
    const body = await req.json()
    const { property_name, ...bookingData } = body

    const { data, error } = await supabaseAdmin
      .from('rental_availability')
      .insert(bookingData)
      .select()
      .single()
    if (error) throw error

    if (bookingData.status === 'blocked' || bookingData.status === 'maintenance') {
      await notifyRentalBlocked({ property_name, date_start: bookingData.date_start, date_end: bookingData.date_end, notes: bookingData.notes })
    } else {
      await notifyNewRentalBooking({ property_name, ...bookingData })
    }

    return NextResponse.json({ data, ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })
  const { error } = await supabaseAdmin.from('rental_availability').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
