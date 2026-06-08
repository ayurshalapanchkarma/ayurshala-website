'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'ayurshala2026'

type Booking = {
  id: number; booking_id: string; preferred_date: string; preferred_time: string
  booking_type: string; status: string; payment_method: string; created_at: string
  patient_name: string; patient_id: string; patient_phone: string; treatments: string
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState('')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'PENDING_CONFIRMATION' | 'ALL'>('PENDING_CONFIRMATION')

  async function fetchBookings() {
    setLoading(true)
    const res = await fetch(`/api/admin/bookings?status=${filter}`)
    const { bookings: data } = await res.json()
    setBookings(data || [])
    setLoading(false)
  }

  useEffect(() => { if (authed) fetchBookings() }, [authed, filter])

  async function confirm(booking_id: string) {
    await fetch('/api/admin/bookings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'confirm', booking_id }),
    })
    setBookings(prev => prev.map(b => b.booking_id === booking_id ? { ...b, status: 'CONFIRMED' } : b))
  }

  async function cancel(booking_id: string) {
    await fetch('/api/admin/bookings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel', booking_id }),
    })
    setBookings(prev => prev.map(b => b.booking_id === booking_id ? { ...b, status: 'CANCELLED' } : b))
  }

  if (!authed) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="bg-white rounded-2xl p-8 shadow-sm w-80">
        <h1 className="font-serif text-2xl text-center mb-6" style={{ color: '#E8621A' }}>Admin Login</h1>
        <input type="password" value={pw} onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && pw === ADMIN_PASSWORD && setAuthed(true)}
          placeholder="Password" className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm mb-3 outline-none" />
        <button onClick={() => pw === ADMIN_PASSWORD ? setAuthed(true) : alert('Wrong password')}
          className="w-full py-2.5 rounded-xl text-white text-sm font-sans" style={{ background: '#E8621A' }}>
          Enter
        </button>
      </div>
    </div>
  )

  const statusColor: Record<string, string> = {
    CONFIRMED: 'text-green-600 bg-green-50',
    PENDING_CONFIRMATION: 'text-amber-600 bg-amber-50',
    CANCELLED: 'text-red-500 bg-red-50',
  }

  return (
    <div className="min-h-screen bg-stone-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-serif text-3xl" style={{ color: '#E8621A' }}>Ayurshala Admin</h1>
          <div className="flex gap-2">
            <button onClick={() => setFilter('PENDING_CONFIRMATION')}
              className={`text-xs px-4 py-2 rounded-xl border font-sans transition-colors ${filter === 'PENDING_CONFIRMATION' ? 'bg-brand text-white border-transparent' : 'border-stone-200 text-stone-600'}`}
              style={filter === 'PENDING_CONFIRMATION' ? { background: '#E8621A' } : {}}>
              Pending
            </button>
            <button onClick={() => setFilter('ALL')}
              className={`text-xs px-4 py-2 rounded-xl border font-sans transition-colors ${filter === 'ALL' ? 'text-white border-transparent' : 'border-stone-200 text-stone-600'}`}
              style={filter === 'ALL' ? { background: '#E8621A' } : {}}>
              All
            </button>
            <button onClick={fetchBookings} className="text-xs px-4 py-2 rounded-xl border border-stone-200 text-stone-600 font-sans">↻ Refresh</button>
          </div>
        </div>

        {loading && <p className="text-sm text-stone-400 text-center py-12">Loading…</p>}

        <div className="space-y-3">
          {bookings.map(b => (
            <div key={b.booking_id} className="bg-white rounded-2xl p-5 border border-stone-100 flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-sans text-xs text-stone-400">{b.booking_id}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-sans ${statusColor[b.status] || 'text-stone-500 bg-stone-50'}`}>{b.status}</span>
                  <span className="text-xs text-stone-400 font-sans">{b.payment_method}</span>
                </div>
                <p className="font-sans text-sm font-semibold text-stone-800">{b.patient_name} <span className="font-normal text-stone-400">({b.patient_id})</span></p>
                <p className="font-sans text-xs text-stone-500">{b.treatments}</p>
                <p className="font-sans text-xs text-stone-400">📅 {b.preferred_date} · {b.preferred_time} {b.patient_phone && `· 📞 ${b.patient_phone}`}</p>
              </div>
              {b.status === 'PENDING_CONFIRMATION' && (
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => confirm(b.booking_id)}
                    className="text-xs px-4 py-2 rounded-xl text-white font-sans" style={{ background: '#16a34a' }}>
                    ✓ Confirm
                  </button>
                  <button onClick={() => cancel(b.booking_id)}
                    className="text-xs px-4 py-2 rounded-xl text-red-500 border border-red-200 font-sans">
                    ✕ Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
          {!loading && bookings.length === 0 && (
            <p className="text-sm text-stone-400 text-center py-12">No bookings found.</p>
          )}
        </div>
      </div>
    </div>
  )
}
