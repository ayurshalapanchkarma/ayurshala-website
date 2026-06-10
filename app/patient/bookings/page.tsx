'use client'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Clock, CheckCircle2, AlertCircle, RotateCcw, Trash2, Loader, ArrowLeft } from 'lucide-react'
import GlassBackground from '@/components/GlassBackground'
import { supabase } from '@/lib/supabase'
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
  SUCCESS:       { label: 'Paid Online',         cls: 'text-green-600' },
  COD_PENDING:   { label: 'Cash on Arrival',     cls: 'text-amber-600' },
  THERAPY_LATER: { label: 'After Consultation',  cls: 'text-stone-500' },
  PENDING:       { label: 'Pending',             cls: 'text-amber-600' },
}

function hoursUntil(date: string, time: string) {
  const [t, p] = time.split(' ')
  let [h, m] = t.split(':').map(Number)
  if (p === 'PM' && h !== 12) h += 12
  if (p === 'AM' && h === 12) h = 0
  const appt = new Date(`${date}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`)
  return (appt.getTime() - Date.now()) / 3600000
}

export default function PatientBookingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [patient, setPatient] = useState<Patient | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const dark = mounted && theme === 'dark'

  const [cancelId, setCancelId] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
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
      await supabase.auth.refreshSession()
      const { data: sessionData } = await supabase.auth.getSession()
      let u = sessionData.session?.user ?? null

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
        <Link href="/patient/dashboard"><Image src="/ayurshala_text.png" alt="Ayurshala" width={160} height={48} className="object-contain h-10 sm:h-12 w-auto mb-6 sm:mb-8" /></Link>

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

        <div className="flex items-center gap-3 mb-6">
          <Link href="/patient/dashboard" className="btn-glass p-2">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="font-serif text-2xl sm:text-3xl" style={{ color: '#E8621A' }}>My Bookings</h1>
        </div>

        {loading && <p className="font-sans text-sm text-stone-400 text-center py-12">Loading…</p>}

        {!loading && !user && (
          <div className={`rounded-2xl p-8 text-center border ${dark ? 'border-white/10 bg-white/5' : 'border-brand/15 bg-white/40'}`}>
            <p className="font-sans text-stone-500 mb-4">Please sign in to view your bookings.</p>
            <Link href="/admin/login" className="btn-glass text-sm py-2 px-6 inline-block">Sign In</Link>
          </div>
        )}

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
                  {b.preferred_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(b.preferred_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                  {b.preferred_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {b.preferred_time}</span>}
                  <span className={`flex items-center gap-1 ${pCfg.cls}`}>
                    {b.payment_status === 'SUCCESS' && <CheckCircle2 className="w-3 h-3" />}
                    {(b.payment_status === 'PENDING' || b.payment_status === 'COD_PENDING') && <AlertCircle className="w-3 h-3" />}
                    {pCfg.label}
                  </span>
                </div>

                {b.concern && <p className="font-sans text-xs text-stone-400 mb-3 line-clamp-2">{b.concern}</p>}

                {canModify && (
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => { setRescheduleBooking(b); setNewDate(''); setNewTime(''); setRescheduleReason(''); setRescheduleError('') }}
                      className="btn-glass text-xs py-1.5 px-3 flex items-center gap-1"><RotateCcw className="w-3 h-3" /> Reschedule</button>
                    <button onClick={() => setCancelId(b.booking_id)}
                      className="text-xs py-1.5 px-3 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors flex items-center gap-1"><Trash2 className="w-3 h-3" /> Cancel</button>
                  </div>
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
              style={{ background: 'linear-gradient(135deg, rgba(240,253,250,0.98) 0%, rgba(204,251,241,0.95) 100%)', backdropFilter: 'blur(50px)', border: '1px solid rgba(16,185,129,0.3)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9), 0 20px 60px rgba(16,185,129,0.15), 0 8px 30px rgba(0,0,0,0.08)' }}>
              <p className="font-serif text-2xl mb-2" style={{ color: '#10b981' }}>Reschedule</p>
              <p className="font-sans text-xs text-emerald-600 mb-6">{rescheduleBooking.booking_id}</p>

              <div className="space-y-3 mb-6">
                <div>
                  <label className="font-sans text-xs text-emerald-700 uppercase tracking-wider block mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> New Date</label>
                  <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
                    min={today} max={maxDateStr} onKeyDown={e => e.preventDefault()}
                    className="w-full rounded-xl px-4 py-2.5 text-sm border border-emerald-200 bg-white/60 focus:outline-none focus:border-emerald-400 focus:bg-white/80" />
                  {newDate && new Date(newDate).getUTCDay() === 5 && (
                    <p className="font-sans text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Closed on Fridays. Please choose another day.</p>
                  )}
                </div>
                <div>
                  <label className="font-sans text-xs text-emerald-700 uppercase tracking-wider block mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> New Time</label>
                  <select value={newTime} onChange={e => setNewTime(e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 text-sm border border-emerald-200 bg-white/60 focus:outline-none focus:border-emerald-400 focus:bg-white/80 cursor-pointer">
                    <option value="">Select time…</option>
                    {timeSlots.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-sans text-xs text-emerald-700 uppercase tracking-wider block mb-1">Reason for Rescheduling *</label>
                  <textarea value={rescheduleReason} onChange={e => setRescheduleReason(e.target.value.slice(0, 500))} rows={3}
                    placeholder="Please tell us why you would like to reschedule this appointment."
                    className="w-full rounded-xl px-4 py-2.5 text-sm border border-emerald-200 bg-white/60 focus:outline-none focus:border-emerald-400 focus:bg-white/80 resize-none" />
                  <p className={`font-sans text-xs mt-1 ${rescheduleReason.length < 10 ? 'text-amber-600' : 'text-emerald-600'}`}>{rescheduleReason.length}/500 (minimum 10)</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <button onClick={() => setRescheduleBooking(null)} className="btn-glass flex-1 py-2.5 text-sm">Cancel</button>
                  <button onClick={handleReschedule} disabled={rescheduling || !newDate || !newTime || rescheduleReason.length < 10 || new Date(newDate).getUTCDay() === 5}
                    className="flex-1 py-2.5 text-sm rounded-xl font-sans text-white disabled:opacity-50 hover:brightness-110 transition-all"
                    style={{ background: '#10b981' }}>
                    {rescheduling ? 'Saving…' : 'Confirm'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
