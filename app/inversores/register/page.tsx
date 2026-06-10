'use client'
import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Header from '@/components/layout/Header'

const ZONES = ['Madrid', 'Barcelona', 'Costa del Sol', 'Valencia', 'Alicante', 'Marbella', 'Sevilla', 'Bilbao']
const TIMELINES = ['3-6 meses', '6-12 meses', '1-2 años', '+2 años']

export default function RegisterPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    budget_min: '', budget_max: '', expected_roi: '',
    preferred_zones: [] as string[], investment_timeline: '',
  })

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))
  const toggleZone = (z: string) => set('preferred_zones', form.preferred_zones.includes(z)
    ? form.preferred_zones.filter(x => x !== z)
    : [...form.preferred_zones, z])

  const goStep2 = () => {
    if (!form.name || !form.email || !form.password) {
      setError('Por favor rellena nombre, email y contraseña.')
      return
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    setError('')
    setStep(2)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { name: form.name },
          emailRedirectTo: `${window.location.origin}/inversores/dashboard`,
        },
      })
      if (signUpError) throw signUpError

      if (data.user) {
        // upsert handles both new and existing profiles
        await supabase.from('profiles').upsert({
          id: data.user.id,
          name: form.name,
          phone: form.phone,
          budget_min: Number(form.budget_min) || null,
          budget_max: Number(form.budget_max) || null,
          expected_roi: Number(form.expected_roi) || null,
          preferred_zones: form.preferred_zones,
          investment_timeline: form.investment_timeline,
        })

        await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name, email: form.email, phone: form.phone,
            budget_max: Number(form.budget_max), expected_roi: Number(form.expected_roi),
            preferred_zone: form.preferred_zones[0], investment_timeline: form.investment_timeline,
            source: 'inversores',
          }),
        })

        // If session exists → direct access. If not → email confirmation required.
        if (data.session) {
          router.push('/inversores/dashboard')
        } else {
          setEmailSent(true)
        }
      }
    } catch (e: any) {
      setError(e.message || 'Error al registrarse. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <main>
        <Header />
        <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-10">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="card p-10 w-full max-w-md text-center">
            <div className="w-16 h-16 rounded-full bg-[#1B7F6F]/15 border border-[#1B7F6F]/30 flex items-center justify-center mx-auto mb-6">
              <span className="text-[#1B7F6F] text-2xl">✓</span>
            </div>
            <h2 className="font-playfair text-2xl font-bold mb-3">Cuenta creada</h2>
            <p className="text-[#8B96A5] text-sm mb-2">
              Revisa tu email <span className="text-white font-medium">{form.email}</span>
            </p>
            <p className="text-[#8B96A5] text-sm mb-8">
              Haz clic en el enlace de confirmación para activar tu cuenta y acceder al dashboard.
            </p>
            <Link href="/inversores" className="btn-outline text-sm px-8 py-3 inline-block">
              Volver a inversores
            </Link>
          </motion.div>
        </div>
      </main>
    )
  }

  return (
    <main>
      <Header />
      <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="card p-8 w-full max-w-md">

          <div className="text-center mb-8">
            <h1 className="font-playfair text-2xl font-bold">
              <span className="green-text">GROUP</span> <span className="gold-text">360</span>
            </h1>
            <p className="text-[#8B96A5] text-sm mt-2">Portal exclusivo de inversores</p>
          </div>

          <div className="flex gap-2 mb-8">
            {[1, 2].map(s => (
              <div key={s} className={`h-0.5 flex-1 rounded-full transition-all duration-300 ${s <= step ? 'bg-[#C9A84C]' : 'bg-white/10'}`} />
            ))}
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg mb-5">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            {step === 1 && (
              <>
                <div>
                  <label className="text-xs text-[#8B96A5] block mb-1">Nombre completo</label>
                  <input className="input" placeholder="Tu nombre" required
                    value={form.name} onChange={e => set('name', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-[#8B96A5] block mb-1">Email</label>
                  <input className="input" type="email" placeholder="email@ejemplo.com" required
                    value={form.email} onChange={e => set('email', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-[#8B96A5] block mb-1">Contraseña (mín. 6 caracteres)</label>
                  <input className="input" type="password" placeholder="••••••••" required minLength={6}
                    value={form.password} onChange={e => set('password', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-[#8B96A5] block mb-1">WhatsApp</label>
                  <input className="input" type="tel" placeholder="+34 600 000 000"
                    value={form.phone} onChange={e => set('phone', e.target.value)} />
                </div>
                <button type="button" onClick={goStep2} className="btn-primary w-full py-3.5 mt-2">
                  Continuar
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#8B96A5] block mb-1">Presupuesto mín. €</label>
                    <input className="input" type="number" placeholder="50.000"
                      value={form.budget_min} onChange={e => set('budget_min', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-[#8B96A5] block mb-1">Presupuesto máx. €</label>
                    <input className="input" type="number" placeholder="300.000"
                      value={form.budget_max} onChange={e => set('budget_max', e.target.value)} />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-[#8B96A5] block mb-1">ROI mínimo esperado %</label>
                  <input className="input" type="number" placeholder="5" min="1" max="20"
                    value={form.expected_roi} onChange={e => set('expected_roi', e.target.value)} />
                </div>

                <div>
                  <label className="text-xs text-[#8B96A5] block mb-2">Zonas de interés</label>
                  <div className="flex flex-wrap gap-2">
                    {ZONES.map(z => (
                      <button key={z} type="button" onClick={() => toggleZone(z)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                          form.preferred_zones.includes(z)
                            ? 'bg-[#C9A84C] border-[#C9A84C] text-[#0F1419] font-bold'
                            : 'border-white/10 text-[#8B96A5] hover:border-[#C9A84C]/40'
                        }`}>
                        {z}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-[#8B96A5] block mb-1">Plazo de inversión</label>
                  <select className="input" value={form.investment_timeline} onChange={e => set('investment_timeline', e.target.value)}>
                    <option value="">Seleccionar...</option>
                    {TIMELINES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setStep(1); setError('') }}
                    className="btn-outline flex-1 py-3">Atrás</button>
                  <button type="submit" disabled={loading}
                    className="btn-primary flex-1 py-3">
                    {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                  </button>
                </div>
              </>
            )}
          </form>

          <p className="text-center text-[#8B96A5] text-xs mt-5">
            ¿Ya tienes cuenta?{' '}
            <Link href="/inversores/dashboard" className="text-[#C9A84C] hover:underline">Iniciar sesión</Link>
          </p>
        </motion.div>
      </div>
    </main>
  )
}
