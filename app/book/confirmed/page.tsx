'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import GlassBackground from '@/components/GlassBackground'
import { supabase } from '@/lib/supabase'
import { useTheme } from 'next-themes'
import { Suspense } from 'react'

type BookingData = {
  booking_id: string; preferred_date: string; preferred_time: string
  booking_type: string; payment_status: string
  patients: { full_name: string; patient_id: string; email: string }
  booking_treatments_v2: { treatment_name: string }[]
}

function ConfirmedContent() {
  const params = useSearchParams()
  const bookingId = params.get('booking_id')
  const [booking, setBooking] = useState<BookingData | null>(null)
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  const dark = mounted && theme === 'dark'

  useEffect(() => {
    if (!bookingId) return
    supabase.from('bookings_new').select('*, patients(*), booking_treatments_v2(treatment_name)')
      .eq('booking_id', bookingId).single()
      .then(({ data }) => setBooking(data as any))
  }, [bookingId])

  const formattedDate = booking?.preferred_date
    ? new Date(booking.preferred_date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '—'

  const paymentStatus = booking?.payment_status
  const isCod = paymentStatus === 'COD_PENDING'
  const paymentLabel = paymentStatus === 'SUCCESS'
    ? '✓ ₹500 Paid Online'
    : isCod
    ? '⏳ Cash on Arrival — Payment Pending'
    : paymentStatus === 'THERAPY_LATER'
    ? 'ℹ Payment decided after doctor consultation'
    : '—'

  const paymentColor = paymentStatus === 'SUCCESS' ? '#16a34a' : isCod ? '#d97706' : '#6b7280'

  const titleText = isCod ? 'Booking Received' : 'Booking Confirmed'
  const subtitleText = isCod
    ? 'Our team will call you to confirm your appointment 🙏'
    : 'Your healing journey begins here 🌿'

  return (
    <div className="min-h-screen px-6 py-16 relative overflow-hidden flex items-center justify-center"
      style={{ background: dark ? 'linear-gradient(135deg,#0a0f0a,#1a1008)' : 'linear-gradient(135deg,#fdf6ee,#ffecd2,#fff8f0)' }}>
      <GlassBackground />
      <div className="absolute top-[10%] left-[5%] w-[500px] h-[500px] rounded-full opacity-40 pointer-events-none animate-blob1"
        style={{ background: 'radial-gradient(circle,#4a7c59 0%,transparent 70%)' }} />
      <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] rounded-full opacity-35 pointer-events-none animate-blob2"
        style={{ background: 'radial-gradient(circle,#E8621A 0%,transparent 70%)' }} />

      <div className="max-w-md w-full relative">
        <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16,1,0.3,1] }}
          className="rounded-3xl p-8 relative overflow-hidden"
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
          <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% -10%,rgba(22,163,74,0.15) 0%,transparent 60%)' }} />
          <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{ background: 'radial-gradient(ellipse at 0% 120%,rgba(13,148,136,0.08) 0%,transparent 60%)' }} />
          <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{ background: 'radial-gradient(ellipse at 100% 110%,rgba(232,98,26,0.08) 0%,transparent 60%)' }} />

          {/* Success icon */}
          <div className="flex justify-center mb-5">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: isCod ? 'linear-gradient(135deg,rgba(217,119,6,0.15),rgba(217,119,6,0.25))' : 'linear-gradient(135deg,rgba(22,163,74,0.15),rgba(22,163,74,0.25))', border: `1.5px solid ${isCod ? 'rgba(217,119,6,0.3)' : 'rgba(22,163,74,0.3)'}` }}>
              <span className="text-3xl">✓</span>
            </motion.div>
          </div>

          <div className="text-center mb-6">
            <Image src="/ayurshala_text.png" alt="Ayurshala" width={200} height={56} className="object-contain h-14 w-auto mx-auto mb-3" />
            <h1 className="font-serif text-3xl mb-1" style={{ color: '#E8621A' }}>{titleText}</h1>
            <p className="font-sans text-sm text-stone-400">{subtitleText}</p>
          </div>

          {booking ? (
            <div className={`rounded-2xl overflow-hidden mb-6 border ${dark ? 'border-white/10' : 'border-brand/15'}`}>
              {([
                ['Patient', booking.patients?.full_name],
                ['Patient ID', booking.patients?.patient_id],
                ['Booking ID', booking.booking_id],
                ['Treatment', booking.booking_treatments_v2?.map((t: any) => t.treatment_name).join(', ') || '—'],
                ['Date', formattedDate],
                ['Time', booking.preferred_time],
                ['Payment', paymentLabel],
              ] as [string, string][]).map(([label, value], i, arr) => (
                <div key={label}
                  className={`flex justify-between items-start px-4 py-3 gap-4 ${i < arr.length - 1 ? (dark ? 'border-b border-white/06' : 'border-b border-brand/08') : ''}`}
                  style={{ background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(232,98,26,0.02)' }}>
                  <span className="font-sans text-xs text-stone-400 uppercase tracking-wider shrink-0">{label}</span>
                  <span className="font-sans text-sm font-medium text-right"
                    style={{ color: label === 'Payment' ? paymentColor : label === 'Patient ID' || label === 'Booking ID' ? '#E8621A' : dark ? '#e7e5e4' : '#1a1008' }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className={`rounded-2xl p-6 mb-6 text-center border ${dark ? 'border-white/10 bg-white/5' : 'border-brand/15 bg-brand/5'}`}>
              <p className="font-sans text-sm text-stone-400">Loading booking details…</p>
            </div>
          )}

          <div className="flex gap-3">
            <Link href="/my-bookings" className="btn-glass flex-1 text-sm py-3 text-center">My Bookings</Link>
            <Link href="/" className="btn-glass flex-1 text-sm py-3 text-center">Home</Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function ConfirmedPage() {
  return <Suspense><ConfirmedContent /></Suspense>
}
