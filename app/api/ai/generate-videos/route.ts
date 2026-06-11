import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateVideo } from '@/lib/abacus'

export async function POST(req: NextRequest) {
  try {
    const { propertyId, prompts } = await req.json()
    if (!propertyId || !prompts?.length) {
      return NextResponse.json({ error: 'propertyId y prompts requeridos' }, { status: 400 })
    }

    const results = await Promise.all(
      prompts.map(async (p: { type: number; prompt: string }) => {
        try {
          const job = await generateVideo(p.prompt, 5)
          const { data } = await supabaseAdmin.from('property_videos').insert({
            property_id: propertyId,
            video_type: p.type,
            prompt: p.prompt,
            status: 'processing',
          }).select().single()
          return { dbId: data?.id, jobId: job.jobId, type: p.type }
        } catch {
          return { error: true, type: p.type }
        }
      })
    )

    return NextResponse.json({ ok: true, jobs: results })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
