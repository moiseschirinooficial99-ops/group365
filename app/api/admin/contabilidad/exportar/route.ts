import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAdmin, unauthorized } from '@/lib/adminAuth'
import { construirZip, rangoMes, rangoTrimestre } from '@/lib/contabilidad'

export const maxDuration = 300

// GET ?year=2026&q=4 → ZIP trimestral. GET ?mes=2026-10 → ZIP de un mes.
// Contenido: libro.csv, movimientos_bancarios.csv, resumen.txt y carpetas
// gastos/ ingresos/ extractos/ con los archivos originales.
// Con marcar=1, los documentos exportados pasan a "enviado_gestoria".
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized()
  const sp = req.nextUrl.searchParams
  const mes = sp.get('mes')
  let from: string, to: string, titulo: string, nombre: string
  if (mes && /^\d{4}-\d{2}$/.test(mes)) {
    ({ from, to } = rangoMes(mes))
    titulo = `mes ${mes}`
    nombre = `GROUP360_contabilidad_${mes}.zip`
  } else {
    const year = Number(sp.get('year')) || new Date().getFullYear()
    const q = Number(sp.get('q')) || Math.ceil((new Date().getMonth() + 1) / 3)
    ;({ from, to } = rangoTrimestre(year, q))
    titulo = `${q}º trimestre ${year}`
    nombre = `GROUP360_contabilidad_${year}_T${q}.zip`
  }

  try {
    const { content, lista } = await construirZip(from, to, titulo)
    if (sp.get('marcar') && lista.length) {
      await supabaseAdmin.from('accounting_documents').update({ status: 'enviado_gestoria' })
        .in('id', lista.map(d => d.id))
    }
    return new NextResponse(content as any, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${nombre}"`,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
