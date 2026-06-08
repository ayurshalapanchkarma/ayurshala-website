'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import GlassBackground from '@/components/GlassBackground'
import { supabase } from '@/lib/supabase'
import { Suspense } from 'react'

type BookingData = {
  booking_id: string; preferred_date: string; preferred_time: string
  booking_type: string; patients: { full_name: string; patient_id: string; email: string }
  booking_treatments: { treatment_name: string }[]
}

function ConfirmedContent() {
  const params = useSearchParams()
  const bookingId = params.get('booking_id')
  const [booking, setBooking] = useState<BookingData | null>(null)

  useEffect(() => {
    if (!bookingId) return
    supabase.from('bookings_v2').select('*, patients(*), booking_treatments(treatment_name)')
      .eq('booking_id', bookingId).single()
      .then(({ data }) => setBooking(data as any))
  }, [bookingId])

  const amount = booking?.booking_type === 'consultation' ? 500 : 1000
  const formattedDate = booking?.preferred_date
    ? new Date(booking.preferred_date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '—'

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg,#fdf6ee,#ffecd2,#e8f5ee,#fff8f0)' }}>
      <GlassBackground />
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}
        className="relative rounded-3xl p-10 text-center max-w-md w-full"
        style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(40px)', border: '1.5px solid rgba(255,255,255,0.85)', boxShadow: '0 32px 100px rgba(232,98,26,0.18)' }}>

        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">✓</span>
        </div>

        <Image src="/ayurshala_text.png" alt="Ayurshala" width={160} height={48} className="object-contain h-12 w-auto mx-auto mb-4" />
        <h1 className="font-serif text-3xl mb-1" style={{ color: '#1a1008' }}>Booking Confirmed</h1>
        <p className="font-sans text-sm text-stone-400 mb-8">Your healing journey begins here</p>

        {booking ? (
          <div className="rounded-2xl overflow-hidden border border-brand/15 mb-8 text-left">
            {[
              ['Patient', booking.patients?.full_name],
              ['Patient ID', booking.patients?.patient_id],
              ['Booking ID', booking.booking_id],
              ['Treatment', booking.booking_treatments?.map(t => t.treatment_name).join(', ') || '—'],
              ['Date', formattedDate],
              ['Time', booking.preferred_time],
              ['Amount Paid', `₹${amount}`],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between px-4 py-3 border-b border-brand/08 last:border-0 bg-brand/[0.02]">
                <span className="font-sans text-xs text-stone-400 uppercase tracking-wider">{label}</span>
                <span className="font-sans text-sm font-medium text-stone-700">{value}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="font-sans text-sm text-stone-400 mb-8">Loading booking details…</p>
        )}

        <div className="flex gap-3">
          <Link href="/my-bookings" className="btn-glass flex-1 text-sm py-3">My Bookings</Link>
          <Link href="/" className="btn-glass flex-1 text-sm py-3">Home</Link>
        </div>
      </motion.div>
    </div>
  )
}

export default function ConfirmedPage() {
  return <Suspense><ConfirmedContent /></Suspense>
}
