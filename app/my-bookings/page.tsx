'use client'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import GlassBackground from '@/components/GlassBackground'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

const timeSlots = ['10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM']

type Booking = {
  id: string; booking_id: string; preferred_date: string; preferred_time: string
  booking_type: string; status: string; payment_status: string; payment_method: string
  created_at: string; concern: string
  booking_treatments_v2: { treatment_name: string }[]
  payments: { amount: number; status: string }[]
}
type Patient = { id: string; patient_id: string; full_name: string; email: string; phone: string }

const statusConfig: Record<string, { label: string; cls: string }> = {
  CONFIRMED:            { label: 'Confirmed',             cls: 'bg-green-100 text-green-700' },
  PENDING_CONFIRMATION: { label: 'Awaiting Confirmation', cls: 'bg-amber-100 text-amber-700' },
  PAYMENT_PENDING:      { label: 'Payment Pending',       cls: 'bg-amber-100 text-amber-700' },
  CANCELLED:            { label: 'Cancelled',             cls: 'bg-red-100 text-red-700' },
  COMPLETED:            { label: 'Completed',             cls: 'bg-blue-100 text-blue-700' },
  IN_PROGRESS:          { label: 'In Progress',           cls: 'bg-purple-100 text-purple-700' },
  NO_SHOW:              { label: 'No Show',               cls: 'bg-stone-100 text-stone-600' },
}

const paymentConfig: Record<string, { label: string; cls: string }> = {
  SUCCESS:       { label: '✓ Paid Online',         cls: 'text-green-600' },
  COD_PENDING:   { label: '⏳ Cash on Arrival',     cls: 'text-amber-600' },
  THERAPY_LATER: { label: 'ℹ After Consultation',  cls: 'text-stone-500' },
  PENDING:       { label: '⏳ Pending',             cls: 'text-amber-600' },
}

function hoursUntil(date: string, time: string) {
  const [t, p] = time.split(' ')
  let [h, m] = t.split(':').map(Number)
  if (p === 'PM' && h !== 12) h += 12
  if (p === 'AM' && h === 12) h = 0
  const appt = new Date(`${date}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`)
  return (appt.getTime() - Date.now()) / 3600000
}

