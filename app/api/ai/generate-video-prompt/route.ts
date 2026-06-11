import { NextRequest, NextResponse } from 'next/server'
import { callOpenAI } from '@/app/api/openai'

const VIDEO_TYPES = [
  'Aerial drone cinematic tour of the property exterior, golden hour lighting, luxury real estate',
  'Interior walkthrough smooth camera movement, elegant living spaces, warm lighting, premium real estate',
  'Neighborhood lifestyle video, local amenities, restaurants, beach/park, vibrant Spanish coastal life',
]

export async function POST(req: NextRequest) {
  try {
    const { titulo, tipo, ubicacion, precio, m2, descripcion } = await req.json()

    const prompts = await Promise.all(
      VIDEO_TYPES.map((template, i) =>
        callOpenAI([
          {
            role: 'system',
            content: 'You are a professional real estate video director. Generate detailed cinematic video prompts for AI video generation. Be specific about camera movements, lighting, mood. Output in English only.',
          },
          {
            role: 'user',
            content: `Create a detailed video generation prompt (3-4 sentences) for: ${template}\n\nProperty: ${titulo}\nType: ${tipo}\nLocation: ${ubicacion}\nPrice: €${precio}\nSize: ${m2}m²\nDescription: ${descripcion || ''}`,
          },
        ], 'gpt-4o-mini', 200)
      )
    )

    return NextResponse.json({
      prompts: prompts.map((p, i) => ({ type: i + 1, prompt: p })),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
