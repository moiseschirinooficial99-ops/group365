'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Phone, MessageSquare, Flame, RefreshCw } from 'lucide-react'

interface Conversation {
  phone: string
  last_message: string
  last_message_at: string
  last_direction: 'inbound' | 'outbound'
  total_messages: number
  unread_count: number
  lead?: { name?: string; scoring_result?: number; status?: string } | null
}

interface Message {
  id: string
  phone: string
  message: string
  direction: 'inbound' | 'outbound'
  created_at: string
  is_read: boolean
  status?: string | null
}

// Acuse de entrega de WhatsApp para mensajes salientes.
function deliveryMark(status?: string | null) {
  switch (status) {
    case 'failed': return { icon: '⚠ no entregado', cls: 'text-red-300' }
    case 'read': return { icon: '✓✓ leído', cls: 'text-sky-300' }
    case 'delivered': return { icon: '✓✓ entregado', cls: '' }
    case 'sent': return { icon: '✓ enviado', cls: '' }
    default: return { icon: '✓✓', cls: '' }
  }
}

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return 'ahora'
  if (s < 3600) return `hace ${Math.floor(s / 60)}min`
  if (s < 86400) return `hace ${Math.floor(s / 3600)}h`
  if (s < 604800) return `hace ${Math.floor(s / 86400)}d`
  return new Date(date).toLocaleDateString('es-ES')
}

function formatPhone(phone: string) {
  const d = phone.replace(/\D/g, '')
  if (d.length >= 11 && d.startsWith('34')) {
    const n = d.slice(2)
    return `+34 ${n.slice(0, 3)} ${n.slice(3, 5)} ${n.slice(5, 7)} ${n.slice(7, 9)}`
  }
  return `+${d}`
}

