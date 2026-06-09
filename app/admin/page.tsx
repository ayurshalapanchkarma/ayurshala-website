'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import GlassBackground from '@/components/GlassBackground'
import { useTheme } from 'next-themes'

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'ayurshala2026'

type Booking = {
  id: number; booking_id: string; preferred_date: string; preferred_time: string
  booking_type: string; status: string; payment_method: string; created_at: string
  patient_name: string; patient_id: string; patient_phone: string; treatments: string
}

const statusConfig: Record<string, { label: string; cls: string }> = {
  CONFIRMED:            { label: 'Confirmed',    cls: 'bg-green-100 text-green-700' },
  PENDING_CONFIRMATION: { label: 'Pending',      cls: 'bg-amber-100 text-amber-700' },
  CANCELLED:            { label: 'Cancelled',    cls: 'bg-red-100 text-red-600' },
  COMPLETED:            { label: 'Completed',    cls: 'bg-blue-100 text-blue-700' },
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [pwError, setPwError] = useState('')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'PENDING_CONFIRMATION' | 'ALL'>('PENDING_CONFIRMATION')
  const [confirming, setConfirming] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState<string | null>(null)
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const dark = mounted && theme === 'dark'

  async function fetchBookings() {
    setLoading(true)
    const res = await fetch(`/api/admin/bookings?status=${filter}`)
    const { bookings: data } = await res.json()
    setBookings(data || [])
    setLoading(false)
  }

  useEffect(() => { if (authed) fetchBookings() }, [authed, filter])

  async function confirm(booking_id: string) {
    setConfirming(booking_id)
    await fetch('/api/admin/bookings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'confirm', booking_id }),
    })
    setBookings(prev => prev.map(b => b.booking_id === booking_id ? { ...b, status: 'CONFIRMED' } : b))
    setConfirming(null)
  }

  async function cancel(booking_id: string) {
    setCancelling(booking_id)
    await fetch('/api/admin/bookings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel', booking_id }),
    })
    setBookings(prev => prev.map(b => b.booking_id === booking_id ? { ...b, status: 'CANCELLED' } : b))
    setCancelling(null)
  }

  const bg = dark ? 'linear-gradient(135deg,#0a0f0a,#1a1008)' : 'linear-gradient(135deg,#fdf6ee,#ffecd2,#fff8f0)'
  const cardStyle = {
    background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.72)',
    backdropFilter: 'blur(40px) saturate(1.8)', WebkitBackdropFilter: 'blur(40px) saturate(1.8)',
    border: dark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(255,255,255,0.85)',
    boxShadow: dark ? '0 20px 80px rgba(232,98,26,0.08),0 4px 24px rgba(0,0,0,0.3)' : '0 20px 80px rgba(232,98,26,0.12),0 4px 24px rgba(0,0,0,0.08)',
  }

  if (!authed) return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background: bg }}>
      <GlassBackground />
      <div className="absolute top-[10%] left-[5%] w-[500px] h-[500px] rounded-full opacity-30 pointer-events-none animate-blob1"
        style={{ background: 'radial-gradient(circle,#4a7c59 0%,transparent 70%)' }} />
      <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] rounded-full opacity-25 pointer-events-none animate-blob2"
        style={{ background: 'radial-gradient(circle,#E8621A 0%,transparent 70%)' }} />

      <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.7, ease: [0.16,1,0.3,1] }}
        className="w-full max-w-sm rounded-3xl p-8 relative overflow-hidden" style={cardStyle}>
        <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% -10%,rgba(232,98,26,0.15) 0%,transparent 65%)' }} />

        <div className="text-center mb-8 relative">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, duration: 0.6 }}>
            <Image src="/ayurshala_text.png" alt="Ayurshala" width={200} height={56} className="object-contain h-14 w-auto mx-auto mb-4" />
          </motion.div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3" style={{ background: 'rgba(232,98,26,0.1)', border: '1px solid rgba(232,98,26,0.2)' }}>
            <span className="text-xs font-sans" style={{ color: '#E8621A' }}>🔐 Admin Portal</span>
          </div>
          <h1 className="font-serif text-2xl" style={{ color: dark ? '#f5f0e8' : '#1a1008' }}>Welcome Back</h1>
          <p className="font-sans text-xs text-stone-400 mt-1">Enter your password to continue</p>
        </div>

        <div className="relative mb-4">
          <input
            type={showPw ? 'text' : 'password'}
            value={pw}
            onChange={e => { setPw(e.target.value); setPwError('') }}
            onKeyDown={e => e.key === 'Enter' && (pw === ADMIN_PASSWORD ? setAuthed(true) : setPwError('Incorrect password'))}
            placeholder="Password"
            className={`w-full rounded-2xl px-4 py-3.5 font-sans text-sm bg-transparent placeholder-stone-400 focus:outline-none transition-colors border pr-12 ${dark ? 'text-stone-200 border-white/15 focus:border-brand/50' : 'text-stone-700 border-stone-200 focus:border-brand/50'}`}
          />
          <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 text-xs">
            {showPw ? '🙈' : '👁'}
          </button>
        </div>
        {pwError && <p className="font-sans text-xs text-red-400 mb-3 text-center">{pwError}</p>}

        <button onClick={() => pw === ADMIN_PASSWORD ? setAuthed(true) : setPwError('Incorrect password')}
          className="w-full py-3.5 rounded-2xl text-white font-sans text-sm font-medium transition-all"
          style={{ background: 'linear-gradient(135deg,#E8621A,#d4571a)', boxShadow: '0 4px 20px rgba(232,98,26,0.4)' }}>
          Enter Admin Portal →
        </button>
      </motion.div>
    </div>
  )

  const pendingCount = bookings.filter(b => b.status === 'PENDING_CONFIRMATION').length

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: bg }}>
      <GlassBackground />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle,#E8621A 0%,transparent 70%)', transform: 'translate(30%,-30%)' }} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 relative">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/"><Image src="/ayurshala_text.png" alt="Ayurshala" width={140} height={40} className="object-contain h-10 w-auto" /></Link>
            <div className="hidden sm:block h-6 w-px bg-stone-300/50" />
            <span className="hidden sm:block font-sans text-xs text-stone-400 uppercase tracking-widest">Admin</span>
          </div>
          <div className="flex items-center gap-2">
            {(['PENDING_CONFIRMATION', 'ALL'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="relative text-xs px-4 py-2 rounded-xl font-sans transition-all"
                style={filter === f
                  ? { background: '#E8621A', color: '#fff', boxShadow: '0 4px 12px rgba(232,98,26,0.4)' }
                  : { background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)', color: dark ? '#e7e5e4' : '#44403c', border: '1px solid rgba(232,98,26,0.15)' }}>
                {f === 'PENDING_CONFIRMATION' ? `Pending${pendingCount > 0 ? ` (${pendingCount})` : ''}` : 'All Bookings'}
              </button>
            ))}
            <button onClick={fetchBookings}
              className="text-xs px-3 py-2 rounded-xl font-sans transition-all"
              style={{ background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)', color: dark ? '#e7e5e4' : '#44403c', border: '1px solid rgba(232,98,26,0.15)' }}>
              ↻
            </button>
          </div>
        </motion.div>

        {loading && (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 rounded-full border-2 border-brand/30 border-t-brand animate-spin mb-3" style={{ borderTopColor: '#E8621A' }} />
            <p className="font-sans text-sm text-stone-400">Loading bookings…</p>
          </div>
        )}

        <AnimatePresence>
          <div className="space-y-3">
            {bookings.map((b, i) => {
              const cfg = statusConfig[b.status] || { label: b.status, cls: 'bg-stone-100 text-stone-600' }
              return (
                <motion.div key={b.booking_id}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="rounded-2xl p-5 relative overflow-hidden"
                  style={{
                    background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.65)',
                    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                    border: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(232,98,26,0.12)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                  }}>
                  <div className="flex flex-wrap items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-sans text-xs font-medium" style={{ color: '#E8621A' }}>{b.booking_id}</span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-sans ${cfg.cls}`}>{cfg.label}</span>
                        <span className="font-sans text-xs text-stone-400">{b.payment_method === 'CASH_ON_ARRIVAL' ? '💵 COD' : '💳 Online'}</span>
                      </div>
                      <p className="font-sans text-sm font-semibold mb-0.5" style={{ color: dark ? '#f5f0e8' : '#1a1008' }}>
                        {b.patient_name} <span className="font-normal text-stone-400 text-xs">({b.patient_id})</span>
                      </p>
                      <p className="font-sans text-xs text-stone-500 mb-1">{b.treatments}</p>
                      <div className="flex flex-wrap gap-3 font-sans text-xs text-stone-400">
                        <span>📅 {new Date(b.preferred_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span>🕐 {b.preferred_time}</span>
                        {b.patient_phone && <span>📞 {b.patient_phone}</span>}
                      </div>
                    </div>
                    {b.status === 'PENDING_CONFIRMATION' && (
                      <div className="flex gap-2 shrink-0 items-center">
                        <button onClick={() => confirm(b.booking_id)} disabled={confirming === b.booking_id}
                          className="text-xs px-4 py-2 rounded-xl text-white font-sans transition-all disabled:opacity-50"
                          style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', boxShadow: '0 4px 12px rgba(22,163,74,0.35)' }}>
                          {confirming === b.booking_id ? '…' : '✓ Confirm'}
                        </button>
                        <button onClick={() => cancel(b.booking_id)} disabled={cancelling === b.booking_id}
                          className="text-xs px-4 py-2 rounded-xl border border-red-200 text-red-500 font-sans transition-all hover:bg-red-50 disabled:opacity-50">
                          {cancelling === b.booking_id ? '…' : '✕'}
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </AnimatePresence>

        {!loading && bookings.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <p className="font-serif text-2xl mb-2" style={{ color: '#E8621A' }}>All clear ✓</p>
            <p className="font-sans text-sm text-stone-400">No {filter === 'PENDING_CONFIRMATION' ? 'pending' : ''} bookings found.</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
