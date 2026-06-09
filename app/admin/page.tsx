'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import GlassBackground from '@/components/GlassBackground'
import { useTheme } from 'next-themes'
import { Home, LogOut, Clock } from 'lucide-react'

type Booking = {
  id: number; booking_id: string; preferred_date: string; preferred_time: string
  booking_type: string; status: string; payment_method: string; created_at: string
  patient_name: string; patient_id: string; patient_phone: string; patient_email: string; treatments: string
}

const statusConfig: Record<string, { label: string; cls: string }> = {
  CONFIRMED:            { label: 'Confirmed',    cls: 'bg-green-100 text-green-700' },
  PENDING_CONFIRMATION: { label: 'Pending',      cls: 'bg-amber-100 text-amber-700' },
  CANCELLED:            { label: 'Cancelled',    cls: 'bg-red-100 text-red-600' },
  COMPLETED:            { label: 'Completed',    cls: 'bg-blue-100 text-blue-700' },
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState('')
  const [pwError, setPwError] = useState('')
  const [showForgot, setShowForgot] = useState(false)
  const [resetStage, setResetStage] = useState<'request' | 'confirm'>('request')
  const [newPw, setNewPw] = useState('')
  const [newPwConfirm, setNewPwConfirm] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'ONLINE' | 'OFFLINE'>('ALL')
  const [currentTime, setCurrentTime] = useState('')
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => setMounted(true), [])
  const dark = mounted && theme === 'dark'

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      setCurrentTime(now.toLocaleString('en-IN', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (authed) fetchBookings()
  }, [paymentFilter, authed])

  async function fetchBookings() {
    setLoading(true)
    const res = await fetch(`/api/admin/bookings?payment=${paymentFilter}`)
    const { bookings: data } = await res.json()
    setBookings(data || [])
    setLoading(false)
  }

  async function handleLogin() {
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', email: 'ayurshalapanchkarma@gmail.com', password: pw }),
    })
    const { success } = await res.json()
    if (success) {
      setAuthed(true)
      setPw('')
    } else {
      setPwError('Incorrect password')
    }
  }

  async function handleResetRequest() {
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset-request', email: 'ayurshalapanchkarma@gmail.com' }),
    })
    if (res.ok) {
      setResetStage('confirm')
      alert('Reset link sent to ayurshalapanchkarma@gmail.com')
    }
  }

  async function handleResetPassword() {
    if (newPw !== newPwConfirm) {
      setPwError('Passwords do not match')
      return
    }
    if (newPw.length < 8) {
      setPwError('Password must be at least 8 characters')
      return
    }

    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset-password', token: resetToken, newPassword: newPw }),
    })
    const { success, msg } = await res.json()
    if (success) {
      setShowForgot(false)
      setResetStage('request')
      setResetToken('')
      setNewPw('')
      setNewPwConfirm('')
      setPwError('')
      alert('Password reset successful!')
    } else {
      setPwError(msg || 'Reset failed')
    }
  }

  async function confirm(booking_id: string) {
    const booking = bookings.find(b => b.booking_id === booking_id)
    if (!booking) return
    
    setBookings(prev => prev.map(b => b.booking_id === booking_id ? { ...b, status: 'CONFIRMED' } : b))
    
    const res = await fetch('/api/admin/bookings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'confirm', booking_id }),
    })
    
    if (!res.ok) {
      setBookings(prev => prev.map(b => b.booking_id === booking_id ? { ...b, status: 'PENDING_CONFIRMATION' } : b))
    } else {
      setPaymentFilter('ALL')
    }
  }

  async function cancel(booking_id: string) {
    const booking = bookings.find(b => b.booking_id === booking_id)
    if (!booking) return
    
    setBookings(prev => prev.map(b => b.booking_id === booking_id ? { ...b, status: 'CANCELLED' } : b))
    
    const res = await fetch('/api/admin/bookings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel', booking_id }),
    })
    
    if (!res.ok) {
      setBookings(prev => prev.map(b => b.booking_id === booking_id ? { ...b, status: 'PENDING_CONFIRMATION' } : b))
    } else {
      setPaymentFilter('ALL')
    }
  }

  const bg = dark ? 'linear-gradient(135deg,#0a0f0a,#1a1008)' : 'linear-gradient(135deg,#fdf6ee,#ffecd2,#fff8f0)'
  const cardStyle = {
    background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.72)',
    backdropFilter: 'blur(40px)', border: dark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(255,255,255,0.85)',
    boxShadow: '0 20px 80px rgba(232,98,26,0.12), 0 4px 24px rgba(0,0,0,0.08)',
  }

  const loginUI = (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background: bg }}>
      <GlassBackground />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}
        className="w-full max-w-md rounded-3xl p-8 relative overflow-hidden" style={cardStyle}>
        {!showForgot ? (
          <>
            <div className="text-center mb-8">
              <Image src="/ayurshala_text.png" alt="Ayurshala" width={200} height={56} className="object-contain h-14 w-auto mx-auto mb-4" />
              <h1 className="font-serif text-2xl mb-1" style={{ color: '#E8621A' }}>Admin Portal</h1>
              <p className="font-sans text-xs text-stone-400">Enter password to continue</p>
            </div>

            <div className="mb-4">
              <input
                type="password"
                value={pw}
                onChange={(e) => { setPw(e.target.value); setPwError('') }}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="Password"
                className="w-full rounded-xl px-4 py-3 font-sans text-sm bg-white/50 border border-white/80 focus:outline-none focus:border-orange-300 backdrop-blur-md"
              />
            </div>

            {pwError && <p className="font-sans text-xs text-red-500 mb-4 text-center">{pwError}</p>}

            <button
              onClick={handleLogin}
              className="w-full py-2.5 rounded-xl bg-orange-500 text-white font-sans text-sm hover:bg-orange-600 transition mb-3">
              Login
            </button>

            <button
              onClick={() => setShowForgot(true)}
              className="w-full py-2.5 rounded-xl bg-white/40 text-stone-700 font-sans text-sm hover:bg-white/60 transition border border-white/60">
              Forgot Password?
            </button>
          </>
        ) : (
          <>
            <div className="text-center mb-6">
              <h1 className="font-serif text-xl mb-1" style={{ color: '#E8621A' }}>Reset Password</h1>
              <p className="font-sans text-xs text-stone-400">
                {resetStage === 'request' ? 'Send reset link to email' : 'Set new password'}
              </p>
            </div>

            {resetStage === 'request' ? (
              <>
                <p className="font-sans text-sm text-stone-600 bg-blue-50 rounded-lg p-3 mb-4 border border-blue-200">
                  Reset link will be sent to <strong>ayurshalapanchkarma@gmail.com</strong>
                </p>
                <button
                  onClick={handleResetRequest}
                  className="w-full py-2.5 rounded-xl bg-blue-500 text-white font-sans text-sm hover:bg-blue-600 transition mb-3">
                  Send Reset Link
                </button>
              </>
            ) : (
              <>
                <input
                  type="text"
                  value={resetToken}
                  onChange={(e) => { setResetToken(e.target.value); setPwError('') }}
                  placeholder="Paste token from email"
                  className="w-full rounded-xl px-4 py-3 font-sans text-sm bg-white/50 border border-white/80 focus:outline-none focus:border-orange-300 backdrop-blur-md mb-3"
                />
                <input
                  type="password"
                  value={newPw}
                  onChange={(e) => { setNewPw(e.target.value); setPwError('') }}
                  placeholder="New password"
                  className="w-full rounded-xl px-4 py-3 font-sans text-sm bg-white/50 border border-white/80 focus:outline-none focus:border-orange-300 backdrop-blur-md mb-3"
                />
                <input
                  type="password"
                  value={newPwConfirm}
                  onChange={(e) => { setNewPwConfirm(e.target.value); setPwError('') }}
                  placeholder="Confirm password"
                  className="w-full rounded-xl px-4 py-3 font-sans text-sm bg-white/50 border border-white/80 focus:outline-none focus:border-orange-300 backdrop-blur-md mb-3"
                />
                {pwError && <p className="font-sans text-xs text-red-500 mb-4 text-center">{pwError}</p>}
                <button
                  onClick={handleResetPassword}
                  className="w-full py-2.5 rounded-xl bg-green-500 text-white font-sans text-sm hover:bg-green-600 transition mb-3">
                  Reset Password
                </button>
              </>
            )}

            <button
              onClick={() => {
                setShowForgot(false)
                setResetStage('request')
                setResetToken('')
                setNewPw('')
                setNewPwConfirm('')
                setPwError('')
              }}
              className="w-full py-2.5 rounded-xl bg-white/40 text-stone-700 font-sans text-sm hover:bg-white/60 transition border border-white/60">
              Back to Login
            </button>
          </>
        )}
      </motion.div>
    </div>
  )

  if (!authed) return loginUI

  return (
    <div className="min-h-screen px-4 sm:px-6 py-16 sm:py-24 relative overflow-hidden" style={{ background: bg }}>
      <GlassBackground />
      <div className="max-w-5xl mx-auto relative">
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-serif text-3xl sm:text-4xl" style={{ color: '#E8621A' }}>Admin Console</h1>
          <div className="flex items-center gap-3">
            <div className="text-right text-xs">
              <p className="font-sans text-stone-600">@ayurshala gmail</p>
              <p className="font-mono text-stone-500 flex items-center gap-1"><Clock className="w-3 h-3" />{currentTime}</p>
            </div>
            <Link href="/" className="btn-glass text-sm py-2 px-3 flex items-center gap-1">
              <Home className="w-4 h-4" />
            </Link>
            <button onClick={() => { setAuthed(false); setPw('') }} className="btn-glass text-sm py-2 px-3 flex items-center gap-1 text-red-600">
              <LogOut className="w-4 h-4" />
            </button>
            <button onClick={() => setShowForgot(true)} className="btn-glass text-sm py-2 px-3 text-blue-600">
              Reset Password
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <Link href="/admin/refunds" className="btn-glass text-sm py-2 px-4">
            Refunds
          </Link>
          {(['ALL', 'ONLINE', 'OFFLINE'] as const).map(f => (
            <button key={f} onClick={() => setPaymentFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-sans transition ${
                paymentFilter === f ? 'bg-orange-500 text-white' : 'bg-white/60 text-stone-700 border border-white/80'
              }`}>
              {f === 'ALL' ? 'All Appointments' : f}
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
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase">Patient ID</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase">Name</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase">Email</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase">Date</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase">Status</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b, i) => (
                  <tr key={b.id} className={`border-b border-white/20 ${i % 2 === 0 ? 'bg-white/15' : 'bg-white/10'}`}>
                    <td className="px-4 sm:px-6 py-3 font-mono font-semibold text-xs" style={{ color: '#E8621A' }}>{b.booking_id}</td>
                    <td className="px-4 sm:px-6 py-3 font-semibold text-xs text-stone-700">{b.patient_id}</td>
                    <td className="px-4 sm:px-6 py-3 text-stone-900">{b.patient_name}</td>
                    <td className="px-4 sm:px-6 py-3 text-xs text-stone-600">{b.patient_email}</td>
                    <td className="px-4 sm:px-6 py-3 text-xs text-stone-700">{b.preferred_date} {b.preferred_time}</td>
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
