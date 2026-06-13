import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendTelegramNotification } from '@/lib/notifications'

// Exchanges current token for a new 60-day long-lived token and stores in Supabase
export async function GET(req: NextRequest) {
  const appId = process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET
  const currentToken = process.env.WHATSAPP_TOKEN

  if (!appId || !appSecret || !currentToken) {
    return NextResponse.json({ error: 'Missing META_APP_ID, META_APP_SECRET or WHATSAPP_TOKEN' }, { status: 500 })
  }

  try {
    const url = `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${currentToken}`
    const res = await fetch(url)
    const data = await res.json()

    if (data.error) {
      await sendTelegramNotification(`🚨 <b>Error renovando token WhatsApp</b>\n\n${data.error.message}\n\nRenueva el token manualmente en Meta for Developers.`)
      return NextResponse.json({ error: data.error.message }, { status: 400 })
    }

    const newToken = data.access_token
    const expiresIn = data.expires_in // seconds

    // Store in Supabase for the WhatsApp route to read
    await supabaseAdmin.from('app_settings').upsert({
      key: 'whatsapp_token',
      value: newToken,
      updated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
    }, { onConflict: 'key' })

    const expiryDate = new Date(Date.now() + expiresIn * 1000).toLocaleDateString('es-ES')
    await sendTelegramNotification(`✅ <b>Token WhatsApp renovado</b>\n\nVálido hasta: ${expiryDate}\n\nRenovación automática activa.`)

    return NextResponse.json({ ok: true, expires_at: expiryDate, message: 'Token renovado y guardado en Supabase' })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
