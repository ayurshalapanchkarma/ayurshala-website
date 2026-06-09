'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import GlassBackground from '@/components/GlassBackground'
import { useTheme } from 'next-themes'
import { supabase } from '@/lib/supabase'
import { Home } from 'lucide-react'

const ADMIN_EMAIL = 'ayurshalapanchkarma@gmail.com'

type Booking = {
  id: number; booking_id: string; preferred_date: string; preferred_time: string
  booking_type: string; status: string; payment_method: string; created_at: string
  patient_name: string; patient_id: string; patient_phone: string; treatments: string
}

const statusConfig: Record<string, { label: string; cls: string }> = {
  CONFIRMED:            { label: 'Confirmed',    cls: 'bg-green-100 text-green-700' },
  PENDING_CONFIRMATION: { label: 'Pending',      cls: 'bg-amber-100 text-amber-700' },
  CANCELLED:            { label: 'Cancelled',    cls: 'bg-red-100 text-red-600' },
  COMPLETED:            { label: 'Completed',    cls: 'bg-blue-100 text-blue-700' },
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [checking, setChecking] = useState(true)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'PENDING_CONFIRMATION' | 'ALL'>('PENDING_CONFIRMATION')
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => setMounted(true), [])
  const dark = mounted && theme === 'dark'

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    setUserEmail(user?.email || '')
    
    if (user?.email === ADMIN_EMAIL) {
      setAuthed(true)
      await fetchBookings()
    }
    setChecking(false)
  }

  async function fetchBookings() {
    setLoading(true)
    const res = await fetch(`/api/admin/bookings?status=${filter}`)
    const { bookings: data } = await res.json()
    setBookings(data || [])
    setLoading(false)
  }

  useEffect(() => { if (authed) fetchBookings() }, [filter])

  async function confirm(booking_id: string) {
    await fetch('/api/admin/bookings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'confirm', booking_id }),
    })
    fetchBookings()
  }

  async function cancel(booking_id: string) {
    await fetch('/api/admin/bookings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel', booking_id }),
    })
    fetchBookings()
  }

  const bg = dark ? 'linear-gradient(135deg,#0a0f0a,#1a1008)' : 'linear-gradient(135deg,#fdf6ee,#ffecd2,#fff8f0)'
  const cardStyle = {
    background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.72)',
    backdropFilter: 'blur(40px)', border: dark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(255,255,255,0.85)',
    boxShadow: '0 20px 80px rgba(232,98,26,0.12), 0 4px 24px rgba(0,0,0,0.08)',
  }

  if (checking) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: bg }}>
      <p className="font-sans text-stone-400">Checking access...</p>
    </div>
  )

  if (!authed) return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background: bg }}>
      <GlassBackground />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}
        className="w-full max-w-md rounded-3xl p-8 relative overflow-hidden" style={cardStyle}>
        <div className="text-center mb-8">
          <Image src="/ayurshala_text.png" alt="Ayurshala" width={200} height={56} className="object-contain h-14 w-auto mx-auto mb-4" />
          <h1 className="font-serif text-3xl mb-2" style={{ color: '#E8621A' }}>Access Denied</h1>
          <p className="font-sans text-sm text-stone-600 mb-1">You are not authorized to access this page</p>
          <p className="font-sans text-xs text-stone-400">{userEmail || 'Not logged in'}</p>
        </div>

        <p className="font-sans text-sm text-stone-600 text-center mb-6 py-4 bg-red-50 rounded-xl border border-red-200">
          Only <strong>{ADMIN_EMAIL}</strong> can access the admin console.
        </p>

        <div className="flex gap-3">
          <Link href="/" className="btn-glass flex-1 text-center py-3 flex items-center justify-center gap-2">
            <Home className="w-4 h-4" /> Home
          </Link>
          <button onClick={() => supabase.auth.signOut()} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-sans hover:bg-red-600 transition">
            Sign Out
          </button>
        </div>
      </motion.div>
    </div>
  )

  return (
    <div className="min-h-screen px-4 sm:px-6 py-16 sm:py-24 relative overflow-hidden" style={{ background: bg }}>
      <GlassBackground />
      <div className="max-w-5xl mx-auto relative">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-serif text-3xl sm:text-4xl" style={{ color: '#E8621A' }}>Admin Console</h1>
          <Link href="/admin/refunds" className="btn-glass text-sm py-2 px-4">
            Refunds
          </Link>
        </div>

        <div className="flex gap-2 mb-6">
          {(['PENDING_CONFIRMATION', 'ALL'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-sans transition ${
                filter === f ? 'bg-orange-500 text-white' : 'bg-white/60 text-stone-700 border border-white/80'
              }`}>
              {f === 'PENDING_CONFIRMATION' ? 'Pending Confirmation' : 'All Bookings'}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-center text-stone-400 font-sans">Loading...</p>
        ) : bookings.length === 0 ? (
          <p className="text-center text-stone-400 font-sans">No bookings</p>
        ) : (
          <div className="rounded-3xl overflow-hidden" style={cardStyle}>
            <table className="w-full text-sm">
              <thead style={{ background: 'rgba(232,98,26,0.08)' }}>
                <tr className="border-b border-white/30">
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase">Booking ID</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase">Patient</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase">Date & Time</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase">Status</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b, i) => (
                  <tr key={b.id} className={`border-b border-white/20 ${i % 2 === 0 ? 'bg-white/15' : 'bg-white/10'}`}>
                    <td className="px-4 sm:px-6 py-3 font-mono font-semibold" style={{ color: '#E8621A' }}>{b.booking_id}</td>
                    <td className="px-4 sm:px-6 py-3">
                      <p className="font-semibold text-stone-900">{b.patient_name}</p>
                      <p className="text-xs text-stone-500">{b.patient_id}</p>
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-stone-700">{b.preferred_date} · {b.preferred_time}</td>
                    <td className="px-4 sm:px-6 py-3"><span className={`px-2 py-1 rounded-lg text-xs ${statusConfig[b.status]?.cls}`}>{statusConfig[b.status]?.label || b.status}</span></td>
                    <td className="px-4 sm:px-6 py-3">
                      {b.status === 'PENDING_CONFIRMATION' && (
                        <div className="flex gap-2">
                          <button onClick={() => confirm(b.booking_id)} className="px-2 py-1 rounded bg-green-500 text-white text-xs hover:bg-green-600">Confirm</button>
                          <button onClick={() => cancel(b.booking_id)} className="px-2 py-1 rounded bg-red-500 text-white text-xs hover:bg-red-600">Cancel</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
