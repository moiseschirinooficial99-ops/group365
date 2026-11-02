'use client'
import { useEffect } from 'react'
import { captureAttribution } from '@/lib/attribution'

// Apunta de qué campaña llega la visita (UTM / clic en anuncio). No pinta nada.
export default function AttributionCapture() {
  useEffect(() => { captureAttribution() }, [])
  return null
}
