'use client'
import { useEffect, useState } from 'react'
import { Phone, Check } from 'lucide-react'

// Botón "Llámame ahora" de la ficha: Alejandro llama en segundos.
export default function LlamameAhora({ propiedadId }: { propiedadId?: string }) {
  const [abierto, setAbierto] = useState(false)
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [acepta, setAcepta] = useState(false)
  const [estado, setEstado] = useState<'idle' | 'enviando' | 'llamando' | 'error'>('idle')
  const [mensaje, setMensaje] = useState('')
  const [segundos, setSegundos] = useState(0)

  useEffect(() => {
    if (estado !== 'llamando') return
    const t = setInterval(() => setSegundos(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [estado])

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setEstado('enviando'); setMensaje('')
    const res = await fetch('/api/voz/llamame', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, telefono, acepta, propiedad_id: propiedadId, website: '' }),
    }).catch(() => null)
    const data = await res?.json().catch(() => ({}))
    if (res?.ok) { setSegundos(0); setEstado('llamando') }
    else { setEstado('error'); setMensaje(data?.error || 'No se pudo enviar. Prueba por WhatsApp.') }
  }

  if (estado === 'llamando') {
    return (
      <div className="mt-3 w-full py-4 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/30 text-center">
        <p className="text-[#C9A84C] font-medium flex items-center justify-center gap-2"><Check size={16} /> Te estamos llamando</p>
        <p className="text-white text-3xl font-semibold tabular-nums mt-1">{segundos}s</p>
        <p className="text-[#8B96A5] text-xs mt-1">Ten el móvil a mano: te llama Alejandro, el asistente virtual de GROUP 360.</p>
      </div>
    )
  }

  if (!abierto) {
    return (
      <button onClick={() => setAbierto(true)}
        className="mt-3 flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-[#C9A84C] text-black font-medium hover:brightness-110 transition-all">
        <Phone size={16} /> Llámame ahora
      </button>
    )
  }

  return (
    <form onSubmit={enviar} className="mt-3 w-full p-4 rounded-xl border border-white/10 bg-white/5 space-y-3">
      <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Tu nombre" required maxLength={60}
        className="w-full px-3 py-2.5 rounded-lg bg-black/40 border border-white/10 text-white text-sm" />
      <input value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="Tu móvil (ej. 612 345 678)" required inputMode="tel"
        className="w-full px-3 py-2.5 rounded-lg bg-black/40 border border-white/10 text-white text-sm" />
      <label className="flex items-start gap-2 text-xs text-[#8B96A5]">
        <input type="checkbox" checked={acepta} onChange={e => setAcepta(e.target.checked)} required className="mt-0.5" />
        Acepto que GROUP 360 me llame ahora por este piso. Me atenderá un asistente virtual.
      </label>
      {mensaje && <p className="text-red-400 text-xs">{mensaje}</p>}
      <button type="submit" disabled={estado === 'enviando'}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#C9A84C] text-black font-medium disabled:opacity-60">
        <Phone size={16} /> {estado === 'enviando' ? 'Conectando…' : 'Que me llamen ahora'}
      </button>
    </form>
  )
}