function scoreMeta(score?: number | null) {
  if (!score) return { dot: 'bg-gray-600', badge: 'text-gray-400 bg-gray-900/20 border-gray-500/30', label: 'Frío' }
  if (score >= 70) return { dot: 'bg-red-500', badge: 'text-red-400 bg-red-900/20 border-red-500/30', label: 'Caliente' }
  if (score >= 40) return { dot: 'bg-yellow-500', badge: 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30', label: 'Interesado' }
  return { dot: 'bg-gray-600', badge: 'text-gray-400 bg-gray-900/20 border-gray-500/30', label: 'Frío' }
}

export default function MensajesAdmin() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'hot' | 'new' | 'today'>('all')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [markingHot, setMarkingHot] = useState(false)
  const [totalUnread, setTotalUnread] = useState(0)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<string | null>(null)
  const prevUnreadRef = useRef(0)
  selectedRef.current = selected

  const loadConversations = useCallback(async (quiet = false) => {
    if (!quiet) setRefreshing(true)
    try {
      const res = await fetch('/api/admin/wa-conversations')
      const data: Conversation[] = await res.json()
      const list = Array.isArray(data) ? data : []
      setConversations(list)

      const unread = list.reduce((s, c) => s + (c.unread_count || 0), 0)
      setTotalUnread(unread)

      if (unread > prevUnreadRef.current && prevUnreadRef.current > 0 && typeof window !== 'undefined') {
        if (Notification.permission === 'granted') {
          new Notification('Nuevo mensaje WhatsApp', {
            body: `Tienes ${unread} mensaje${unread !== 1 ? 's' : ''} sin leer`,
            icon: '/logo.png',
          })
        }
      }
      prevUnreadRef.current = unread
      document.title = unread > 0 ? `(${unread}) Mensajes — GROUP 360` : 'Mensajes — GROUP 360'
    } catch {}
    finally { setLoading(false); setRefreshing(false) }
  }, [])

  const loadMessages = useCallback(async (phone: string) => {
    try {
      const res = await fetch(`/api/admin/wa-conversations?phone=${encodeURIComponent(phone)}`)
      const data: Message[] = await res.json()
      if (Array.isArray(data)) setMessages(data)
    } catch {}
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    loadConversations()
  }, [loadConversations])

  // Auto-refresh every 15 s
  useEffect(() => {
    const id = setInterval(async () => {
      await loadConversations(true)
      if (selectedRef.current) loadMessages(selectedRef.current)
    }, 15000)
    return () => clearInterval(id)
  }, [loadConversations, loadMessages])

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function selectConversation(phone: string) {
    setSelected(phone)
    setConversations(prev =>
      prev.map(c => (c.phone === phone ? { ...c, unread_count: 0 } : c))
    )
    setTotalUnread(prev => {
      const conv = conversations.find(c => c.phone === phone)
      return Math.max(0, prev - (conv?.unread_count || 0))
    })
    await loadMessages(phone)
    fetch('/api/admin/wa-conversations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, action: 'mark_read' }),
    }).catch(() => {})
  }

  async function markHot() {
    if (!selected) return
    setMarkingHot(true)
    await fetch('/api/admin/wa-conversations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: selected, action: 'mark_hot' }),
    }).catch(() => {})
    setMarkingHot(false)
    loadConversations(true)
  }

  // Filters
  const now = Date.now()
  const twoHoursAgo = now - 2 * 60 * 60 * 1000
  const startOfDay = new Date().setHours(0, 0, 0, 0)

  const filtered = conversations.filter(c => {
    const t = new Date(c.last_message_at).getTime()
    if (filter === 'hot') return (c.lead?.scoring_result || 0) >= 70
    if (filter === 'new') return t >= twoHoursAgo
    if (filter === 'today') return t >= startOfDay
    return true
  })

  const selectedConv = conversations.find(c => c.phone === selected)

  return (
    <main className="h-screen bg-[#0F1419] flex flex-col overflow-hidden">

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-b border-white/5 bg-[#161D26] px-5 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-[#8B96A5] hover:text-white transition-colors">
            <ArrowLeft size={17} />
          </Link>
          <h1 className="font-playfair text-lg font-bold text-white">
            Mensajes <span className="text-[#1B7F6F]">WhatsApp</span>
            <span className="text-white/30 text-sm ml-2">en tiempo real</span>
          </h1>
          {totalUnread > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {totalUnread} nuevo{totalUnread !== 1 ? 's' : ''}
            </span>
          )}
          <button
            onClick={() => loadConversations()}
            className={`text-[#8B96A5] hover:text-white transition-colors ml-1 ${refreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-1 bg-[#0F1419] rounded-lg p-1">
          {([
            { id: 'all', label: 'Todos' },
            { id: 'hot', label: '🔥 Calientes' },
            { id: 'new', label: '🆕 Nuevos' },
            { id: 'today', label: 'Hoy' },
          ] as const).map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                filter === f.id ? 'bg-[#C9A84C] text-[#0F1419]' : 'text-[#8B96A5] hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left: conversation list ──────────────────────────── */}
        <div className="w-72 flex-shrink-0 border-r border-white/5 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-[#8B96A5] text-sm">
              Cargando…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-[#8B96A5] text-sm gap-2">
              <MessageSquare size={22} className="opacity-20" />
              Sin conversaciones
            </div>
          ) : (
            filtered.map(conv => {
              const score = conv.lead?.scoring_result
              const { dot, badge } = scoreMeta(score)
              const isRecent = new Date(conv.last_message_at).getTime() >= twoHoursAgo
              const isSelected = selected === conv.phone

              return (
                <button
                  key={conv.phone}
                  onClick={() => selectConversation(conv.phone)}
                  className={`w-full text-left px-4 py-3.5 border-b border-white/5 transition-all hover:bg-[#161D26] ${
                    isSelected ? 'bg-[#161D26] border-l-2 border-l-[#1B7F6F]' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-9 h-9 rounded-full bg-[#1B7F6F]/15 border border-[#1B7F6F]/25 flex items-center justify-center text-[#1B7F6F] font-bold text-xs">
                        {conv.phone.slice(-2)}
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0F1419] ${
                          isRecent && conv.last_direction === 'inbound' ? 'bg-green-400' : dot
                        }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-white text-xs font-semibold truncate">
                          {conv.lead?.name || formatPhone(conv.phone)}
                        </span>
                        <span className="text-[#8B96A5] text-[9px] flex-shrink-0">
                          {timeAgo(conv.last_message_at)}
                        </span>
                      </div>

                      <p className="text-[#8B96A5] text-[11px] truncate leading-snug">
                        {conv.last_direction === 'outbound' ? '🤖 ' : ''}
                        {(conv.last_message || '').slice(0, 42)}
                        {(conv.last_message || '').length > 42 ? '…' : ''}
                      </p>

                      <div className="flex items-center gap-1.5 mt-1.5">
                        {score != null && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${badge}`}>
                            {score}%
                          </span>
                        )}
                        {conv.unread_count > 0 && (
                          <span className="ml-auto bg-[#1B7F6F] text-white text-[9px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center">
                            {conv.unread_count > 9 ? '9+' : conv.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* ── Right: chat view ────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-[#8B96A5] gap-3">
              <MessageSquare size={44} className="opacity-10" />
              <p className="text-base">Selecciona una conversación</p>
              <p className="text-xs opacity-50">
                {conversations.length} conversación{conversations.length !== 1 ? 'es' : ''} en total
              </p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex-shrink-0 border-b border-white/5 bg-[#161D26] px-5 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#1B7F6F]/15 border border-[#1B7F6F]/25 flex items-center justify-center text-[#1B7F6F] font-bold text-xs">
                    {selected.slice(-2)}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">
                      {selectedConv?.lead?.name || formatPhone(selected)}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[#8B96A5] text-[11px]">{formatPhone(selected)}</span>
                      {selectedConv?.lead?.scoring_result != null && (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${
                            scoreMeta(selectedConv.lead.scoring_result).badge
                          }`}
                        >
                          Score {selectedConv.lead.scoring_result}%
                        </span>
                      )}
                      <span className="text-[#8B96A5] text-[10px]">
                        · {messages.length} mensajes
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap justify-end">
                  <a
                    href={`tel:+${selected.replace(/\D/g, '')}`}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#1B7F6F]/10 border border-[#1B7F6F]/25 text-[#1B7F6F] hover:bg-[#1B7F6F]/20 transition-colors"
                  >
                    <Phone size={12} /> Llamar
                  </a>
                  <a
                    href={`https://wa.me/${selected.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#1B7F6F]/10 border border-[#1B7F6F]/25 text-[#1B7F6F] hover:bg-[#1B7F6F]/20 transition-colors"
                  >
                    <MessageSquare size={12} /> WhatsApp
                  </a>
                  <button
                    onClick={markHot}
                    disabled={markingHot}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-40"
                  >
                    <Flame size={12} /> {markingHot ? 'Guardando…' : 'Marcar caliente'}
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.length === 0 ? (
                  <p className="text-center text-[#8B96A5] text-sm mt-8">Sin mensajes</p>
                ) : (
                  messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[72%] rounded-2xl px-4 py-2.5 ${
                          msg.direction === 'outbound'
                            ? 'bg-[#1B7F6F] text-white rounded-br-sm'
                            : 'bg-[#161D26] text-white border border-white/5 rounded-bl-sm'
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {msg.message}
                        </p>
                        <p
                          className={`text-[10px] mt-1 ${
                            msg.direction === 'outbound'
                              ? 'text-white/50 text-right'
                              : 'text-[#8B96A5]'
                          }`}
                        >
                          {new Date(msg.created_at).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {msg.direction === 'outbound' && (
                            <span className={`ml-1 opacity-70 ${deliveryMark(msg.status).cls}`}>
                              {deliveryMark(msg.status).icon}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
