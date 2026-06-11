'use client'
import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Header from '@/components/layout/Header'

export default function LoginPage() {
  const supabase = createClientComponentClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError('Credenciales incorrectas. Revisa tu email y contraseña.')
      setLoading(false)
      return
    }

    // Full reload so middleware/server reads the new session cookie
    window.location.href = '/inversores/dashboard'
  }

  return (
    <main className="bg-[#0F1419] min-h-screen">
      <Header />
      <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-8 w-full max-w-sm"
        >
          <div className="text-center mb-8">
            <h1 className="font-playfair text-2xl font-bold">
              <span className="green-text">GROUP</span> <span className="gold-text">360</span>
            </h1>
            <p className="text-[#8B96A5] text-sm mt-2">Accede a tu portal de inversiones</p>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs text-[#8B96A5] block mb-1.5">Email</label>
              <input
                className="input"
                type="email"
                placeholder="email@ejemplo.com"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-[#8B96A5] block mb-1.5">Contraseña</label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 mt-2 disabled:opacity-60"
            >
              {loading ? 'Entrando...' : 'Acceder al dashboard'}
            </button>
          </form>

          <p className="text-center text-[#8B96A5] text-xs mt-6">
            ¿No tienes cuenta?{' '}
            <Link href="/inversores/register" className="text-[#C9A84C] hover:underline">
              Regístrate gratis
            </Link>
          </p>
          <p className="text-center text-[#8B96A5] text-xs mt-2">
            <Link href="/inversores" className="hover:text-white transition-colors">
              ← Volver a inversores
            </Link>
          </p>
        </motion.div>
      </div>
    </main>
  )
}
