import { NextResponse } from 'next/server'
import { sendTelegramNotification } from '@/lib/notifications'

export async function GET() {
  try {
    await sendTelegramNotification(
      `✅ <b>Test de notificaciones GROUP 360</b>\n\nSistema de alertas activo y funcionando.\n\n🔔 Recibirás alertas por:\n• Nuevo lead → nombre, email, teléfono, score\n• Lead caliente (score >70%) → notificación urgente\n• Vendedor detectado → captación inmediata\n• Token WhatsApp expirado → aviso con instrucciones\n• Nueva propiedad publicada → confirmación\n\n🌐 Panel web: group365.vercel.app/admin`
    )
    return NextResponse.json({ ok: true, message: 'Notificación enviada a Telegram' })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
