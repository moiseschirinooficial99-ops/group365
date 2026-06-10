import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data } = await supabaseAdmin
    .from('properties')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  return NextResponse.json(data || [])
}
