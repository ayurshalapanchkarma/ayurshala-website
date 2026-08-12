'use client'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Clock, CheckCircle2, AlertCircle, RotateCcw, Trash2, Loader } from 'lucide-react'
import GlassBackground from '@/components/GlassBackground'
import { supabase } from '@/lib/supabase'
import { getOAuthRedirectUrl } from '@/lib/auth-config'
import type { User } from '@supabase/supabase-js'

const timeSlots = ['10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM']

type Booking = {
  id: string; booking_id: string; preferred_date: string; preferred_time: string
  booking_type: string; status: string; payment_status: string; payment_method: string
  created_at: string; concern: string; is_rescheduled?: boolean
  booking_treatments_v2: { treatment_name: string }[]
  payments: { amount: number; status: string }[]
}
type Patient = { id: string; patient_id: string; full_name: string; email: string; phone: string }

const statusConfig: Record<string, { label: string; lightCls: string; darkCls: string }> = {
  CONFIRMED:            { label: 'Confirmed',             lightCls: 'bg-green-100 text-green-800', darkCls: 'dark:bg-green-900/40 dark:text-green-300' },
  PENDING_CONFIRMATION: { label: 'Awaiting Confirmation', lightCls: 'bg-amber-100 text-amber-800', darkCls: 'dark:bg-amber-900/40 dark:text-amber-300' },
  PAYMENT_PENDING:      { label: 'Payment Pending',       lightCls: 'bg-amber-100 text-amber-800', darkCls: 'dark:bg-amber-900/40 dark:text-amber-300' },
  RESCHEDULED:          { label: 'Rescheduled',           lightCls: 'bg-blue-100 text-blue-800', darkCls: 'dark:bg-blue-900/40 dark:text-blue-300' },
  CANCELLED:            { label: 'Cancelled',             lightCls: 'bg-red-100 text-red-800', darkCls: 'dark:bg-red-900/40 dark:text-red-300' },
  COMPLETED:            { label: 'Completed',             lightCls: 'bg-emerald-100 text-emerald-800', darkCls: 'dark:bg-emerald-900/40 dark:text-emerald-300' },
  IN_PROGRESS:          { label: 'In Progress',           lightCls: 'bg-purple-100 text-purple-800', darkCls: 'dark:bg-purple-900/40 dark:text-purple-300' },
  NO_SHOW:              { label: 'No Show',               lightCls: 'bg-stone-100 text-stone-700', darkCls: 'dark:bg-stone-900/40 dark:text-stone-300' },
  RESCHEDULE_REJECTED:  { label: 'Reschedule Rejected',   lightCls: 'bg-red-100 text-red-800', darkCls: 'dark:bg-red-900/40 dark:text-red-300' },
  CHECKED_IN:           { label: 'Checked In',            lightCls: 'bg-indigo-100 text-indigo-800', darkCls: 'dark:bg-indigo-900/40 dark:text-indigo-300' },
  CHECKED_OUT:          { label: 'Checked Out',           lightCls: 'bg-indigo-100 text-indigo-800', darkCls: 'dark:bg-indigo-900/40 dark:text-indigo-300' },
}

