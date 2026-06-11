import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data } = await supabaseAdmin
    .from('agent_availability')
    .select('*')
    .gte('date_from', new Date().toISOString())
    .order('date_from', { ascending: true })
    .limit(20)
  return NextResponse.json(data || [])
}
