'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle2, Home, Eye, User, Badge, FileText, Activity, Calendar, Clock, CreditCard } from 'lucide-react'
import GlassBackground from '@/components/GlassBackground'
import { supabase } from '@/lib/supabase'
import { useTheme } from 'next-themes'
import { Suspense } from 'react'

type BookingData = {
  booking_id: string; preferred_date: string; preferred_time: string
  booking_type: string; payment_status: string; payment_method: string
  patients: { full_name: string; patient_id: string; email: string }
  booking_treatments_v2: { treatment_name: string }[]
  payments?: { amount: number; status: string }[]
}

const iconMap: Record<string, any> = {
  'User': User, 'Badge': Badge, 'FileText': FileText, 'Activity': Activity,
  'Calendar': Calendar, 'Clock': Clock, 'CreditCard': CreditCard,
}

function BookingDetailRow({ label, value, icon, isLast, isPayment, isBookingId, paymentColor, dark }: any) {
  const IconComponent = iconMap[icon]
  return (
    <div className={`flex items-center gap-3 px-4 py-3 ${isLast ? '' : (dark ? 'border-b border-white/06' : 'border-b border-white/15')}`}
      style={{ background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.3)' }}>
      <IconComponent className="w-4 h-4 flex-shrink-0" style={{ color: isPayment ? paymentColor : '#E8621A' }} />
      <div className="flex-1 flex flex-col">
        <span className="font-sans text-xs text-stone-400 uppercase tracking-wider">{label}</span>
        <span className="font-sans text-sm font-medium" style={{ color: isPayment ? paymentColor : isBookingId ? '#E8621A' : dark ? '#e7e5e4' : '#1a1008' }}>
          {value}
        </span>
      </div>
    </div>
  )
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
    async function fetchBooking() {
      // Fetch via API route (uses service role — bypasses RLS)
      const res = await fetch(`/api/book/details?booking_id=${encodeURIComponent(bookingId!)}`)
      if (res.ok) {
        const { booking } = await res.json()
        setBooking(booking)
      }
    }
    fetchBooking()
  }, [bookingId])

  const formattedDate = booking?.preferred_date
    ? new Date(booking.preferred_date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '—'

  const paymentStatus = booking?.payment_status
  const isCod = booking?.payment_method === 'CASH_ON_ARRIVAL' || paymentStatus === 'PENDING'
  
  // Get actual payment amount from payments array
  const paymentAmount = booking?.payments?.[0]?.amount || (booking?.booking_type === 'consultation' ? 500 : 1000)
  const paymentLabel = paymentStatus === 'SUCCESS'
    ? `✓ ₹${paymentAmount} Paid Online`
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
    <div className="min-h-screen px-4 sm:px-6 py-16 sm:py-20 relative overflow-hidden flex items-center justify-center"
      style={{ background: dark ? 'linear-gradient(135deg,#0a0f0a,#1a1008)' : 'linear-gradient(135deg,#fdf6ee,#ffecd2,#fff8f0)' }}>
      <GlassBackground />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[10%] left-[5%] w-[500px] h-[500px] rounded-full opacity-40 pointer-events-none animate-blob1"
          style={{ background: 'radial-gradient(circle,#4a7c59 0%,transparent 70%)' }} />
        <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] rounded-full opacity-35 pointer-events-none animate-blob2"
          style={{ background: 'radial-gradient(circle,#E8621A 0%,transparent 70%)' }} />
      </div>

      <div className="max-w-md w-full relative">
        <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16,1,0.3,1] }}
          className={`rounded-3xl p-8 relative overflow-hidden backdrop-blur-2xl ${dark ? 'bg-white/5 border-white/10' : 'bg-white/20 border-white/30'} border`}
          style={{
            backdropFilter: 'blur(40px) saturate(1.8)',
            WebkitBackdropFilter: 'blur(40px) saturate(1.8)',
            boxShadow: '0 8px 32px rgba(255,165,0,0.08)',
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
              <CheckCircle2 className="w-8 h-8" style={{ color: isCod ? '#d97706' : '#16a34a' }} />
            </motion.div>
          </div>

          <div className="text-center mb-6">
            <Image src="/ayurshala_text.png" alt="Ayurshala" width={200} height={56} className="object-contain h-14 w-auto mx-auto mb-3" />
            <h1 className="font-serif text-3xl mb-1" style={{ color: '#E8621A' }}>{titleText}</h1>
            <p className="font-sans text-sm text-stone-400">{subtitleText}</p>
          </div>

          {booking ? (
            <div className={`rounded-2xl overflow-hidden mb-6 backdrop-blur-2xl border ${dark ? 'border-white/10 bg-white/5' : 'border-white/30 bg-white/20'}`}
              style={{ 
                boxShadow: '0 8px 32px rgba(255,165,0,0.08)',
                WebkitBackdropFilter: 'blur(50px) saturate(1.8)',
                backdropFilter: 'blur(50px) saturate(1.8)',
              }}>
              {([
                ['Patient', booking.patients?.full_name, 'User'],
                ['Patient ID', booking.patients?.patient_id, 'Badge'],
                ['Booking ID', booking.booking_id, 'FileText'],
                ['Treatment', booking.booking_treatments_v2?.map((t: any) => t.treatment_name).join(', ') || '—', 'Activity'],
                ['Date', formattedDate, 'Calendar'],
                ['Time', booking.preferred_time, 'Clock'],
                ['Payment', paymentLabel, 'CreditCard'],
              ] as any[]).map(([label, value, icon], i, arr) => (
                <BookingDetailRow key={label} label={label} value={value} icon={icon} 
                  isLast={i === arr.length - 1} isPayment={label === 'Payment'} 
                  isBookingId={label === 'Booking ID' || label === 'Patient ID'}
                  paymentColor={paymentColor} dark={dark} />
              ))}
            </div>
          ) : (
            <div className={`rounded-2xl p-6 mb-6 text-center backdrop-blur-2xl border ${dark ? 'border-white/10 bg-white/5' : 'border-white/30 bg-white/20'}`}
              style={{ boxShadow: '0 8px 32px rgba(255,165,0,0.08)' }}>
              <p className="font-sans text-sm text-stone-400">Loading booking details…</p>
            </div>
          )}

          <div className="flex gap-3">
            <Link href="/my-bookings" className="btn-glass flex-1 text-sm py-3 text-center flex items-center justify-center gap-2">
              <Eye className="w-4 h-4" /> My Bookings
            </Link>
            <Link href="/" className="btn-glass flex-1 text-sm py-3 text-center flex items-center justify-center gap-2">
              <Home className="w-4 h-4" /> Home
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function ConfirmedPage() {
  return <Suspense><ConfirmedContent /></Suspense>
}
