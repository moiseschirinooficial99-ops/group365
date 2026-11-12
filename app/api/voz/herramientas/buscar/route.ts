import { NextRequest, NextResponse } from 'next/server'
import { buscarPisos, fichaHablada, noAutorizado, vozAutorizada } from '@/lib/voz'

// Herramienta "buscar_pisos" del agente de voz: devuelve hasta 3 pisos en frases que se pueden decir en voz alta.
export async function POST(req: NextRequest) {
  if (!vozAutorizada(req)) return noAutorizado()
  const b = await req.json().catch(() => ({})) as Record<string, any>
  try {
    const pisos = await buscarPisos({
      referencia: b.referencia ? String(b.referencia) : undefined,
      zona: b.zona ? String(b.zona) : undefined,
      operacion: b.operacion === 'alquiler' || b.operacion === 'compra' ? b.operacion : undefined,
      precio_max: Number(b.precio_max) || undefined,
    })
    if (!pisos.length) {
      return NextResponse.json({ resultado: 'No hay pisos con esos datos ahora mismo. Ofrece apuntar lo que busca para avisarle cuando entre algo.' })
    }
    return NextResponse.json({
      resultado: pisos.map((p: any, i: number) => `${i + 1}. ${fichaHablada(p)}`).join('\n'),
      ids: pisos.map((p: any) => p.id),
    })
  } catch (e: any) {
    console.error('VOZ buscar:', e.message)
    return NextResponse.json({ resultado: 'No puedo consultar la base ahora. Di que un asesor le confirma los pisos por WhatsApp.' })
  }
}