const paymentConfig: Record<string, { label: string; lightCls: string; darkCls: string }> = {
  SUCCESS:       { label: 'Paid Online',         lightCls: 'text-green-600', darkCls: 'dark:text-green-400' },
  COD_PENDING:   { label: 'Cash on Arrival',     lightCls: 'text-amber-600', darkCls: 'dark:text-amber-400' },
  THERAPY_LATER: { label: 'After Consultation',  lightCls: 'text-stone-500', darkCls: 'dark:text-stone-400' },
  PENDING:       { label: 'Pending',             lightCls: 'text-amber-600', darkCls: 'dark:text-amber-400' },
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
  const [rescheduleReason, setRescheduleReason] = useState('')
  const [rescheduling, setRescheduling] = useState(false)
  const [rescheduleError, setRescheduleError] = useState('')

  const today = new Date().toISOString().split('T')[0]
  const maxDate = new Date(); maxDate.setDate(maxDate.getDate() + 90)
  const maxDateStr = maxDate.toISOString().split('T')[0]

  useEffect(() => {
    setMounted(true)
    let loaded = false

    async function init() {
      // Force refresh session to get latest from server
      await supabase.auth.refreshSession()
      
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
    
    if (rescheduleReason.length < 10) {
      setRescheduleError('Please provide a reason with at least 10 characters.')
      setRescheduling(false)
      return
    }
    
    // Check if reschedule is already pending (is_rescheduled = true)
    if (rescheduleBooking.is_rescheduled || (rescheduleBooking as any).is_rescheduled) {
      setRescheduleError('A reschedule request is already pending. Please wait for clinic confirmation.')
      setRescheduling(false)
      return
    }
    
    const res = await fetch('/api/book', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reschedule-booking', booking_id: rescheduleBooking.booking_id, patient_uuid: patient.id, new_date: newDate, new_time: newTime, reschedule_reason: rescheduleReason }),
    })
    const data = await res.json()
    setRescheduling(false)
    if (!res.ok) { setRescheduleError(data.error); return }
    setBookings(prev => prev.map(b => b.booking_id === rescheduleBooking.booking_id ? { ...b, preferred_date: newDate, preferred_time: newTime } : b))
    setRescheduleBooking(null)
  }

  const cardCls = `rounded-2xl p-5 border backdrop-filter backdrop-blur-xl ${dark ? 'border-white/10 bg-white/5' : 'border-white/85 bg-white/75'}`

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
            <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: getOAuthRedirectUrl('/my-bookings') } })}
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
            const hours = hoursUntil(b.preferred_date, b.preferred_time)
            const canCancel = (b.status === 'PENDING_CONFIRMATION' || b.status === 'CONFIRMED') && hours >= 24
            const canReschedule = (b.status === 'PENDING_CONFIRMATION' || (b.status === 'CONFIRMED' && !b.is_rescheduled)) && hours >= 24
            
            // Badge logic
            let badgeLabel = '', badgeLightCls = '', badgeDarkCls = ''
            if (b.status === 'CONFIRMED' && (b as any).rescheduled_at) {
              badgeLabel = 'Reschedule Confirmed'
              badgeLightCls = 'bg-emerald-100 text-emerald-800'
              badgeDarkCls = 'dark:bg-emerald-900/40 dark:text-emerald-300'
            } else if (b.status === 'RESCHEDULED') {
              badgeLabel = 'Awaiting Reschedule Approval'
              badgeLightCls = 'bg-blue-100 text-blue-800'
              badgeDarkCls = 'dark:bg-blue-900/40 dark:text-blue-300'
            } else {
              const cfg = statusConfig[b.status] || { label: b.status, lightCls: 'bg-stone-100 text-stone-700', darkCls: 'dark:bg-stone-900/40 dark:text-stone-300' }
              badgeLabel = cfg.label
              badgeLightCls = cfg.lightCls
              badgeDarkCls = cfg.darkCls
            }
            
            const pCfg = paymentConfig[b.payment_status] || { label: b.payment_status, lightCls: 'text-stone-400', darkCls: 'dark:text-stone-500' }
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
                  <span className={`text-xs px-3 py-1.5 rounded-full font-sans font-semibold shrink-0 ${badgeLightCls} ${badgeDarkCls}`}>{badgeLabel}</span>
                </div>

                {b.status === 'RESCHEDULED' && <p className="font-sans text-xs text-blue-600 dark:text-blue-400 mb-2">Your reschedule request is awaiting clinic approval.</p>}
                {b.status === 'CONFIRMED' && b.is_rescheduled && <p className="font-sans text-xs text-emerald-600 dark:text-emerald-400 mb-2">Your rescheduled appointment has been approved by the clinic.</p>}

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-sans text-stone-400 dark:text-stone-500 mb-3">
                  {b.preferred_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(b.preferred_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                  {b.preferred_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {b.preferred_time}</span>}
                  <span className={`flex items-center gap-1 ${pCfg.lightCls} ${pCfg.darkCls}`}>
                    {b.payment_status === 'SUCCESS' && <CheckCircle2 className="w-3 h-3" />}
                    {(b.payment_status === 'PENDING' || b.payment_status === 'COD_PENDING') && <AlertCircle className="w-3 h-3" />}
                    {pCfg.label}
                  </span>
                </div>

                {b.concern && <p className="font-sans text-xs text-stone-400 mb-3 line-clamp-2">{b.concern}</p>}

                {(canReschedule || canCancel) && (
                  <div className="flex gap-2 flex-wrap">
                    {canReschedule && (
                      <button onClick={() => { setRescheduleBooking(b); setNewDate(''); setNewTime(''); setRescheduleReason(''); setRescheduleError('') }}
                        className="btn-glass text-xs py-1.5 px-3 flex items-center gap-1"><RotateCcw className="w-3 h-3" /> Reschedule</button>
                    )}
                    {canCancel && (
                      <button onClick={() => setCancelId(b.booking_id)}
                        className="text-xs py-1.5 px-3 rounded-xl border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors flex items-center gap-1"><Trash2 className="w-3 h-3" /> Cancel</button>
                    )}
                  </div>
                )}
                {b.status === 'PENDING_CONFIRMATION' && b.payment_method === 'CASH_ON_ARRIVAL' && (
                  <div className="flex gap-2 flex-wrap mt-2">
                    <button onClick={() => handlePayOnline(b)}
                      className="text-xs py-1.5 px-3 rounded-xl border font-sans transition-colors flex items-center gap-1"
                      style={{ borderColor: '#E8621A', color: dark ? '#f97316' : '#E8621A' }}>
                      <CheckCircle2 className="w-3 h-3" /> Pay Online to Confirm
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
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
            onClick={() => setCancelId(null)}>
            <motion.div initial={{ y: 60, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 60, opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl p-8 text-center"
              style={{ 
                background: 'linear-gradient(135deg, rgba(254,226,226,0.98) 0%, rgba(254,200,200,0.95) 100%)',
                backdropFilter: 'blur(50px)',
                border: '1px solid rgba(220,38,38,0.3)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9), 0 20px 60px rgba(220,38,38,0.15), 0 8px 30px rgba(0,0,0,0.08)'
              }}>
              <p className="font-serif text-2xl mb-2" style={{ color: '#991b1b' }}>Cancel Booking?</p>
              <p className="font-sans text-sm text-red-700 mb-8">This cannot be undone. Booking <strong>{cancelId}</strong> will be cancelled immediately.</p>
              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <button onClick={() => setCancelId(null)} className="btn-glass flex-1 py-2.5 text-sm">Keep It</button>
                  <button onClick={() => handleCancel(cancelId!)} disabled={cancelling}
                    className="flex-1 py-2.5 text-sm rounded-xl bg-red-500 text-white font-sans disabled:opacity-50 hover:bg-red-600 transition-colors">
                    {cancelling ? 'Cancelling…' : 'Yes, Cancel'}
                  </button>
                </div>
                <Link href="/my-bookings" className="btn-glass w-full py-2.5 text-sm text-center">Go to My Bookings</Link>
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
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
            onClick={() => setRescheduleBooking(null)}>
            <motion.div initial={{ y: 60, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 60, opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl p-8"
              style={{ background: dark ? 'linear-gradient(135deg,rgba(4,47,34,0.98),rgba(6,78,59,0.95))' : 'linear-gradient(135deg, rgba(240,253,250,0.98) 0%, rgba(204,251,241,0.95) 100%)', backdropFilter: 'blur(50px)', border: dark ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(16,185,129,0.3)', boxShadow: dark ? 'inset 0 1px 0 rgba(34,197,94,0.2), 0 20px 60px rgba(16,185,129,0.2), 0 8px 30px rgba(0,0,0,0.2)' : 'inset 0 1px 0 rgba(255,255,255,0.9), 0 20px 60px rgba(16,185,129,0.15), 0 8px 30px rgba(0,0,0,0.08)' }}>
              <p className="font-serif text-2xl mb-2" style={{ color: dark ? '#86efac' : '#059669' }}>Reschedule</p>
              <p className={`font-sans text-xs ${dark ? 'text-emerald-300' : 'text-emerald-600'} mb-6`}>{rescheduleBooking.booking_id}</p>

              <div className="space-y-3 mb-6">
                <div>
                  <label className={`font-sans text-xs font-semibold uppercase tracking-wider block mb-2 flex items-center gap-1 ${dark ? 'text-emerald-300' : 'text-emerald-700'}`}><Calendar className="w-3 h-3" /> New Date</label>
                  <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
                    min={today} max={maxDateStr} onKeyDown={e => e.preventDefault()}
                    className={`w-full rounded-xl px-4 py-2.5 text-sm border font-sans ${dark ? 'border-emerald-700/50 bg-emerald-950/40 text-emerald-50 placeholder-emerald-500 focus:border-emerald-500 focus:bg-emerald-950/60' : 'border-emerald-200 bg-white/60 text-stone-900 placeholder-stone-400 focus:border-emerald-400 focus:bg-white/80'} focus:outline-none focus:ring-2 focus:ring-emerald-400/20` } />
                  {newDate && new Date(newDate).getUTCDay() === 5 && (
                    <p className={`font-sans text-xs mt-1 flex items-center gap-1 ${dark ? 'text-red-300' : 'text-red-500'}`}><AlertCircle className="w-3 h-3" /> Closed on Fridays. Please choose another day.</p>
                  )}
                </div>
                <div>
                  <label className={`font-sans text-xs font-semibold uppercase tracking-wider block mb-2 flex items-center gap-1 ${dark ? 'text-emerald-300' : 'text-emerald-700'}`}><Clock className="w-3 h-3" /> New Time</label>
                  <select value={newTime} onChange={e => setNewTime(e.target.value)}
                    className={`w-full rounded-xl px-4 py-2.5 text-sm border font-sans ${dark ? 'border-emerald-700/50 bg-emerald-950/40 text-emerald-50 focus:border-emerald-500 focus:bg-emerald-950/60' : 'border-emerald-200 bg-white/60 text-stone-900 focus:border-emerald-400 focus:bg-white/80'} focus:outline-none focus:ring-2 focus:ring-emerald-400/20 cursor-pointer appearance-none`}>
                    <option value="">Select time…</option>
                    {timeSlots.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={`font-sans text-xs font-semibold uppercase tracking-wider block mb-2 ${dark ? 'text-emerald-300' : 'text-emerald-700'}`}>Reason for Rescheduling *</label>
                  <textarea value={rescheduleReason} onChange={e => setRescheduleReason(e.target.value.slice(0, 500))} rows={3}
                    placeholder="Please tell us why you would like to reschedule this appointment."
                    className={`w-full rounded-xl px-4 py-2.5 text-sm border font-sans ${dark ? 'border-emerald-700/50 bg-emerald-950/40 text-emerald-50 placeholder-emerald-500 focus:border-emerald-500 focus:bg-emerald-950/60' : 'border-emerald-200 bg-white/60 text-stone-900 placeholder-stone-400 focus:border-emerald-400 focus:bg-white/80'} focus:outline-none focus:ring-2 focus:ring-emerald-400/20 resize-none`} />
                  <p className={`font-sans text-xs mt-1 font-medium ${rescheduleReason.length < 10 ? (dark ? 'text-amber-300' : 'text-amber-600') : (dark ? 'text-emerald-300' : 'text-emerald-600')}`}>{rescheduleReason.length}/500 (minimum 10)</p>
                </div>
              </div>

              {rescheduleError && <p className={`font-sans text-xs rounded-lg p-3 mb-3 border font-medium ${dark ? 'text-red-200 bg-red-950/40 border-red-700/50' : 'text-red-700 bg-red-50 border-red-200'}`}>{rescheduleError}</p>}

              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <button onClick={() => setRescheduleBooking(null)} className="btn-glass flex-1 py-2.5 text-sm font-semibold">Cancel</button>
                  <button onClick={handleReschedule} disabled={rescheduling || !newDate || !newTime || rescheduleReason.length < 10 || new Date(newDate).getUTCDay() === 5}
                    className="flex-1 py-2.5 text-sm rounded-xl font-sans font-semibold text-white disabled:opacity-40 enabled:hover:brightness-110 transition-all"
                    style={{ background: '#10b981' }}>
                    {rescheduling ? 'Saving…' : 'Confirm'}
                  </button>
                </div>
                <Link href="/my-bookings" className="btn-glass w-full py-2.5 text-sm text-center font-semibold">Go to My Bookings</Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
