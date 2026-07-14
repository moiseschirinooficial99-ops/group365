// ═══════════════════════════════════════════════════════
// GENERADOR DE PDF DE CONTRATOS — GROUP 360 INICIATIVAS
// Usa pdf-lib (JS puro, compatible con serverless de Vercel).
// Renderiza el texto del contrato con la cabecera de marca.
// ═══════════════════════════════════════════════════════
import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'pdf-lib'
import { getContractType, renderPlantilla } from './contracts'
import { config } from './config'

// Paleta GROUP 360
const ESMERALDA = rgb(0x1f / 255, 0xa6 / 255, 0x7a / 255) // #1FA67A
const ORO = rgb(0xc9 / 255, 0xa6 / 255, 0x4e / 255)       // #C9A64E
const NEGRO = rgb(0x0a / 255, 0x0a / 255, 0x0a / 255)     // #0A0A0A
const GRIS = rgb(0.35, 0.35, 0.35)

const A4 = { w: 595.28, h: 841.89 }
const MARGIN = 56
const CONTENT_W = A4.w - MARGIN * 2

// Parte líneas largas para que quepan en el ancho de contenido.
function wrapLine(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  if (text.trim() === '') return ['']
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (font.widthOfTextAtSize(test, size) > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  return lines
}

export interface GenerateContractInput {
  tipo: string
  datos: Record<string, any>
}

export async function generateContractPdf({ tipo, datos }: GenerateContractInput): Promise<Uint8Array> {
  const def = getContractType(tipo)
  if (!def) throw new Error(`Tipo de contrato desconocido: ${tipo}`)

  // Datos por defecto (ciudad de la empresa si el admin no la rellena)
  const datosFull = { ciudad: config.contacto.ciudad, ...datos }
  const cuerpo = renderPlantilla(datos.plantilla || def.plantilla, datosFull)

  const pdf = await PDFDocument.create()
  pdf.setTitle(`${def.nombre} — GROUP 360`)
  pdf.setAuthor(config.empresa.nombreCompleto)
  pdf.setCreator('GROUP 360 INICIATIVAS')

  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold)

  const bodySize = 10
  const lineHeight = 15

  let page = pdf.addPage([A4.w, A4.h])
  let y = A4.h

  const drawHeader = (p: PDFPage) => {
    // Banda superior de marca
    p.drawRectangle({ x: 0, y: A4.h - 90, width: A4.w, height: 90, color: NEGRO })
    p.drawText('GROUP', { x: MARGIN, y: A4.h - 48, size: 20, font: fontBold, color: ESMERALDA })
    p.drawText('360', { x: MARGIN + fontBold.widthOfTextAtSize('GROUP ', 20), y: A4.h - 48, size: 20, font: fontBold, color: ORO })
    p.drawText('INICIATIVAS', { x: MARGIN, y: A4.h - 66, size: 8, font: fontRegular, color: rgb(1, 1, 1) })
    p.drawText(config.contacto.email, { x: A4.w - MARGIN - fontRegular.widthOfTextAtSize(config.contacto.email, 8), y: A4.h - 48, size: 8, font: fontRegular, color: rgb(0.8, 0.8, 0.8) })
    p.drawText(config.contacto.web.replace('https://', ''), { x: A4.w - MARGIN - fontRegular.widthOfTextAtSize(config.contacto.web.replace('https://', ''), 8), y: A4.h - 60, size: 8, font: fontRegular, color: rgb(0.8, 0.8, 0.8) })
    // Línea dorada
    p.drawRectangle({ x: 0, y: A4.h - 93, width: A4.w, height: 3, color: ORO })
  }

  const drawFooter = (p: PDFPage) => {
    p.drawRectangle({ x: 0, y: 0, width: A4.w, height: 28, color: NEGRO })
    const foot = `${config.empresa.nombreCompleto} · NIF ${config.empresa.nif} · ${config.contacto.direccion}, ${config.contacto.ciudad}`
    p.drawText(foot, { x: MARGIN, y: 10, size: 7, font: fontRegular, color: rgb(0.7, 0.7, 0.7) })
  }

  drawHeader(page)
  drawFooter(page)
  y = A4.h - 120

  const newPage = () => {
    page = pdf.addPage([A4.w, A4.h])
    drawHeader(page)
    drawFooter(page)
    y = A4.h - 120
  }

  // Cada línea del cuerpo: primera línea de un bloque se decide en negrita si es un encabezado.
  const rawLines = cuerpo.split('\n')
  for (let i = 0; i < rawLines.length; i++) {
    const raw = rawLines[i]
    // Detecta encabezados de cláusula / títulos para resaltar
    const isTitle = i === 0
    const isHeading = /^(REUNIDOS|EXPONEN|CLÁUSULAS|PRIMERA\.|SEGUNDA\.|TERCERA\.|CUARTA\.|QUINTA\.|SEXTA\.|SÉPTIMA\.|OCTAVA\.)/.test(raw.trim())
    const font = isTitle || isHeading ? fontBold : fontRegular
    const size = isTitle ? 15 : bodySize
    const color = isTitle ? NEGRO : isHeading ? ESMERALDA : rgb(0.12, 0.12, 0.12)
    const lh = isTitle ? 22 : lineHeight

    const wrapped = wrapLine(raw, font, size, CONTENT_W)
    for (const wl of wrapped) {
      if (y < 50) newPage()
      if (wl !== '') {
        page.drawText(wl, { x: MARGIN, y, size, font, color })
      }
      y -= lh
    }
    // Espacio extra tras el título
    if (isTitle) {
      page.drawRectangle({ x: MARGIN, y: y + 6, width: CONTENT_W, height: 1.5, color: ORO })
      y -= 10
    }
  }

  return pdf.save()
}

// Nombre de archivo sugerido para la descarga
export function contractFileName(tipo: string, datos: Record<string, any>): string {
  const def = getContractType(tipo)
  const base = (def?.id || 'contrato')
  const dest = (datos?.nombre_destinatario || '').toString().trim().replace(/\s+/g, '-').toLowerCase()
  const fecha = new Date().toISOString().slice(0, 10)
  return `${base}${dest ? '-' + dest : ''}-${fecha}.pdf`
}
