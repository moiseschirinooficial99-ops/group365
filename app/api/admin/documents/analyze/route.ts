import { NextRequest, NextResponse } from 'next/server'
import { isAdmin, unauthorized } from '@/lib/adminAuth'
import { analyzeDocument, DocKind } from '@/lib/documentAnalyzer'

export const maxDuration = 120 // leer un dossier largo con IA y sacar sus fotos puede tardar

// El panel sube el PDF/imagen con la URL firmada y luego llama aquí con su ruta.
// Devuelve los campos para prellenar el formulario y las URLs de las fotos.
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized()
  try {
    const { path, kind } = await req.json()
    if (typeof path !== 'string' || !/^[\w\-/.]+$/.test(path) || path.includes('..')) {
      return NextResponse.json({ error: 'Ruta no válida' }, { status: 400 })
    }
    const k: DocKind = kind === 'property' ? 'property' : 'opportunity'
    const result = await analyzeDocument(k, path)
    return NextResponse.json({ ok: true, ...result })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
