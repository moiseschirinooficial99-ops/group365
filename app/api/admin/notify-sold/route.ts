import { NextRequest, NextResponse } from 'next/server'
import { notifyPropertySold } from '@/lib/notifications'

export async function POST(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value
  if (!token || token !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  try {
    const property = await req.json()
    await notifyPropertySold(property)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
