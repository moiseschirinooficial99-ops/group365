import { NextRequest, NextResponse } from 'next/server'
import { crearCita, fmtFecha, parseFechaMadrid } from '@/lib/citas'
import { noAutorizado, telefonoE164, vozAutorizada } from '@/lib/voz'

// Herramienta "agendar_cita" del agente de voz: crea la cita en /admin/agenda y avisa por Telegram.
export async function POST(req: NextRequest) {
  if (!vozAutorizada(req)) return noAutorizado()
  const b = await req.json().catch(() => ({})) as Record<string, any>

  const nombre = String(b.nombre || '').trim().slice(0, 60)
  const inicio = parseFechaMadrid(String(b.fecha || ''), String(b.hora || ''))
  if (!nombre || !inicio) {
    return NextResponse.json({ resultado: 'Faltan el nombre o una fecha y hora válidas (fecha dd/mm, hora hh:mm). Pídelas de nuevo.' })
  }
  if (new Date(inicio).getTime() < Date.now()) {
    return NextResponse.json({ resultado: 'Esa fecha ya ha pasado. Propón otro día.' })
  }

  try {
    const cita = await crearCita({
      name: nombre,
      starts_at: inicio,
      kind: b.tipo === 'llamada' ? 'llamada' : 'visita',
      phone: telefonoE164(String(b.telefono || '')),
      property_id: b.propiedad_id ? String(b.propiedad_id) : null,
      notes: [b.notas && String(b.notas).slice(0, 300), 'Agendada por Alejandro (voz)'].filter(Boolean).join(' · '),
      source: 'voz',
    })
    return NextResponse.json({ resultado: `Cita guardada para ${fmtFecha(cita.starts_at)}. Confírmalo en voz alta con el día y la hora.` })
  } catch (e: any) {
    console.error('VOZ cita:', e.message)
    return NextResponse.json({ resultado: 'No se pudo guardar la cita. Di que un asesor le escribe por WhatsApp para confirmarla.' })
  }
}
