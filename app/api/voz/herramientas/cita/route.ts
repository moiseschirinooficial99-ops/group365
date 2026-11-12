import { NextRequest, NextResponse } from 'next/server'
import { citasSolapadas, crearCita, duracionPorTipo, fmtFecha, parseFechaMadrid, siguienteHuecoLibre } from '@/lib/citas'
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

  const tipo = b.tipo === 'llamada' ? 'llamada' : 'visita'

  try {
    // No pisar otra cita: si la hora está cogida, proponer el siguiente hueco libre.
    const duracion = duracionPorTipo(tipo)
    if ((await citasSolapadas(inicio, duracion)).length > 0) {
      const hueco = await siguienteHuecoLibre(inicio, duracion)
      return NextResponse.json({
        resultado: hueco
          ? `Esa hora ya está ocupada. El siguiente hueco libre ese día es ${fmtFecha(hueco)}. Propónselo; si no le va bien, pide otro día. No confirmes nada hasta guardarla.`
          : 'Ese día ya no quedan huecos a partir de esa hora. Propón otro día. No confirmes nada hasta guardarla.',
      })
    }

    const cita = await crearCita({
      name: nombre,
      starts_at: inicio,
      kind: tipo,
      phone: telefonoE164(String(b.telefono || '')),
      property_id: b.propiedad_id ? String(b.propiedad_id) : null,
      notes: [b.notas && String(b.notas).slice(0, 300), 'Agendada por Alejandra (voz)'].filter(Boolean).join(' · '),
      source: 'voz',
    })
    return NextResponse.json({ resultado: `Cita guardada para ${fmtFecha(cita.starts_at)}. Confírmalo en voz alta con el día y la hora.` })
  } catch (e: any) {
    console.error('VOZ cita:', e.message)
    return NextResponse.json({ resultado: 'No se pudo guardar la cita. Di que un asesor le escribe por WhatsApp para confirmarla.' })
  }
}
