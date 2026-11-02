'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getConsent, setConsent, onConsentChange, hasTrackingPixels } from '@/lib/consent'

// Aviso de cookies: solo aparece si hay algún píxel configurado y el
// usuario aún no ha elegido. Aceptar y rechazar tienen el mismo peso.
export default function CookieBanner() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!hasTrackingPixels) return
    setOpen(getConsent() === null)
    return onConsentChange(v => setOpen(v === null))
  }, [])

  if (!open) return null

  return (
    <div role="dialog" aria-live="polite" aria-label="Aviso de cookies"
      className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-xl rounded-lg border border-white/10 bg-[#161D26]/95 p-4 shadow-2xl backdrop-blur md:inset-x-auto md:right-4">
      <p className="text-sm text-[#C5CCD6] leading-relaxed">
        Usamos cookies propias y de terceros (Google, Meta, TikTok) para medir visitas y mejorar nuestros anuncios.
        Solo se activan si las aceptas. <Link href="/cookies" className="text-[#C9A84C] underline">Más información</Link>
      </p>
      <div className="mt-3 flex gap-2">
        <button onClick={() => setConsent('denied')}
          className="flex-1 rounded-sm border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/5 transition-colors">
          Rechazar
        </button>
        <button onClick={() => setConsent('granted')}
          className="flex-1 btn-primary text-sm px-4 py-2">
          Aceptar
        </button>
      </div>
    </div>
  )
}
