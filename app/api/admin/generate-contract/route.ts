import { NextRequest, NextResponse } from 'next/server'
import { generateContractPdf, contractFileName } from '@/lib/pdf'
import { supabaseAdmin } from '@/lib/supabase'

// Ejecuta en runtime Node (pdf-lib necesita APIs de Node, no Edge)
export const runtime = 'nodejs'

// Autoriza por cookie de admin (panel) o por API key (workflow de n8n).
function authorized(req: NextRequest): boolean {
  const cookie = req.cookies.get('admin_token')?.value
  const apiKey = req.headers.get('x-api-key')
  const secret = process.env.ADMIN_SECRET
  const contractsKey = process.env.CONTRACTS_API_KEY || secret
  return (!!secret && cookie === secret) || (!!contractsKey && apiKey === contractsKey)
}

// POST — genera el PDF del contrato y lo devuelve como binario (application/pdf).
// Lo usan tanto el botón "Generar PDF" del panel como el nodo HTTP Request de n8n.
export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const body = await req.json()
    // Acepta el naming del panel (tipo/datos) y el del webhook de n8n (tipo_contrato/datos_contrato)
    const tipo = body.tipo || body.tipo_contrato
    const datos = body.datos || body.datos_contrato || {}
    const contratoId = body.contrato_id || body.id

    if (!tipo) return NextResponse.json({ error: 'Falta el tipo de contrato' }, { status: 400 })

    const pdfBytes = await generateContractPdf({ tipo, datos })

    // Si el contrato existe en BD, marca que el PDF fue generado
    if (contratoId) {
      await supabaseAdmin
        .from('contratos')
        .update({ estado: 'generado' })
        .eq('id', contratoId)
        .eq('estado', 'borrador')
        .then(() => {}, () => {})
    }

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${contractFileName(tipo, datos)}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
