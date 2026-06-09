'use client'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { User, Mail, Phone, Calendar, Clock, CheckCircle, AlertCircle, Loader, Home } from 'lucide-react'
import GlassBackground from '@/components/GlassBackground'
import { supabase } from '@/lib/supabase'
import type { User as AuthUser } from '@supabase/supabase-js'

const therapies = [
  'TEST - ₹1 (Remove later)',
  'Shirodhara', 'Abhyanga', 'Swedana', 'Vamana', 'Virechana',
  'Basti', 'Nasya', 'Raktamokshana', 'Kati Basti', 'Greeva Basti',
  'Janu Basti', 'Shiro Basti', 'Uro Basti', 'Shiro Taila Dhara',
  'Nasya Dhoompana', 'Karan Purana', 'Anuvasana Basti',
  'PRP Therapy', 'Regeneration Medicine',
]

const timeSlots = ['10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM']

type Patient = { id: string; patient_id: string; email: string; full_name: string; phone: string; avatar_url?: string }
type Status = 'idle' | 'loading' | 'error'

type FormErrors = { guestName?: string; guestEmail?: string; guestPhone?: string }

export default function BookPage() {
  const [user, setUser] = useState<AuthUser | null>(null)
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
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  const dark = mounted && theme === 'dark'
  const today = new Date().toISOString().split('T')[0]
  const maxDate = new Date(); maxDate.setDate(maxDate.getDate() + 90)
  const maxDateStr = maxDate.toISOString().split('T')[0]
  const nowMins = new Date().getHours() * 60 + new Date().getMinutes()
  const slotMins = (s: string) => { const [t, p] = s.split(' '); let [h, m] = t.split(':').map(Number); if (p === 'PM' && h !== 12) h += 12; if (p === 'AM' && h === 12) h = 0; return h * 60 + m }
  const availableSlots = date === today ? timeSlots.filter(s => slotMins(s) > nowMins + 30) : timeSlots

  const handleTherapyToggle = (t: string, checked: boolean) => {
    setSelectedTreatments(prev => checked ? [...prev, t] : prev.filter(x => x !== t))
  }

  const handleConsultationToggle = (checked: boolean) => {
    setIsConsultation(checked)
  }

  const consultationAdvance = isConsultation ? 500 : 0
  const therapyAdvance = selectedTreatments.length > 0 ? (selectedTreatments.includes('TEST - ₹1 (Remove later)') ? 1 : 500) : 0
  const amount = consultationAdvance + therapyAdvance
  const [paymentMethod, setPaymentMethod] = useState<'ONLINE' | 'CASH_ON_ARRIVAL'>('ONLINE')
  const activePatient = patient || guestPatient

  const validateGuestName = (name: string): boolean => {
    const trimmed = name.trim()
    if (!trimmed) { setFormErrors(p => ({ ...p, guestName: 'Name is required' })); return false }
    if (trimmed.length < 2) { setFormErrors(p => ({ ...p, guestName: 'Name must be at least 2 characters' })); return false }
    if (trimmed.length > 50) { setFormErrors(p => ({ ...p, guestName: 'Name cannot exceed 50 characters' })); return false }
    if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) { setFormErrors(p => ({ ...p, guestName: 'Name can only contain letters, spaces, hyphens, and apostrophes' })); return false }
    setFormErrors(p => ({ ...p, guestName: undefined }))
    return true
  }

  const validateGuestEmail = (email: string): boolean => {
    const trimmed = email.trim()
    if (!trimmed) { setFormErrors(p => ({ ...p, guestEmail: 'Email is required' })); return false }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { setFormErrors(p => ({ ...p, guestEmail: 'Enter a valid email address' })); return false }
    if (trimmed.length > 100) { setFormErrors(p => ({ ...p, guestEmail: 'Email cannot exceed 100 characters' })); return false }
    setFormErrors(p => ({ ...p, guestEmail: undefined }))
    return true
  }

  const validatePhone = (p: string) => {
    if (!/^[6-9]\d{9}$/.test(p)) { setPhoneError('Enter valid 10-digit mobile (starting 6-9)'); return false }
    setPhoneError(''); return true
  }

  const validateGuestPhone = (phone: string): boolean => {
    if (!phone) { setFormErrors(p => ({ ...p, guestPhone: 'Phone is required' })); return false }
    if (!/^[6-9]\d{9}$/.test(phone)) { setFormErrors(p => ({ ...p, guestPhone: 'Enter valid 10-digit mobile (starting 6-9)' })); return false }
    setFormErrors(p => ({ ...p, guestPhone: undefined }))
    return true
  }

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
      window.location.href = '/book/failed'
    }

    return () => subscription.unsubscribe()
  }, [])

  async function loadOrCreatePatient(u: AuthUser) {
    const res = await fetch(`/api/patient?email=${encodeURIComponent(u.email!)}`)
    const { patient: existing } = await res.json()
    if (existing) { setPatient(existing); setPhone(existing.phone || ''); return }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate guest fields if not logged in
    if (!user) {
      if (!validateGuestName(guestName)) return
      if (!validateGuestEmail(guestEmail)) return
      if (!validateGuestPhone(guestPhone)) return
    } else if (!validatePhone(phone)) return
    
    if (!date) { alert('Please select a date.'); return }
    if (new Date(date).getUTCDay() === 5) { alert('We are closed on Fridays. Please choose another day.'); return }
    if (!time) { alert('Please select a time slot.'); return }
    if (!isConsultation && selectedTreatments.length === 0) { alert('Please select at least one treatment or consultation.'); return }

    setStatus('loading')
    setErrorMsg('')

    try {
      let currentPatient = activePatient

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

      if (patient && phone !== patient.phone) {
        await fetch('/api/patient', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: patient.email, phone }) })
      }

      const treatments = [
        ...(isConsultation ? ['Consultation'] : []),
        ...selectedTreatments,
      ]
      const orderRes = await fetch('/api/book', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-order',
          patient_uuid: currentPatient.id,
          patient_id: currentPatient.patient_id,
          treatments,
          preferred_date: date,
          preferred_time: time,
          concern: concern.trim(),
          booking_type: isConsultation && selectedTreatments.length > 0 ? 'consultation_and_therapy' : isConsultation ? 'consultation' : 'therapy',
          payment_method: paymentMethod,
        }),
      })
      const orderData = await orderRes.json()
      if (!orderRes.ok) { setStatus('error'); setErrorMsg(orderData.error || 'Failed to create booking.'); return }

      if (paymentMethod === 'CASH_ON_ARRIVAL') {
        await fetch('/api/book', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'confirm-booking', booking_id: orderData.bookingId, cashfree_order_id: orderData.bookingId, payment_method: 'CASH_ON_ARRIVAL' }),
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
    <div className="min-h-screen px-4 sm:px-6 py-12 sm:py-16 relative overflow-hidden"
      style={{ background: dark ? 'linear-gradient(135deg,#0a0f0a,#1a1008)' : 'linear-gradient(135deg,#fdf6ee,#ffecd2,#fff8f0)' }}>
      <GlassBackground />
      <div className="absolute top-[10%] left-[5%] w-[500px] h-[500px] rounded-full opacity-40 pointer-events-none animate-blob1"
        style={{ background: 'radial-gradient(circle,#4a7c59 0%,transparent 70%)' }} />
      <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] rounded-full opacity-35 pointer-events-none animate-blob2"
        style={{ background: 'radial-gradient(circle,#E8621A 0%,transparent 70%)' }} />

      <div className="max-w-lg mx-auto relative">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16,1,0.3,1] }}
          className="rounded-3xl p-5 sm:p-8 relative overflow-hidden"
          style={{
            background: dark
              ? 'linear-gradient(135deg,rgba(255,255,255,0.07) 0%,rgba(255,248,240,0.05) 50%,rgba(255,235,210,0.04) 100%)'
              : 'linear-gradient(135deg,rgba(255,255,255,0.75) 0%,rgba(255,248,240,0.55) 50%,rgba(255,235,210,0.45) 100%)',
            backdropFilter: 'blur(40px) saturate(1.8)',
            WebkitBackdropFilter: 'blur(40px) saturate(1.8)',
            border: dark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(255,255,255,0.85)',
            boxShadow: dark
              ? '0 20px 80px rgba(232,98,26,0.08),0 4px 24px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.1)'
              : '0 20px 80px rgba(232,98,26,0.12),0 4px 24px rgba(0,0,0,0.08),inset 0 1px 0 rgba(255,255,255,1)',
          }}>
          {/* Glows */}
          <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% -10%,rgba(232,98,26,0.18) 0%,transparent 65%)' }} />
          <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{ background: 'radial-gradient(ellipse at 0% 120%,rgba(13,148,136,0.10) 0%,transparent 60%)' }} />
          <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{ background: 'radial-gradient(ellipse at 100% 110%,rgba(245,166,35,0.10) 0%,transparent 60%)' }} />

          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-8 relative">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link href="/"><Image src="/ayurshala_text.png" alt="Ayurshala" width={260} height={72} className="object-contain h-14 sm:h-20 w-auto mx-auto mb-3 sm:mb-4 drop-shadow-lg hover:drop-shadow-2xl transition-all" /></Link>
            </motion.div>
            <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="font-serif text-2xl sm:text-3xl mb-1 font-light" style={{ color: '#E8621A' }}>Book an Appointment</motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="font-sans text-stone-400 text-sm">✨ We'll confirm within a few hours.</motion.p>
          </motion.div>

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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="space-y-4 mb-6">
              <button type="button" onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback?next=/book` } })}
                className="w-full btn-glass py-3 flex items-center justify-center gap-2 text-sm hover:scale-105 transition-transform">
                <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Sign in with Google
              </button>
              <div className="relative flex items-center gap-3">
                <div className={`flex-1 h-px ${dark ? 'bg-white/10' : 'bg-stone-200'}`} />
                <span className="font-sans text-xs text-stone-400">or continue without Google</span>
                <div className={`flex-1 h-px ${dark ? 'bg-white/10' : 'bg-stone-200'}`} />
              </div>
              <div>
                <input value={guestName} onChange={e => { setGuestName(e.target.value); validateGuestName(e.target.value) }} 
                  placeholder="Full Name *" className={`${inputCls} ${formErrors.guestName ? 'border-red-400' : ''}`} />
                {formErrors.guestName && <p className="font-sans text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {formErrors.guestName}</p>}
              </div>
              <div>
                <input value={guestEmail} onChange={e => { setGuestEmail(e.target.value); validateGuestEmail(e.target.value); if (e.target.value.includes('@')) checkGuestEmail(e.target.value) }}
                  placeholder="Email Address *" type="email" className={`${inputCls} ${formErrors.guestEmail ? 'border-red-400' : ''}`} />
                {checkingGuest && <p className="font-sans text-xs text-stone-400 mt-1 flex items-center gap-1"><Loader className="w-3 h-3 animate-spin" /> Checking…</p>}
                {guestPatient && <p className="font-sans text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Welcome back! Patient ID: <strong>{guestPatient.patient_id}</strong></p>}
                {formErrors.guestEmail && <p className="font-sans text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {formErrors.guestEmail}</p>}
              </div>
              <div>
                <input value={guestPhone} onChange={e => { setGuestPhone(e.target.value); if (e.target.value.length === 10) validateGuestPhone(e.target.value) }}
                  placeholder="Phone Number *" type="tel" maxLength={10} className={`${inputCls} ${formErrors.guestPhone ? 'border-red-400' : ''}`} />
                {formErrors.guestPhone && <p className="font-sans text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {formErrors.guestPhone}</p>}
              </div>
            </motion.div>
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
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <label className="font-sans text-xs text-stone-400 uppercase tracking-wider block mb-3">Select Treatment *</label>

              {/* Consultation */}
              <motion.label whileHover={{ scale: 1.02 }} className={`flex items-center gap-3 rounded-xl px-4 py-3 mb-3 cursor-pointer border transition-all ${isConsultation ? 'border-brand/40 bg-brand/10' : dark ? 'border-white/10 hover:border-white/20' : 'border-stone-200 hover:border-brand/30'}`}>
                <input type="checkbox" className="w-4 h-4 accent-brand" checked={isConsultation}
                  onChange={e => handleConsultationToggle(e.target.checked)} />
                <span className="font-sans text-sm font-medium">Consultation</span>
                <span className="font-sans text-xs text-stone-400 ml-auto font-semibold">₹500</span>
              </motion.label>

              {/* Therapies */}
              <div className={`rounded-xl border p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 ${dark ? 'border-white/10 bg-white/3' : 'border-stone-200 bg-stone-50/50'}`}>
                {therapies.map((t, i) => (
                  <motion.label key={t} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }} whileHover={{ scale: 1.03 }} className="flex items-center gap-2 cursor-pointer py-2 px-2 rounded-lg hover:bg-brand/5 transition-colors">
                    <input type="checkbox" className="w-3.5 h-3.5 accent-brand flex-shrink-0 cursor-pointer"
                      checked={selectedTreatments.includes(t)}
                      onChange={e => handleTherapyToggle(t, e.target.checked)} />
                    <span className="font-sans text-xs flex-1">{t}</span>
                  </motion.label>
                ))}
              </div>
              {selectedTreatments.length === 0 && !isConsultation && <p className="font-sans text-xs text-amber-600 mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Select at least one treatment or consultation</p>}
            </motion.div>

            {/* Date + Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-sans text-xs text-stone-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1"><Calendar className="w-3 h-3" /> Date *</label>
                <input value={date} onChange={e => { setDate(e.target.value); if (time && e.target.value === today && slotMins(time) <= nowMins + 30) setTime('') }}
                  type="date" min={today} max={maxDateStr} className={inputCls}
                  onKeyDown={e => e.preventDefault()} />
                {date && new Date(date).getUTCDay() === 5 && (
                  <p className="font-sans text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Closed on Fridays. Please choose another day.</p>
                )}
              </div>
              <div>
                <label className="font-sans text-xs text-stone-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1"><Clock className="w-3 h-3" /> Time *</label>
                <select value={time} onChange={e => setTime(e.target.value)} className={inputCls + ' cursor-pointer'}>
                  <option value="">Select time…</option>
                  {availableSlots.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {date === today && availableSlots.length === 0 && (
                  <p className="font-sans text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> No slots today. Choose another date.</p>
                )}
              </div>
            </div>

            {/* Payment summary + method */}
            {(isConsultation || selectedTreatments.length > 0) && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className={`rounded-xl p-4 border ${dark ? 'border-white/10 bg-white/5' : 'border-brand/15 bg-brand/5'}`}>
                <p className="font-sans text-sm font-medium mb-3 flex items-center gap-2" style={{ color: dark ? '#f5f0e8' : '#1a1008' }}>
                  {isConsultation && selectedTreatments.length > 0 ? (
                    <><Mail className="w-4 h-4" style={{ color: '#E8621A' }} /> Advance: <strong style={{ color: '#E8621A' }}>₹{amount}</strong> <span className="text-xs text-stone-400">(Consultation ₹500 + Therapy ₹500)</span></>
                  ) : isConsultation ? (
                    <><Mail className="w-4 h-4" style={{ color: '#E8621A' }} /> Consultation Advance: <strong style={{ color: '#E8621A' }}>₹500</strong></>
                  ) : (
                    <><Mail className="w-4 h-4" style={{ color: '#E8621A' }} /> Therapy Advance: <strong style={{ color: '#E8621A' }}>₹500</strong> <span className="text-xs text-stone-400">(remaining after consultation)</span></>
                  )}
                </p>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {(['ONLINE', 'CASH_ON_ARRIVAL'] as const).map(m => (
                    <motion.label key={m} whileHover={{ scale: 1.02 }} className={`flex items-center gap-2 cursor-pointer p-2.5 rounded-xl border transition-all ${paymentMethod === m ? 'border-brand/40 bg-brand/10' : dark ? 'border-white/10 hover:border-white/20' : 'border-stone-200 hover:border-brand/30'}`}>
                      <input type="radio" name="payment" value={m} checked={paymentMethod === m} onChange={() => setPaymentMethod(m)} className="w-3.5 h-3.5 cursor-pointer" />
                      <span className="font-sans text-xs font-medium">{m === 'ONLINE' ? 'Pay Online' : 'On Arrival'}</span>
                    </motion.label>
                  ))}
                </div>
                {paymentMethod === 'CASH_ON_ARRIVAL' && (
                  <p className="font-sans text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2 flex items-center gap-1"><Clock className="w-3 h-3" /> Our team will call to confirm your appointment.</p>
                )}
              </motion.div>
            )}

            {/* Concern */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <label className="font-sans text-xs text-stone-400 uppercase tracking-wider block mb-1.5">Describe Your Concern</label>
              <textarea value={concern} onChange={e => setConcern(e.target.value.slice(0, 1000))} rows={3}
                placeholder="Brief description of your health concern…" className={inputCls + ' resize-none'} />
              <div className="flex justify-between items-center mt-1">
                <p className={`font-sans text-xs ${concern.length > 900 ? 'text-amber-500 font-semibold' : 'text-stone-400'}`}>{concern.length}/1000</p>
                {concern.length > 0 && <CheckCircle className="w-3 h-3 text-green-600" />}
              </div>
            </motion.div>

            {/* Error */}
            {status === 'error' && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="font-sans text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg p-3 text-center flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4" /> {errorMsg}
              </motion.div>
            )}

            <motion.button type="submit" disabled={status === 'loading'}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="btn-glass w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed font-semibold">
              {status === 'loading' ? (
                <><Loader className="w-4 h-4 animate-spin" /> Processing…</>
              ) : paymentMethod === 'CASH_ON_ARRIVAL' ? (
                <>< CheckCircle className="w-4 h-4" /> Confirm Booking</>
              ) : (
                <>Book & Pay ₹{amount} →</>
              )}
            </motion.button>

            <p className="font-sans text-xs text-stone-400 text-center leading-relaxed">
              By booking you agree to our terms. Questions? <a href="tel:+919821224767" className="font-semibold hover:text-brand transition-colors">+91-9821224767</a>
            </p>
            <motion.div whileHover={{ scale: 1.02 }}>
              <Link href="/" className="btn-glass w-full text-sm py-2.5 text-center block hover:brightness-110 flex items-center justify-center gap-2">
                <Home className="w-4 h-4" /> Back to Home
              </Link>
            </motion.div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
