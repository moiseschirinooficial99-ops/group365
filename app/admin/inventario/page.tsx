'use client'
import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Pencil, Search, ArrowLeft, Home, Filter } from 'lucide-react'

const STATUS_BADGE: Record<string, string> = {
  disponible:  'bg-green-500/15 text-green-400 border-green-500/30',
  negociacion: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  reservada:   'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  vendida:     'bg-red-500/15 text-red-400 border-red-500/30',
}

const CHANNEL_LABEL: Record<string, string> = {
  personal:   'Venta',
  alquiler:   'Alquiler',
  bancaria:   'Inversión',
  alquiler_turistico: 'Alquiler',
}

const CHANNEL_BADGE: Record<string, string> = {
  personal: 'bg-[#C9A84C]/10 text-[#C9A84C] border-[#C9A84C]/30',
  alquiler: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  bancaria: 'bg-[#1B7F6F]/10 text-[#1B7F6F] border-[#1B7F6F]/30',
  alquiler_turistico: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
}

type FilterType = 'todos' | 'personal' | 'alquiler' | 'bancaria'

export default function InventarioPage() {
  const [props, setProps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<FilterType>('todos')
  const [filterStatus, setFilterStatus] = useState('todos')

  useEffect(() => {
    const load = async () => {
      const [activeRes, soldRes] = await Promise.all([
        fetch('/api/properties').then(r => r.json()).catch(() => []),
        fetch('/api/properties?success=true').then(r => r.json()).catch(() => []),
      ])
      const active: any[] = Array.isArray(activeRes) ? activeRes : []
      const sold: any[] = Array.isArray(soldRes) ? soldRes : []
      const soldIds = new Set(sold.map((p: any) => p.id))
      const merged = [...active, ...sold.filter((p: any) => !active.some((a: any) => a.id === p.id))]
      setProps(merged)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    return props.filter(p => {
      const ch = p.channel || 'personal'
      const normalizedCh = ch === 'alquiler_turistico' ? 'alquiler' : ch
      if (filterType !== 'todos' && normalizedCh !== filterType) return false
      if (filterStatus !== 'todos' && (p.status || 'disponible') !== filterStatus) return false
      if (search) {
        const q = search.toLowerCase()
        return (p.title || '').toLowerCase().includes(q) || (p.location || '').toLowerCase().includes(q)
      }
      return true
    })
  }, [props, filterType, filterStatus, search])

  const getPrice = (p: any) => {
    const ch = p.channel || 'personal'
    if (ch === 'alquiler' || ch === 'alquiler_turistico') {
      if (p.price_per_night) return `€${Number(p.price_per_night).toLocaleString('es-ES')}/noche`
      if (p.price_high_season) return `☀️ €${Number(p.price_high_season).toLocaleString('es-ES')}/noche`
    }
    if (p.price && Number(p.price) > 0) return `€${Number(p.price).toLocaleString('es-ES')}`
    return 'A consultar'
  }

  const FILTER_TABS: { value: FilterType; label: string }[] = [
    { value: 'todos', label: 'Todos' },
    { value: 'personal', label: 'Venta' },
    { value: 'alquiler', label: 'Alquiler' },
    { value: 'bancaria', label: 'Inversión' },
  ]

  return (
    <main className="min-h-screen bg-[#0F1419] px-4 py-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="flex items-center gap-1.5 text-[#8B96A5] hover:text-white text-sm transition-colors">
              <ArrowLeft size={14} /> Panel
            </Link>
            <h1 className="font-playfair text-2xl font-bold">
              <span className="text-[#1B7F6F]">Inventario</span> <span className="text-[#C9A84C]">Maestro</span>
            </h1>
            <span className="text-[#8B96A5] text-sm">{filtered.length} propiedades</span>
          </div>
          <Link href="/admin/nueva-propiedad" className="btn-primary text-sm px-5 py-2.5">
            + Nueva propiedad
          </Link>
        </div>

        {/* Filtros */}
        <div className="card p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Búsqueda */}
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B96A5]" />
              <input
                className="input pl-9 py-2 text-sm"
                placeholder="Buscar por título o ubicación..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Tipo */}
            <div className="flex gap-1 bg-[#0F1419] rounded-lg p-1">
              {FILTER_TABS.map(t => (
                <button key={t.value} onClick={() => setFilterType(t.value)}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${filterType === t.value ? 'bg-[#C9A84C] text-[#0F1419]' : 'text-[#8B96A5] hover:text-white'}`}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Estado */}
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="input py-2 text-sm w-40"
            >
              <option value="todos">Todos los estados</option>
              <option value="disponible">Disponible</option>
              <option value="negociacion">En Negociación</option>
              <option value="reservada">Reservada</option>
              <option value="vendida">Vendida</option>
            </select>
          </div>
        </div>

        {/* Tabla */}
        {loading ? (
          <div className="card p-16 text-center text-[#8B96A5]">Cargando inventario...</div>
        ) : filtered.length === 0 ? (
          <div className="card p-16 text-center">
            <Home size={40} className="text-[#8B96A5] mx-auto mb-4 opacity-30" />
            <p className="text-[#8B96A5]">No hay propiedades con estos filtros.</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-left text-[#8B96A5] text-xs">
                    <th className="p-4 w-14">Foto</th>
                    <th className="p-4">Título</th>
                    <th className="p-4">Tipo</th>
                    <th className="p-4">Precio</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4">Ubicación</th>
                    <th className="p-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => {
                    const ch = p.channel || 'personal'
                    const st = p.status || 'disponible'
                    return (
                      <motion.tr
                        key={p.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-b border-white/5 hover:bg-[#161D26] transition-colors"
                      >
                        <td className="p-4">
                          <div className="w-12 h-10 rounded-lg overflow-hidden bg-[#161D26] flex-shrink-0">
                            <img
                              src={p.main_image || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=200'}
                              alt=""
                              className={`w-full h-full object-cover ${st === 'vendida' ? 'opacity-40' : ''}`}
                            />
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="text-white font-medium text-xs truncate max-w-[200px]">{p.title}</p>
                          {p.bedrooms && <p className="text-[#8B96A5] text-[10px] mt-0.5">{p.bedrooms}hab · {p.bathrooms}baños{p.area_sqm ? ` · ${p.area_sqm}m²` : ''}</p>}
                        </td>
                        <td className="p-4">
                          <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${CHANNEL_BADGE[ch] || CHANNEL_BADGE.personal}`}>
                            {CHANNEL_LABEL[ch] || ch}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`text-xs font-bold ${st === 'vendida' && p.sold_price ? 'text-red-400' : 'text-[#C9A84C]'}`}>
                            {st === 'vendida' && p.sold_price
                              ? `Vendida: €${Number(p.sold_price).toLocaleString('es-ES')}`
                              : getPrice(p)}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${STATUS_BADGE[st] || STATUS_BADGE.disponible}`}>
                            {st.charAt(0).toUpperCase() + st.slice(1)}
                          </span>
                        </td>
                        <td className="p-4 text-[#8B96A5] text-xs max-w-[160px]">
                          <span className="truncate block">{p.location || '—'}</span>
                        </td>
                        <td className="p-4 text-right">
                          <Link
                            href={`/admin/editar-propiedad/${p.id}`}
                            className="inline-flex items-center gap-1 text-[10px] px-3 py-1.5 rounded-lg bg-[#C9A84C]/15 text-[#C9A84C] border border-[#C9A84C]/30 hover:bg-[#C9A84C]/25 transition-colors"
                          >
                            <Pencil size={10} /> Editar
                          </Link>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
