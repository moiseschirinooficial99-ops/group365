import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const openaiKey = process.env.OPENAI_API_KEY
  const waToken = process.env.WHATSAPP_TOKEN

  // Test Supabase insert + select
  let insertResult = 'not_tested'
  let selectResult = 'not_tested'
  let insertError = ''
  let selectError = ''

  try {
    const { error } = await supabaseAdmin.from('wa_conversations').insert({
      phone: 'DIAG_TEST_000',
      message: 'diagnostico panel',
      direction: 'inbound',
      wa_message_id: `diag_${Date.now()}`,
    })
    if (error) { insertResult = 'ERROR'; insertError = error.message }
    else insertResult = 'OK'
  } catch (e: any) {
    insertResult = 'EXCEPTION'; insertError = e.message
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('wa_conversations')
      .select('id, phone, created_at')
      .eq('phone', 'DIAG_TEST_000')
      .limit(1)
    if (error) { selectResult = 'ERROR'; selectError = error.message }
    else selectResult = data?.length ? 'OK — row found' : 'OK — no rows'
  } catch (e: any) {
    selectResult = 'EXCEPTION'; selectError = e.message
  }

  // Cleanup
  await supabaseAdmin.from('wa_conversations').delete().eq('phone', 'DIAG_TEST_000').catch(() => {})

  return NextResponse.json({
    env: {
      SUPABASE_URL: supabaseUrl ? `${supabaseUrl.slice(0, 30)}…` : 'NOT SET',
      SERVICE_KEY: serviceKey
        ? serviceKey === 'placeholder' ? 'PLACEHOLDER (not set in Vercel!)' : `SET (${serviceKey.slice(0, 12)}…)`
        : 'NOT SET',
      OPENAI_KEY: openaiKey ? `SET (${openaiKey.slice(0, 10)}…)` : 'NOT SET',
      WA_TOKEN: waToken ? `SET (${waToken.slice(0, 10)}…)` : 'NOT SET',
    },
    supabase: {
      insert: insertResult,
      insertError,
      select: selectResult,
      selectError,
    },
  })
}
