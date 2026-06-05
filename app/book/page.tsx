'use client'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import GlassBackground from '@/components/GlassBackground'

const treatments = [
  'Shirodhara', 'Abhyanga', 'Swedana', 'Vamana', 'Virechana',
  'Basti', 'Nasya', 'Raktamokshana', 'Kati Basti', 'Greeva Basti',
  'Janu Basti', 'Shiro Basti', 'Uro Basti', 'Shiro Taila Dhara',
  'Nasya Dhoompana', 'Karan Purana', 'Anuvasana Basti',
  'PRP Therapy', 'Regeneration Medicine', 'Not sure / Consultation',
]

const timeSlots = [
  '10:00 AM', '11:00 AM', '12:00 PM',
  '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM',
]

type Status = 'idle' | 'loading' | 'success' | 'error'

export default function BookPage() {
  const [form, setForm] = useState({
    name: '', phone: '', email: '', treatment: '', date: '', time: '', concern: '', paymentMethod: 'online',
  })
  const [status, setStatus] = useState<Status>('idle')
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const dark = mounted && theme === 'dark'

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')

    try {
      if (form.paymentMethod === 'cod') {
        // COD: Just send confirmation email
        const confirmRes = await fetch('/api/book', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, action: 'confirm-booking' }),
        })
        if (!confirmRes.ok) throw new Error()
        setStatus('success')
        return
      }

      // Online payment via Razorpay
      const orderRes = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, action: 'create-order' }),
      })
      if (!orderRes.ok) throw new Error('Failed to create order')
      const { orderId } = await orderRes.json()

      // Open Razorpay payment modal
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.onload = () => {
        const options = {
          key: 'rzp_test_SwiYwAyNCZWP6N',
          order_id: orderId,
          amount: 50000,
          currency: 'INR',
          name: 'Ayurshala Panchakarma',
          description: form.treatment,
          prefill: {
            name: form.name,
            email: form.email,
            contact: form.phone,
          },
          handler: async (response: any) => {
            try {
              const confirmRes = await fetch('/api/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...form,
                  action: 'confirm-booking',
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpayOrderId: response.razorpay_order_id,
                }),
              })
              if (!confirmRes.ok) throw new Error()
              setStatus('success')
            } catch {
              setStatus('error')
            }
          },
          theme: { color: '#E8621A' },
        }
        const rzp = new (window as any).Razorpay(options)
        rzp.on('payment.failed', () => setStatus('error'))
        rzp.open()
      }
      document.body.appendChild(script)
    } catch {
      setStatus('error')
    }
  }

  const inputCls = `w-full glass rounded-xl px-4 py-3 font-sans text-sm bg-transparent placeholder-stone-400 focus:outline-none focus:border-brand/50 transition-colors border ${dark ? 'text-stone-200 border-white/10' : 'text-stone-700 border-stone-200'}`

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #fdf6ee 0%, #ffecd2 30%, #e8f5ee 65%, #fff8f0 100%)' }}
      >
        <GlassBackground />
        {/* Blobs */}
        <div className="animate-blob1 absolute top-[10%] left-[5%] w-[500px] h-[500px] rounded-full opacity-40 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #4a7c59 0%, transparent 70%)' }} />
        <div className="animate-blob2 absolute bottom-[10%] right-[5%] w-[400px] h-[400px] rounded-full opacity-35 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #E8621A 0%, transparent 70%)' }} />
        <div className="absolute top-[40%] right-[15%] w-[300px] h-[300px] rounded-full opacity-30 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #f5a623 0%, transparent 70%)' }} />
        <div className="absolute top-[60%] left-[20%] w-[250px] h-[250px] rounded-full opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #0d9488 0%, transparent 70%)' }} />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative rounded-3xl p-12 text-center max-w-md w-full"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.88) 0%, rgba(255,248,240,0.72) 40%, rgba(255,235,210,0.60) 100%)',
            boxShadow: '0 32px 100px rgba(232,98,26,0.18), 0 8px 32px rgba(0,0,0,0.10), inset 0 2px 0 rgba(255,255,255,1), inset 0 -1px 0 rgba(255,255,255,0.3)',
            backdropFilter: 'blur(40px) saturate(1.8)',
            WebkitBackdropFilter: 'blur(40px) saturate(1.8)',
            border: '1.5px solid rgba(255,255,255,0.85)',
          }}
        >
          {/* Shine streak */}
          <div className="absolute inset-0 rounded-3xl pointer-events-none overflow-hidden">
            <div style={{
              position: 'absolute', top: '-40%', left: '-20%',
              width: '60%', height: '180%',
              background: 'linear-gradient(105deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 60%)',
              transform: 'skewX(-15deg)',
            }} />
          </div>
          <div className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(232,98,26,0.18) 0%, transparent 60%)' }} />
          <div className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 0% 100%, rgba(13,148,136,0.10) 0%, transparent 60%)' }} />
          <div className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 100% 100%, rgba(245,166,35,0.10) 0%, transparent 60%)' }} />

          <div className="relative">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className="mb-6 flex justify-center"
            >
              <Image src="/ayurshala_text_transparent.png" alt="Ayurshala" width={240} height={68} className="object-contain h-20 w-auto" />
            </motion.div>
            <h2 className="font-serif text-3xl mb-3" style={{ color: '#1a1008' }}>Booking Received</h2>
            <p className="font-sans text-stone-500 text-sm leading-relaxed mb-8">
              Your appointment request has been sent via email and WhatsApp. We'll confirm your slot within a few hours.
            </p>
            <Link href="/" className="btn-glass inline-block">Back to Home</Link>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-24 px-6 relative overflow-hidden">
      <GlassBackground />
      <div className="max-w-2xl mx-auto relative z-10">
        {/* Back link */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
          <Link href="/" className="font-sans text-xs text-stone-400 hover:text-brand transition-colors tracking-wider">
            ← Back to Home
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="glass-strong rounded-3xl p-8 md:p-12 relative"
          style={{
            background: dark
              ? 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,248,240,0.06) 50%, rgba(255,235,210,0.05) 100%)'
              : 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,248,240,0.15) 50%, rgba(255,235,210,0.10) 100%)',
            boxShadow: dark
              ? '0 20px 80px rgba(232,98,26,0.06), 0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)'
              : '0 20px 80px rgba(232,98,26,0.08), 0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.5)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.3)',
          }}
        >
          <div className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(232,98,26,0.12) 0%, transparent 60%)' }} />
          <div className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 0% 100%, rgba(13,148,136,0.07) 0%, transparent 60%)' }} />
          <div className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 100% 100%, rgba(245,166,35,0.07) 0%, transparent 60%)' }} />

          <div className="text-center mb-10">
            <Image src="/ayurshala_text_transparent.png" alt="Ayurshala" width={300} height={84} className="object-contain h-24 w-auto mx-auto mb-4" />
            <h1 className="font-serif text-4xl mb-2" style={{ color: '#E8621A' }}>Book an Appointment</h1>
            <p className="font-sans text-stone-400 text-sm">
              We'll confirm via WhatsApp &amp; email within a few hours.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name + Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-sans text-xs text-stone-400 uppercase tracking-wider block mb-1.5">Full Name *</label>
                <input required value={form.name} onChange={e => set('name', e.target.value)}
                  placeholder="Your name" className={inputCls} />
              </div>
              <div>
                <label className="font-sans text-xs text-stone-400 uppercase tracking-wider block mb-1.5">Phone *</label>
                <input required value={form.phone} onChange={e => set('phone', e.target.value)}
                  placeholder="+91 98765 43210" type="tel" className={inputCls} />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="font-sans text-xs text-stone-400 uppercase tracking-wider block mb-1.5">Email</label>
              <input value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="your@email.com" type="email" className={inputCls} />
            </div>

            {/* Treatment */}
            <div>
              <label className="font-sans text-xs text-stone-400 uppercase tracking-wider block mb-1.5">Treatment *</label>
              <select required value={form.treatment} onChange={e => set('treatment', e.target.value)}
                className={inputCls + ' cursor-pointer'}
              >
                <option value="" disabled>Select a treatment…</option>
                {treatments.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Date + Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-sans text-xs text-stone-400 uppercase tracking-wider block mb-1.5">Preferred Date</label>
                <input value={form.date} onChange={e => {
                  const day = new Date(e.target.value).getUTCDay()
                  if (day !== 5) set('date', e.target.value)
                }}
                  type="date" className={inputCls}
                  min={new Date().toISOString().split('T')[0]}
                />
                {form.date && new Date(form.date).getUTCDay() === 5 && (
                  <p className="font-sans text-xs text-red-400 mt-1">Ayurshala is closed on Fridays. Please choose another day.</p>
                )}
              </div>
              <div>
                <label className="font-sans text-xs text-stone-400 uppercase tracking-wider block mb-1.5">Preferred Time</label>
                <select value={form.time} onChange={e => set('time', e.target.value)}
                  className={inputCls + ' cursor-pointer'}>
                  <option value="">Any time</option>
                  {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Payment Method */}
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl border transition-all" 
                style={{
                  background: form.paymentMethod === 'online' ? 'rgba(232,98,26,0.1)' : 'transparent',
                  borderColor: form.paymentMethod === 'online' ? 'rgba(232,98,26,0.4)' : (dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
                }}>
                <input type="radio" name="payment" value="online" checked={form.paymentMethod === 'online'}
                  onChange={e => set('paymentMethod', e.target.value)} className="w-4 h-4" />
                <span className="font-sans text-sm">Online Payment</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl border transition-all"
                style={{
                  background: form.paymentMethod === 'cod' ? 'rgba(232,98,26,0.1)' : 'transparent',
                  borderColor: form.paymentMethod === 'cod' ? 'rgba(232,98,26,0.4)' : (dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
                }}>
                <input type="radio" name="payment" value="cod" checked={form.paymentMethod === 'cod'}
                  onChange={e => set('paymentMethod', e.target.value)} className="w-4 h-4" />
                <span className="font-sans text-sm">Cash on Arrival</span>
              </label>
            </div>

            {/* Concern */}
            <div>
              <label className="font-sans text-xs text-stone-400 uppercase tracking-wider block mb-1.5">Describe Your Concern</label>
              <textarea value={form.concern} onChange={e => set('concern', e.target.value)}
                rows={4} placeholder="Brief description of your health concern or what you'd like to address…"
                className={inputCls + ' resize-none'} />
            </div>

            {/* Error */}
            {status === 'error' && (
              <p className="font-sans text-xs text-red-400 text-center">
                Something went wrong. Please call us directly at +91-9821224767.
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={status === 'loading'}
              className="btn-glass w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {status === 'loading' ? (
                <><span className="animate-spin">⟳</span> Sending…</>
              ) : (
                <>Book Appointment →</>
              )}
            </button>

            <p className="font-sans text-xs text-stone-400 text-center leading-relaxed">
              Click "Book Appointment" to proceed with your booking.
            </p>
            <p className="font-sans text-xs font-sans text-center leading-relaxed" style={{ color: '#E8621A' }}>
              Please note: Ayurshala is <strong>closed every Friday</strong>. Bookings on Fridays will not be confirmed.
            </p>
          </form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 glass rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <p className="font-sans text-xs text-stone-400">Prefer to call or message directly?</p>
          <div className="flex gap-4">
            <a href="tel:+919821224767" className="font-sans text-xs text-brand/60 hover:text-brand transition-colors flex items-center gap-1">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
              </svg>
              +91-9821224767
            </a>
            <a href="https://wa.me/919821224767" target="_blank" rel="noopener noreferrer"
              className="font-sans text-xs text-brand/60 hover:text-brand transition-colors flex items-center gap-1">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
