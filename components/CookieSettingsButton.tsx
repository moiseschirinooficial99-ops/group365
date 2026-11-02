'use client'
import { useEffect, useState } from 'react'
import { getConsent, setConsent, onConsentChange, type Consent } from '@/lib/consent'

const LABEL: Record<string, string> = {
  granted: 'Has aceptado las cookies de análisis y publicidad.',
  denied: 'Has rechazado las cookies de análisis y publicidad.',
  none: 'Aún no has elegido.',
}

export default function CookieSettingsButton() {
  const [c, setC] = useState<Consent>(null)
  useEffect(() => {
    setC(getConsent())
    return onConsentChange(setC)
  }, [])

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
      <p className="text-sm mb-3">{LABEL[c || 'none']}</p>
      <div className="flex gap-2">
        <button onClick={() => setConsent('denied')}
          className="rounded-sm border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/5">Rechazar</button>
        <button onClick={() => setConsent('granted')} className="btn-primary text-sm px-4 py-2">Aceptar</button>
      </div>
    </div>
  )
}
