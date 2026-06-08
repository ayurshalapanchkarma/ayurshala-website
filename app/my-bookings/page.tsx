'use client'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import GlassBackground from '@/components/GlassBackground'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

type Booking = {
  id: string; treatment: string; date: string; time: string
  paymentmethod: string; status: string; created_at: string; concern: string
}

export default function MyBookingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const dark = mounted && theme === 'dark'

  useEffect(() => {
    setMounted(true)
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null
      setUser(u)
      if (!u) { setLoading(false); return }
      supabase.from('bookings').select('*').eq('email', u.email!).order('created_at', { ascending: false })
        .then(({ data }) => { setBookings(data || []); setLoading(false) })
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (!u) { setBookings([]); setLoading(false); return }
      supabase.from('bookings').select('*').eq('email', u.email!).order('created_at', { ascending: false })
        .then(({ data }) => { setBookings(data || []); setLoading(false) })
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <div className="min-h-screen px-6 py-24 relative overflow-hidden"
      style={{ background: dark ? 'linear-gradient(135deg,#0a0f0a,#1a1008)' : 'linear-gradient(135deg,#fdf6ee,#ffecd2,#fff8f0)' }}>
      <GlassBackground />
      <div className="max-w-2xl mx-auto relative">
        <Link href="/" className="inline-block mb-8">
          <Image src="/ayurshala_text.png" alt="Ayurshala" width={160} height={48} className="object-contain h-12 w-auto" />
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl mb-1" style={{ color: '#E8621A' }}>My Bookings</h1>
            {user && <p className="font-sans text-sm text-stone-400">{user.email}</p>}
          </div>
          <Link href="/book" className="btn-glass text-xs py-2 px-5">+ New Booking</Link>
        </div>

        {!user && !loading && (
          <div className="rounded-2xl p-8 text-center border border-brand/15 bg-white/40">
            <p className="font-sans text-stone-500 mb-4">Sign in to view your bookings</p>
            <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback?next=/my-bookings` } })}
              className="btn-glass text-sm py-2 px-6 inline-flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Sign in with Google
            </button>
          </div>
        )}

        {loading && (
          <p className="font-sans text-sm text-stone-400 text-center py-12">Loading…</p>
        )}

        {user && !loading && bookings.length === 0 && (
          <div className="rounded-2xl p-8 text-center border border-brand/15 bg-white/40">
            <p className="font-sans text-stone-500 mb-4">You have no bookings yet.</p>
            <Link href="/book" className="btn-glass text-sm py-2 px-6 inline-block">Book an Appointment</Link>
          </div>
        )}

        {bookings.length > 0 && (
          <div className="space-y-3">
            {bookings.map(b => (
              <div key={b.id} className={`rounded-2xl p-5 border ${dark ? 'border-white/10 bg-white/5' : 'border-brand/12 bg-white/60'}`}>
                <div className="flex items-start justify-between gap-4 mb-2">
                  <p className="font-sans text-sm font-semibold text-brand">{b.treatment || '—'}</p>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-sans flex-shrink-0 ${b.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {b.status}
                  </span>
                </div>
                <div className="flex gap-4 text-xs font-sans text-stone-400">
                  <span>📅 {b.date ? new Date(b.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
                  {b.time && <span>🕐 {b.time}</span>}
                  <span>💳 {b.paymentmethod === 'online' ? 'Paid online' : 'Cash on arrival'}</span>
                </div>
                {b.concern && <p className="font-sans text-xs text-stone-400 mt-2 italic">"{b.concern}"</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
