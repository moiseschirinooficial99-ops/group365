import { NextRequest, NextResponse } from 'next/server'
import { callOpenAI } from '@/app/api/openai'

export async function POST(req: NextRequest) {
  try {
    const { titulo, tipo, precio, ubicacion, m2, habitaciones, banos } = await req.json()

    const description = await callOpenAI([
      {
        role: 'system',
        content: 'Eres un copywriter inmobiliario premium español. Genera descripciones de propiedades profesionales, persuasivas y emocionalmente atractivas. Máximo 3 párrafos. Sin emojis.',
      },
      {
        role: 'user',
        content: `Genera una descripción para esta propiedad:\n\nTipo: ${tipo}\nTítulo: ${titulo}\nPrecio: €${precio}\nUbicación: ${ubicacion}\nSuperficie: ${m2}m²\nHabitaciones: ${habitaciones}\nBaños: ${banos}\n\n3 párrafos máximo. Lenguaje premium y persuasivo.`,
      },
    ])

    return NextResponse.json({ description })
  } catch (e: any) {
    return NextResponse.json({ error: e.message, description: '' }, { status: 200 })
  }
}
