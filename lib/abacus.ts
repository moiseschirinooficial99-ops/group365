const ABACUS_API_KEY = process.env.ABACUS_API_KEY
const ABACUS_BASE = 'https://api.abacus.ai/api/v0'

export interface VideoJob {
  jobId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  videoUrl?: string
}

export async function generateVideo(prompt: string, durationSeconds = 5): Promise<VideoJob> {
  if (!ABACUS_API_KEY) throw new Error('ABACUS_API_KEY no configurada')

  const res = await fetch(`${ABACUS_BASE}/generateVideo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apiKey': ABACUS_API_KEY },
    body: JSON.stringify({ prompt, duration: durationSeconds }),
  })

  if (!res.ok) throw new Error(`Abacus error ${res.status}`)
  const data = await res.json()
  return { jobId: data.jobId || data.id, status: 'pending' }
}

export async function getVideoStatus(jobId: string): Promise<VideoJob> {
  if (!ABACUS_API_KEY) throw new Error('ABACUS_API_KEY no configurada')

  const res = await fetch(`${ABACUS_BASE}/videoStatus/${jobId}`, {
    headers: { 'apiKey': ABACUS_API_KEY },
  })

  if (!res.ok) throw new Error(`Abacus status error ${res.status}`)
  const data = await res.json()

  return {
    jobId,
    status: data.status,
    videoUrl: data.videoUrl || data.url,
  }
}
