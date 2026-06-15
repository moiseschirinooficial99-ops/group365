import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const propertyId = new URL(req.url).searchParams.get('property_id')
  if (!propertyId) return NextResponse.json([], { status: 200 })
  const { data } = await supabaseAdmin
    .from('rental_availability')
    .select('date_start, date_end, status')
    .eq('property_id', propertyId)
    .order('date_start')
  return NextResponse.json(data || [])
}
