import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'
import { supabaseAdmin } from '@/lib/supabase'
import { isAdmin, unauthorized } from '@/lib/adminAuth'
import { BUCKET, rangoTrimestre, resumenFiscal } from '@/lib/contabilidad'

export const maxDuration = 60

// GET ?year=2026&q=4[&marcar=1] → ZIP para la gestoría:
//   libro.csv (abre en Excel), resumen.txt y carpetas gastos/ e ingresos/ con
//   los archivos originales renombrados "fecha_proveedor_total".
// Con marcar=1, los documentos exportados pasan a "enviado_gestoria".
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized()
  const sp = req.nextUrl.searchParams
  const year = Number(sp.get('year')) || new Date().getFullYear()
  const q = Number(sp.get('q')) || Math.ceil((new Date().getMonth() + 1) / 3)
  const { from, to } = rangoTrimestre(year, q)

  const { data: docs, error } = await supabaseAdmin.from('accounting_documents').select('*')
    .gte('issue_date', from).lte('issue_date', to).order('issue_date')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const lista: any[] = docs || []

  const zip = new JSZip()
  const num = (v: any) => (v === null || v === undefined || v === '' ? '' : Number(v).toFixed(2).replace('.', ','))
  const txt = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const cols = ['Fecha', 'Tipo', 'Documento', 'Nº factura', 'Proveedor/Cliente', 'NIF', 'Concepto', 'Categoría',
    'Base', '% IVA', 'Cuota IVA', '% IRPF', 'Retención IRPF', 'Total', 'Estado', 'Archivo', 'Notas IA', 'Notas']
  const rows = [cols.map(txt).join(';')]

  const usados = new Set<string>()
  for (const d of lista) {
    let archivo = ''
    if (d.file_path) {
      const ext = d.file_path.split('.').pop()
      const base = `${d.issue_date}_${String(d.counterparty || 'sin-nombre').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '-').slice(0, 40)}_${num(d.total_amount) || '0'}`
      let nombre = `${d.direction === 'ingreso' ? 'ingresos' : d.direction === 'gasto' ? 'gastos' : 'otros'}/${base}.${ext}`
      for (let i = 2; usados.has(nombre); i++) nombre = nombre.replace(/(\.\w+)$/, `-${i}$1`)
      usados.add(nombre)
      const { data: blob } = await supabaseAdmin.storage.from(BUCKET).download(d.file_path)
      if (blob) {
        zip.file(nombre, Buffer.from(await blob.arrayBuffer()))
        archivo = nombre
      }
    }
    rows.push([
      txt(d.issue_date), txt(d.direction), txt(d.doc_type), txt(d.invoice_number), txt(d.counterparty),
      txt(d.counterparty_nif), txt(d.concept), txt(d.category), num(d.base_amount), num(d.vat_rate),
      num(d.vat_amount), num(d.irpf_rate), num(d.irpf_amount), num(d.total_amount), txt(d.status),
      txt(archivo), txt(d.ai_notes), txt(d.notes),
    ].join(';'))
  }
  // BOM + ";" para que Excel en español lo abra con columnas y acentos bien.
  zip.file('libro.csv', '﻿' + rows.join('\r\n'))

  const r = resumenFiscal(lista)
  const e = (v: number) => v.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
  zip.file('resumen.txt', [
    `GROUP 360 INICIATIVAS S.L. — B13911979`,
    `Documentación contable ${q}º trimestre ${year} (${from} a ${to})`,
    ``,
    `Documentos: ${lista.length}  (pendientes de revisar: ${r.pendientes_revision})`,
    `Ingresos — base: ${e(r.ingresos_base)} | total: ${e(r.ingresos_total)}`,
    `Gastos   — base: ${e(r.gastos_base)} | total: ${e(r.gastos_total)}`,
    `IVA repercutido: ${e(r.iva_repercutido)}`,
    `IVA soportado:   ${e(r.iva_soportado)}`,
    `Diferencia IVA (orientativa): ${e(r.iva_resultado)}`,
    `Retenciones IRPF practicadas a proveedores: ${e(r.irpf_retenido_proveedores)}`,
    ``,
    `Datos extraídos automáticamente y revisados en el panel. Cifras orientativas;`,
    `la liquidación oficial corresponde a la gestoría.`,
  ].join('\r\n'))

  const content = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })

  if (sp.get('marcar') && lista.length) {
    await supabaseAdmin.from('accounting_documents').update({ status: 'enviado_gestoria' })
      .in('id', lista.map(d => d.id))
  }

  return new NextResponse(content as any, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="GROUP360_contabilidad_${year}_T${q}.zip"`,
    },
  })
}
