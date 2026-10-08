import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAdmin, unauthorized } from '@/lib/adminAuth'

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized()
  const { data } = await supabaseAdmin
    .from('agent_availability')
    .select('*')
    .gte('date_from', new Date().toISOString())
    .order('date_from', { ascending: true })
    .limit(20)
  return NextResponse.json(data || [])
}
