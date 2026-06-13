'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const router = useRouter()
  const [pwd, setPwd] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pwd }),
    })
    if (res.ok) {
      router.push('/admin')
    } else {
      const { error: msg } = await res.json()
      setError(msg || 'Contraseña incorrecta')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-[#0F1419] flex items-center justify-center px-4">
      <div className="card p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="font-playfair text-2xl font-bold mb-1">
            <span className="text-[#1B7F6F]">GROUP</span>
            <span className="bg-gradient-to-r from-[#C9A84C] to-[#E8D5A3] bg-clip-text text-transparent"> 360</span>
          </div>
          <p className="text-[#8B96A5] text-sm">Panel de Administración</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs text-[#8B96A5] uppercase tracking-wider block mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              className="input w-full"
              placeholder="••••••••"
              value={pwd}
              onChange={e => setPwd(e.target.value)}
              autoFocus
              required
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button type="submit" disabled={loading}
            className="btn-primary w-full py-3 text-sm">
            {loading ? 'Entrando...' : 'Acceder'}
          </button>
        </form>
      </div>
    </main>
  )
}
