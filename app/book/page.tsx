'use client'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import GlassBackground from '@/components/GlassBackground'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

const therapies = [
  'Shirodhara', 'Abhyanga', 'Swedana', 'Vamana', 'Virechana',
  'Basti', 'Nasya', 'Raktamokshana', 'Kati Basti', 'Greeva Basti',
  'Janu Basti', 'Shiro Basti', 'Uro Basti', 'Shiro Taila Dhara',
  'Nasya Dhoompana', 'Karan Purana', 'Anuvasana Basti',
  'PRP Therapy', 'Regeneration Medicine',
]

const timeSlots = ['10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM']

type Patient = { id: string; patient_id: string; email: string; full_name: string; phone: string; avatar_url?: string }
type Status = 'idle' | 'loading' | 'error'

export default function BookPage() {
  const [user, setUser] = useState<User | null>(null)
  const [patient, setPatient] = useState<Patient | null>(null)
  const [phone, setPhone] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [selectedTreatments, setSelectedTreatments] = useState<string[]>([])
  const [isConsultation, setIsConsultation] = useState(false)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [concern, setConcern] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestPatient, setGuestPatient] = useState<Patient | null>(null)
  const [checkingGuest, setCheckingGuest] = useState(false)
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  const dark = mounted && theme === 'dark'
  const today = new Date().toISOString().split('T')[0]
  const maxDate = new Date(); maxDate.setDate(maxDate.getDate() + 90)
  const maxDateStr = maxDate.toISOString().split('T')[0]
  const nowMins = new Date().getHours() * 60 + new Date().getMinutes()
  const slotMins = (s: string) => { const [t, p] = s.split(' '); let [h, m] = t.split(':').map(Number); if (p === 'PM' && h !== 12) h += 12; if (p === 'AM' && h === 12) h = 0; return h * 60 + m }
  const availableSlots = date === today ? timeSlots.filter(s => slotMins(s) > nowMins + 30) : timeSlots

  // When therapy selected, remove consultation
  const handleTherapyToggle = (t: string, checked: boolean) => {
    if (checked) {
      setIsConsultation(false)
      setSelectedTreatments(prev => [...prev, t])
    } else {
      setSelectedTreatments(prev => prev.filter(x => x !== t))
    }
  }

  const handleConsultationToggle = (checked: boolean) => {
    setIsConsultation(checked)
    if (checked) setSelectedTreatments([])
  }

  const bookingType = isConsultation ? 'consultation' : 'therapy'
  const amount = 500
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online')
  const activePatient = patient || guestPatient

  useEffect(() => {
    setMounted(true)
    supabase.auth.getSession().then(async ({ data }) => {
      const u = data.session?.user ?? null
      setUser(u)
      if (u) await loadOrCreatePatient(u)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) await loadOrCreatePatient(u)
      else { setPatient(null) }
    })

    const params = new URLSearchParams(window.location.search)
    if (params.get('status') === 'failed' || params.get('status') === 'error') {
      setStatus('error'); setErrorMsg('Payment failed. Please try again.')
    }

    return () => subscription.unsubscribe()
  }, [])

  async function loadOrCreatePatient(u: User) {
    const res = await fetch(`/api/patient?email=${encodeURIComponent(u.email!)}`)
    const { patient: existing } = await res.json()
    if (existing) { setPatient(existing); setPhone(existing.phone || ''); return }
    // Create
    const createRes = await fetch('/api/patient', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: u.email, full_name: u.user_metadata?.full_name, google_user_id: u.id, avatar_url: u.user_metadata?.avatar_url }),
    })
    const { patient: newP } = await createRes.json()
    setPatient(newP)
  }

  async function checkGuestEmail(email: string) {
    if (!email.includes('@')) return
    setCheckingGuest(true)
    const res = await fetch(`/api/patient?email=${encodeURIComponent(email)}`)
    const { patient: existing } = await res.json()
    setGuestPatient(existing || null)
    setCheckingGuest(false)
  }

  const validatePhone = (p: string) => {
    if (!/^[6-9]\d{9}$/.test(p)) { setPhoneError('Enter valid 10-digit mobile number (starting 6-9)'); return false }
    setPhoneError(''); return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user && !guestPatient && !guestEmail) { alert('Please sign in or enter your email to continue.'); return }
    if (!date) { alert('Please select a date.'); return }
    if (!time) { alert('Please select a time slot.'); return }
    if (!isConsultation && selectedTreatments.length === 0) { alert('Please select at least one treatment or consultation.'); return }

    const activePhone = patient ? phone : guestPhone
    if (!validatePhone(activePhone)) return

    setStatus('loading')
    setErrorMsg('')

    try {
      let currentPatient = activePatient

      // Create guest patient if needed
      if (!currentPatient && !user) {
        const res = await fetch('/api/patient', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: guestEmail, full_name: guestName, phone: guestPhone }),
        })
        const { patient: newP } = await res.json()
        currentPatient = newP
        setGuestPatient(newP)
      }

      if (!currentPatient) { setStatus('error'); setErrorMsg('Could not create patient record.'); return }

      // Update phone if changed
      if (patient && phone !== patient.phone) {
        await fetch('/api/patient', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: patient.email, phone }) })
      }

      const treatments = isConsultation ? ['Consultation'] : selectedTreatments
      const orderRes = await fetch('/api/book', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create-order', patient_uuid: currentPatient.id, patient_id: currentPatient.patient_id, treatments, preferred_date: date, preferred_time: time, concern, booking_type: bookingType, payment_method: paymentMethod }),
      })
      const orderData = await orderRes.json()
      if (!orderRes.ok) { setStatus('error'); setErrorMsg(orderData.error || 'Failed to create booking.'); return }

      if (paymentMethod === 'cod') {
        // Confirm immediately for COD
        await fetch('/api/book', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'confirm-booking', booking_id: orderData.bookingId, cashfree_order_id: orderData.bookingId, payment_method: 'cod' }),
        })
        window.location.href = `/book/confirmed?booking_id=${orderData.bookingId}`
        return
      }

      const { paymentSessionId } = orderData
      const script = document.createElement('script')
      script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js'
      script.async = true
      script.onload = () => {
        const cf = (window as any).Cashfree({ mode: 'production' })
        cf.checkout({ paymentSessionId, redirectTarget: '_self' })
      }
      document.body.appendChild(script)
    } catch {
      setStatus('error'); setErrorMsg('Something went wrong. Please call +91-9821224767.')
    }
  }

  const inputCls = `w-full glass rounded-xl px-4 py-3 font-sans text-sm bg-transparent placeholder-stone-400 focus:outline-none focus:border-brand/50 transition-colors border ${dark ? 'text-stone-200 border-white/10' : 'text-stone-700 border-stone-200'}`

  return (
    <div className="min-h-screen px-6 py-16 relative overflow-hidden"
      style={{ background: dark ? 'linear-gradient(135deg,#0a0f0a,#1a1008)' : 'linear-gradient(135deg,#fdf6ee,#ffecd2,#fff8f0)' }}>
      <GlassBackground />
      <div className="absolute top-[10%] left-[5%] w-[500px] h-[500px] rounded-full opacity-40 pointer-events-none animate-blob1"
        style={{ background: 'radial-gradient(circle,#4a7c59 0%,transparent 70%)' }} />
      <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] rounded-full opacity-35 pointer-events-none animate-blob2"
        style={{ background: 'radial-gradient(circle,#E8621A 0%,transparent 70%)' }} />

      <div className="max-w-lg mx-auto relative">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="rounded-3xl p-8 relative overflow-hidden"
          style={{
            background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.82)',
            backdropFilter: 'blur(40px)', border: dark ? '1px solid rgba(255,255,255,0.08)' : '1.5px solid rgba(255,255,255,0.85)',
            boxShadow: '0 20px 80px rgba(232,98,26,0.10)',
          }}>

          <div className="text-center mb-8">
            <Image src="/ayurshala_text.png" alt="Ayurshala" width={260} height={72} className="object-contain h-20 w-auto mx-auto mb-4" />
            <h1 className="font-serif text-3xl mb-1" style={{ color: '#E8621A' }}>Book an Appointment</h1>
            <p className="font-sans text-stone-400 text-sm">We'll confirm within a few hours.</p>
          </div>

          {/* Auth / Patient Info */}
          {user && patient ? (
            <div className={`rounded-2xl p-4 mb-6 border ${dark ? 'border-white/10 bg-white/5' : 'border-brand/15 bg-brand/5'}`}>
              <div className="flex items-center gap-3">
                {patient.avatar_url && <img src={patient.avatar_url} className="w-10 h-10 rounded-full" alt="" />}
                <div>
                  <p className="font-sans text-sm font-semibold" style={{ color: '#E8621A' }}>{patient.full_name}</p>
                  <p className="font-sans text-xs text-stone-400">{patient.email}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="font-sans text-xs text-stone-400">Patient ID</p>
                  <p className="font-sans text-sm font-bold" style={{ color: '#E8621A' }}>{patient.patient_id}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 mb-6">
              <button type="button" onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback?next=/book` } })}
                className="w-full btn-glass py-3 flex items-center justify-center gap-2 text-sm">
                <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Sign in with Google
              </button>
              <div className="relative flex items-center gap-3">
                <div className="flex-1 h-px bg-stone-200" />
                <span className="font-sans text-xs text-stone-400">or continue without Google</span>
                <div className="flex-1 h-px bg-stone-200" />
              </div>
              <div>
                <input value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="Full Name *" className={inputCls} />
              </div>
              <div>
                <input value={guestEmail} onChange={e => { setGuestEmail(e.target.value); if (e.target.value.includes('@')) checkGuestEmail(e.target.value) }}
                  placeholder="Email Address *" type="email" className={inputCls} />
                {checkingGuest && <p className="font-sans text-xs text-stone-400 mt-1">Checking…</p>}
                {guestPatient && <p className="font-sans text-xs text-green-600 mt-1">Welcome back! Patient ID: <strong>{guestPatient.patient_id}</strong></p>}
              </div>
              <div>
                <input value={guestPhone} onChange={e => { setGuestPhone(e.target.value); if (e.target.value.length === 10) validatePhone(e.target.value) }}
                  placeholder="Phone Number *" type="tel" maxLength={10} className={inputCls} />
                {phoneError && <p className="font-sans text-xs text-red-400 mt-1">{phoneError}</p>}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Phone for logged-in users */}
            {user && patient && (
              <div>
                <label className="font-sans text-xs text-stone-400 uppercase tracking-wider block mb-1.5">Phone *</label>
                <input value={phone} onChange={e => { setPhone(e.target.value); if (e.target.value.length === 10) validatePhone(e.target.value) }}
                  placeholder="10-digit mobile number" type="tel" maxLength={10} className={inputCls} />
                {phoneError && <p className="font-sans text-xs text-red-400 mt-1">{phoneError}</p>}
              </div>
            )}

            {/* Treatment Selection */}
            <div>
              <label className="font-sans text-xs text-stone-400 uppercase tracking-wider block mb-2">Select Treatment *</label>

              {/* Consultation */}
              <label className={`flex items-center gap-3 rounded-xl px-4 py-3 mb-2 cursor-pointer border transition-colors ${isConsultation ? 'border-brand/40 bg-brand/10' : dark ? 'border-white/10' : 'border-stone-200'}`}>
                <input type="checkbox" className="w-4 h-4 accent-brand" checked={isConsultation}
                  onChange={e => handleConsultationToggle(e.target.checked)} />
                <span className="font-sans text-sm font-medium">Consultation</span>
                <span className="font-sans text-xs text-stone-400 ml-auto">₹500</span>
              </label>

              {selectedTreatments.length > 0 && isConsultation && (
                <p className="font-sans text-xs text-amber-600 mb-2">Therapy booking includes doctor assessment. Consultation removed automatically.</p>
              )}

              {/* Therapies */}
              <div className={`rounded-xl border p-3 grid grid-cols-2 gap-1 ${dark ? 'border-white/10' : 'border-stone-200'}`}>
                {therapies.map(t => (
                  <label key={t} className="flex items-center gap-2 cursor-pointer py-1 px-1">
                    <input type="checkbox" className="w-3.5 h-3.5 accent-brand flex-shrink-0"
                      checked={selectedTreatments.includes(t)}
                      onChange={e => handleTherapyToggle(t, e.target.checked)} />
                    <span className="font-sans text-xs">{t}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date + Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-sans text-xs text-stone-400 uppercase tracking-wider block mb-1.5">Date *</label>
                <input value={date} onChange={e => { setDate(e.target.value); if (time && e.target.value === today && slotMins(time) <= nowMins + 30) setTime('') }}
                  type="date" min={today} max={maxDateStr} className={inputCls}
                  onKeyDown={e => e.preventDefault()} />
                {date && new Date(date).getUTCDay() === 5 && (
                  <p className="font-sans text-xs text-red-400 mt-1">Closed on Fridays. Please choose another day.</p>
                )}
              </div>
              <div>
                <label className="font-sans text-xs text-stone-400 uppercase tracking-wider block mb-1.5">Time *</label>
                <select value={time} onChange={e => setTime(e.target.value)} className={inputCls + ' cursor-pointer'}>
                  <option value="">Select time…</option>
                  {availableSlots.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {date === today && availableSlots.length === 0 && (
                  <p className="font-sans text-xs text-red-400 mt-1">No slots today. Choose another date.</p>
                )}
              </div>
            </div>

            {/* Payment summary + method */}
            {(isConsultation || selectedTreatments.length > 0) && (
              <div className={`rounded-xl p-4 border ${dark ? 'border-white/10 bg-white/5' : 'border-brand/15 bg-brand/5'}`}>
                {bookingType === 'consultation' ? (
                  <p className="font-sans text-sm text-stone-600 mb-3">Consultation Fee: <strong style={{ color: '#E8621A' }}>₹500</strong></p>
                ) : (
                  <div className="mb-3">
                    <p className="font-sans text-sm text-stone-600">Therapy Booking Advance: <strong style={{ color: '#E8621A' }}>₹500</strong></p>
                    <p className="font-sans text-xs text-stone-400 mt-0.5">Remaining amount decided after doctor assessment.</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {(['online', 'cod'] as const).map(m => (
                    <label key={m} className={`flex items-center gap-2 cursor-pointer p-2.5 rounded-xl border transition-all ${paymentMethod === m ? 'border-brand/40 bg-brand/10' : dark ? 'border-white/10' : 'border-stone-200'}`}>
                      <input type="radio" name="payment" value={m} checked={paymentMethod === m} onChange={() => setPaymentMethod(m)} className="w-3.5 h-3.5" />
                      <span className="font-sans text-xs">{m === 'online' ? '💳 Pay Online' : '💵 Cash on Arrival'}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Concern */}
            <div>
              <label className="font-sans text-xs text-stone-400 uppercase tracking-wider block mb-1.5">Describe Your Concern</label>
              <textarea value={concern} onChange={e => setConcern(e.target.value)} rows={3}
                placeholder="Brief description of your health concern…" className={inputCls + ' resize-none'} />
            </div>

            {/* Error */}
            {status === 'error' && (
              <p className="font-sans text-xs text-red-400 text-center">{errorMsg}</p>
            )}

            <button type="submit" disabled={status === 'loading'}
              className="btn-glass w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50">
              {status === 'loading' ? <><span className="animate-spin">⟳</span> Processing…</> : paymentMethod === 'cod' ? 'Confirm Booking →' : 'Book & Pay →'}
            </button>

            <p className="font-sans text-xs text-stone-400 text-center">
              By booking you agree to our terms. Questions? <a href="tel:+919821224767" className="text-brand">+91-9821224767</a>
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