export default function MyBookingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [patient, setPatient] = useState<Patient | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const dark = mounted && theme === 'dark'

  // Cancel state
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)

  // Reschedule state
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null)
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('')
  const [rescheduling, setRescheduling] = useState(false)
  const [rescheduleError, setRescheduleError] = useState('')

  const today = new Date().toISOString().split('T')[0]
  const maxDate = new Date(); maxDate.setDate(maxDate.getDate() + 90)
  const maxDateStr = maxDate.toISOString().split('T')[0]

  useEffect(() => {
    setMounted(true)
    let loaded = false

    async function init() {
      // Try getSession first
      const { data: sessionData } = await supabase.auth.getSession()
      let u = sessionData.session?.user ?? null

      // Fallback: getUser (makes a network request, more reliable)
      if (!u) {
        const { data: userData } = await supabase.auth.getUser()
        u = userData.user ?? null
      }

      setUser(u)
      if (u && !loaded) {
        loaded = true
        await loadData(u)
      } else if (!u) {
        setLoading(false)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u && !loaded) {
        loaded = true
        await loadData(u)
      } else if (!u) {
        setPatient(null); setBookings([]); setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadData(u: User) {
    const res = await fetch(`/api/patient?email=${encodeURIComponent(u.email!)}`)
    const { patient: p } = await res.json()
    setPatient(p)
    if (p) {
      const bRes = await fetch(`/api/book/details?patient_uuid=${encodeURIComponent(p.id)}`)
      if (bRes.ok) {
        const { bookings: data } = await bRes.json()
        setBookings(data || [])
      }
    }
    setLoading(false)
  }

  async function handlePayOnline(b: Booking) {
    if (!patient) return
    const res = await fetch('/api/book', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'pay-existing', booking_id: b.booking_id, patient_uuid: patient.id }),
    })
    const data = await res.json()
    if (!res.ok) { alert(data.error); return }
    const script = document.createElement('script')
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js'
    script.async = true
    script.onload = () => {
      const cf = (window as any).Cashfree({ mode: 'production' })
      cf.checkout({ paymentSessionId: data.paymentSessionId, redirectTarget: '_self' })
    }
    document.body.appendChild(script)
  }

  async function handleCancel(booking_id: string) {
    if (!patient) return
    setCancelling(true)
    const res = await fetch('/api/book', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel-booking', booking_id, patient_uuid: patient.id }),
    })
    const data = await res.json()
    setCancelling(false)
    setCancelId(null)
    if (!res.ok) { alert(data.error); return }
    setBookings(prev => prev.map(b => b.booking_id === booking_id ? { ...b, status: 'CANCELLED' } : b))
  }

  async function handleReschedule() {
    if (!patient || !rescheduleBooking || !newDate || !newTime) return
    setRescheduling(true)
    setRescheduleError('')
    const res = await fetch('/api/book', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reschedule-booking', booking_id: rescheduleBooking.booking_id, patient_uuid: patient.id, new_date: newDate, new_time: newTime }),
    })
    const data = await res.json()
    setRescheduling(false)
    if (!res.ok) { setRescheduleError(data.error); return }
    setBookings(prev => prev.map(b => b.booking_id === rescheduleBooking.booking_id ? { ...b, preferred_date: newDate, preferred_time: newTime } : b))
    setRescheduleBooking(null)
  }

  const cardCls = `rounded-2xl p-5 border ${dark ? 'border-white/10 bg-white/5' : 'border-brand/12 bg-white/60'}`

  return (
    <div className="min-h-screen px-4 sm:px-6 py-20 sm:py-24 relative overflow-hidden"
      style={{ background: dark ? 'linear-gradient(135deg,#0a0f0a,#1a1008)' : 'linear-gradient(135deg,#fdf6ee,#ffecd2,#fff8f0)' }}>
      <GlassBackground />
      <div className="max-w-2xl mx-auto relative">
        <Link href="/"><Image src="/ayurshala_text.png" alt="Ayurshala" width={160} height={48} className="object-contain h-10 sm:h-12 w-auto mb-6 sm:mb-8" /></Link>

        {patient && (
          <div className={`rounded-2xl p-4 mb-6 border flex items-center gap-4 ${dark ? 'border-white/10 bg-white/5' : 'border-brand/15 bg-brand/5'}`}>
            <div className="flex-1 min-w-0">
              <p className="font-sans text-sm font-semibold truncate" style={{ color: '#E8621A' }}>{patient.full_name}</p>
              <p className="font-sans text-xs text-stone-400 truncate">{patient.email}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-sans text-xs text-stone-400">Patient ID</p>
              <p className="font-sans text-sm font-bold" style={{ color: '#E8621A' }}>{patient.patient_id}</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-6 gap-3">
          <h1 className="font-serif text-2xl sm:text-3xl" style={{ color: '#E8621A' }}>My Bookings</h1>
          <Link href="/book" className="btn-glass text-xs py-2 px-4 sm:px-5 shrink-0">+ New</Link>
        </div>

        {!user && !loading && (
          <div className={`rounded-2xl p-8 text-center border ${dark ? 'border-white/10 bg-white/5' : 'border-brand/15 bg-white/40'}`}>
            <p className="font-sans text-stone-500 mb-4">Sign in to view your bookings</p>
            <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback?next=/my-bookings` } })}
              className="btn-glass text-sm py-2 px-6 inline-flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Sign in with Google
            </button>
          </div>
        )}

        {loading && <p className="font-sans text-sm text-stone-400 text-center py-12">Loading…</p>}

        {user && !loading && bookings.length === 0 && (
          <div className={`rounded-2xl p-8 text-center border ${dark ? 'border-white/10 bg-white/5' : 'border-brand/15 bg-white/40'}`}>
            <p className="font-sans text-stone-500 mb-4">No bookings yet.</p>
            <Link href="/book" className="btn-glass text-sm py-2 px-6 inline-block">Book an Appointment</Link>
          </div>
        )}

        <div className="space-y-3">
          {bookings.map(b => {
            const canModify = ['CONFIRMED', 'PENDING_CONFIRMATION'].includes(b.status) && hoursUntil(b.preferred_date, b.preferred_time) >= 24
            const cfg = statusConfig[b.status] || { label: b.status, cls: 'bg-stone-100 text-stone-600' }
            const pCfg = paymentConfig[b.payment_status] || { label: b.payment_status, cls: 'text-stone-400' }
            const wasPaid = b.payment_status === 'SUCCESS'

            return (
              <div key={b.id} className={cardCls}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="font-sans text-xs text-stone-400 mb-0.5">{b.booking_id}</p>
                    <p className="font-sans text-sm font-semibold truncate" style={{ color: '#E8621A' }}>
                      {(b.booking_treatments_v2 as any)?.map((t: any) => t.treatment_name).join(', ') || '—'}
                    </p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-sans shrink-0 ${cfg.cls}`}>{cfg.label}</span>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-sans text-stone-400 mb-3">
                  {b.preferred_date && <span>📅 {new Date(b.preferred_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                  {b.preferred_time && <span>🕐 {b.preferred_time}</span>}
                  <span className={pCfg.cls}>{pCfg.label}</span>
                </div>

                {b.concern && <p className="font-sans text-xs text-stone-400 mb-3 line-clamp-2">{b.concern}</p>}

                {canModify && (
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => { setRescheduleBooking(b); setNewDate(''); setNewTime(''); setRescheduleError('') }}
                      className="btn-glass text-xs py-1.5 px-3">🔄 Reschedule</button>
                    <button onClick={() => setCancelId(b.booking_id)}
                      className="text-xs py-1.5 px-3 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors">✕ Cancel</button>
                  </div>
                )}
                {b.status === 'PENDING_CONFIRMATION' && b.payment_method === 'CASH_ON_ARRIVAL' && (
                  <div className="flex gap-2 flex-wrap mt-2">
                    <button onClick={() => handlePayOnline(b)}
                      className="text-xs py-1.5 px-3 rounded-xl border font-sans transition-colors"
                      style={{ borderColor: '#E8621A', color: '#E8621A' }}>
                      💳 Pay Online to Confirm
                    </button>
                  </div>
                )}

                {b.status === 'CANCELLED' && wasPaid && (
                  <p className="font-sans text-xs text-amber-600 mt-1">For refund, please contact Ayurshala: <a href="tel:+919821224767" className="underline">+91-9821224767</a></p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Cancel Confirm Modal */}
      <AnimatePresence>
        {cancelId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={() => setCancelId(null)}>
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl p-6 text-center"
              style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
              <p className="font-serif text-xl mb-2" style={{ color: '#1a1008' }}>Cancel Booking?</p>
              <p className="font-sans text-sm text-stone-500 mb-6">This cannot be undone. Booking <strong>{cancelId}</strong> will be cancelled.</p>
              <div className="flex gap-3">
                <button onClick={() => setCancelId(null)} className="btn-glass flex-1 py-2.5 text-sm">Keep It</button>
                <button onClick={() => handleCancel(cancelId!)} disabled={cancelling}
                  className="flex-1 py-2.5 text-sm rounded-xl bg-red-500 text-white font-sans disabled:opacity-50">
                  {cancelling ? 'Cancelling…' : 'Yes, Cancel'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reschedule Modal */}
      <AnimatePresence>
        {rescheduleBooking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={() => setRescheduleBooking(null)}>
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl p-6"
              style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
              <p className="font-serif text-xl mb-1" style={{ color: '#E8621A' }}>Reschedule</p>
              <p className="font-sans text-xs text-stone-400 mb-5">{rescheduleBooking.booking_id}</p>

              <div className="space-y-3 mb-4">
                <div>
                  <label className="font-sans text-xs text-stone-400 uppercase tracking-wider block mb-1">New Date</label>
                  <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
                    min={today} max={maxDateStr} onKeyDown={e => e.preventDefault()}
                    className="w-full rounded-xl px-4 py-2.5 text-sm border border-stone-200 bg-white/80 focus:outline-none focus:border-brand/50" />
                </div>
                <div>
                  <label className="font-sans text-xs text-stone-400 uppercase tracking-wider block mb-1">New Time</label>
                  <select value={newTime} onChange={e => setNewTime(e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 text-sm border border-stone-200 bg-white/80 focus:outline-none focus:border-brand/50 cursor-pointer">
                    <option value="">Select time…</option>
                    {timeSlots.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {rescheduleError && <p className="font-sans text-xs text-red-500 mb-3">{rescheduleError}</p>}

              <div className="flex gap-3">
                <button onClick={() => setRescheduleBooking(null)} className="btn-glass flex-1 py-2.5 text-sm">Cancel</button>
                <button onClick={handleReschedule} disabled={rescheduling || !newDate || !newTime}
                  className="flex-1 py-2.5 text-sm rounded-xl font-sans text-white disabled:opacity-50"
                  style={{ background: '#E8621A' }}>
                  {rescheduling ? 'Saving…' : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
