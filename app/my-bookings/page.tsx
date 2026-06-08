'use client'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import Image from 'next/image'
import GlassBackground from '@/components/GlassBackground'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

type Booking = {
  id: string; booking_id: string; preferred_date: string; preferred_time: string
  booking_type: string; status: string; payment_status: string; created_at: string; concern: string
  booking_treatments: { treatment_name: string }[]
  payments: { amount: number }[]
}
type Patient = { id: string; patient_id: string; full_name: string; email: string; phone: string }

export default function MyBookingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [patient, setPatient] = useState<Patient | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const dark = mounted && theme === 'dark'

  useEffect(() => {
    setMounted(true)
    supabase.auth.getSession().then(async ({ data }) => {
      const u = data.session?.user ?? null
      setUser(u)
      if (u) await loadData(u)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) await loadData(u)
      else { setPatient(null); setBookings([]); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function loadData(u: User) {
    const res = await fetch(`/api/patient?email=${encodeURIComponent(u.email!)}`)
    const { patient: p } = await res.json()
    setPatient(p)
    if (p) {
      const { data } = await supabase.from('bookings_v2')
        .select('*, booking_treatments(treatment_name), payments(amount)')
        .eq('patient_uuid', p.id).order('created_at', { ascending: false })
      setBookings((data as any) || [])
    }
    setLoading(false)
  }

  const statusColors: Record<string, string> = {
    CONFIRMED: 'bg-green-100 text-green-700',
    PAYMENT_PENDING: 'bg-amber-100 text-amber-700',
    CANCELLED: 'bg-red-100 text-red-700',
    COMPLETED: 'bg-blue-100 text-blue-700',
    IN_PROGRESS: 'bg-purple-100 text-purple-700',
    NO_SHOW: 'bg-stone-100 text-stone-600',
  }

  return (
    <div className="min-h-screen px-6 py-24 relative overflow-hidden"
      style={{ background: dark ? 'linear-gradient(135deg,#0a0f0a,#1a1008)' : 'linear-gradient(135deg,#fdf6ee,#ffecd2,#fff8f0)' }}>
      <GlassBackground />
      <div className="max-w-2xl mx-auto relative">
        <Link href="/"><Image src="/ayurshala_text.png" alt="Ayurshala" width={160} height={48} className="object-contain h-12 w-auto mb-8" /></Link>

        {patient && (
          <div className={`rounded-2xl p-4 mb-6 border flex items-center gap-4 ${dark ? 'border-white/10 bg-white/5' : 'border-brand/15 bg-brand/5'}`}>
            <div className="flex-1">
              <p className="font-sans text-sm font-semibold" style={{ color: '#E8621A' }}>{patient.full_name}</p>
              <p className="font-sans text-xs text-stone-400">{patient.email}</p>
            </div>
            <div className="text-right">
              <p className="font-sans text-xs text-stone-400">Patient ID</p>
              <p className="font-sans text-sm font-bold" style={{ color: '#E8621A' }}>{patient.patient_id}</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <h1 className="font-serif text-3xl" style={{ color: '#E8621A' }}>My Bookings</h1>
          <Link href="/book" className="btn-glass text-xs py-2 px-5">+ New Booking</Link>
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
          {bookings.map(b => (
            <div key={b.id} className={`rounded-2xl p-5 border ${dark ? 'border-white/10 bg-white/5' : 'border-brand/12 bg-white/60'}`}>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="font-sans text-xs text-stone-400 mb-0.5">{b.booking_id}</p>
                  <p className="font-sans text-sm font-semibold" style={{ color: '#E8621A' }}>
                    {b.booking_treatments?.map(t => t.treatment_name).join(', ') || '—'}
                  </p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-sans flex-shrink-0 ${statusColors[b.status] || 'bg-stone-100 text-stone-600'}`}>
                  {b.status.replace('_', ' ')}
                </span>
              </div>
              <div className="flex flex-wrap gap-3 text-xs font-sans text-stone-400">
                {b.preferred_date && <span>📅 {new Date(b.preferred_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                {b.preferred_time && <span>🕐 {b.preferred_time}</span>}
                {b.payments?.[0] && b.status === 'CONFIRMED' && <span>💳 ₹{b.payments[0].amount} paid</span>}
              </div>
              {b.concern && <p className="font-sans text-xs text-stone-400 mt-2"><span className="uppercase tracking-wider">Concern:</span> {b.concern}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
