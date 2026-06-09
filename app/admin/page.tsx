'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import GlassBackground from '@/components/GlassBackground'
import { AdminGuard } from '@/components/AdminGuard'
import { useTheme } from 'next-themes'
import { Home, LogOut, Clock, X, AlertCircle, CheckCircle } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)

type Booking = {
  id: number
  booking_id: string
  preferred_date: string
  preferred_time: string
  booking_type: string
  status: string
  payment_status: string
  payment_method: string
  created_at: string
  patient_name: string
  patient_id: string
  patient_phone: string
  patient_email: string
  treatments: string
  amount?: number
}

type Tab = 'all' | 'online' | 'offline' | 'refunds'

const statusConfig: Record<string, { label: string; cls: string }> = {
  CONFIRMED: { label: 'Confirmed', cls: 'bg-green-100 text-green-700' },
  PENDING_CONFIRMATION: { label: 'Pending', cls: 'bg-amber-100 text-amber-700' },
  CANCELLED: { label: 'Cancelled', cls: 'bg-red-100 text-red-600' },
  COMPLETED: { label: 'Completed', cls: 'bg-blue-100 text-blue-700' },
}

const paymentStatusConfig: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'Pending', cls: 'bg-gray-100 text-gray-700' },
  SUCCESS: { label: 'Paid', cls: 'bg-green-100 text-green-700' },
  FAILED: { label: 'Failed', cls: 'bg-red-100 text-red-600' },
  REFUNDED: { label: 'Refunded', cls: 'bg-blue-100 text-blue-700' },
}

export default function AdminPage() {
  const [mounted, setMounted] = useState(false)
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
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [currentTime, setCurrentTime] = useState('')
  const [showResetModal, setShowResetModal] = useState(false)
  const [newAdminPw, setNewAdminPw] = useState('')
  const [newAdminPwConfirm, setNewAdminPwConfirm] = useState('')
  const [resetPwError, setResetPwError] = useState('')
  const [resetPwSuccess, setResetPwSuccess] = useState('')
  const [stats, setStats] = useState({ today: 0, pending: 0, cash: 0, refunds: 0, completed: 0, revenue: 0 })
  const { theme } = useTheme()
  const dark = mounted && theme === 'dark'

  useEffect(() => setMounted(true), [])

  // Session check on mount
  useEffect(() => {
    const checkSession = () => {
      const sessionTime = localStorage.getItem('adminSessionTime')
      if (sessionTime) {
        const elapsed = Date.now() - parseInt(sessionTime)
        const maxAge = 8 * 60 * 60 * 1000 // 8 hours
        if (elapsed < maxAge) {
          setAuthed(true)
          localStorage.setItem('adminSessionTime', Date.now().toString())
        } else {
          localStorage.removeItem('adminSessionTime')
          setAuthed(false)
        }
      }
    }
    checkSession()
  }, [])

  // Clock update
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      setCurrentTime(now.toLocaleString('en-IN', { 
        month: 'short', day: 'numeric', year: 'numeric', 
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true 
      }))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Fetch bookings when tab changes
  useEffect(() => {
    if (authed) fetchBookings()
  }, [activeTab, authed])

  async function fetchBookings() {
    setLoading(true)
    let filterValue = 'ALL'
    
    if (activeTab === 'online') filterValue = 'ONLINE'
    else if (activeTab === 'offline') filterValue = 'CASH_ON_ARRIVAL'
    
    const res = await fetch(`/api/admin/bookings?payment=${filterValue}`)
    const { bookings: data } = await res.json()
    
    // Calculate stats
    const now = new Date()
    const today = data?.filter((b: Booking) => {
      const bDate = new Date(b.preferred_date)
      return bDate.toDateString() === now.toDateString()
    }) || []
    
    setStats({
      today: today.length,
      pending: data?.filter((b: Booking) => b.status === 'PENDING_CONFIRMATION').length || 0,
      cash: data?.filter((b: Booking) => b.payment_method === 'CASH_ON_ARRIVAL').length || 0,
      refunds: data?.filter((b: Booking) => b.payment_status === 'REFUNDED').length || 0,
      completed: data?.filter((b: Booking) => b.status === 'COMPLETED').length || 0,
      revenue: data?.reduce((sum: number, b: Booking) => sum + (b.amount || 0), 0) || 0,
    })
    
    setBookings(data || [])
    setLoading(false)
  }

  async function handleLogin() {
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', password: pw }),
    })
    const { success } = await res.json()
    if (success) {
      localStorage.setItem('adminSessionTime', Date.now().toString())
      setAuthed(true)
      setPw('')
      setPwError('')
    } else {
      setPwError('Incorrect password')
    }
  }

  async function handleResetPasswordModal() {
    setResetPwError('')
    if (newAdminPw.length < 8) {
      setResetPwError('Password must be at least 8 characters')
      return
    }
    if (!/[A-Z]/.test(newAdminPw)) {
      setResetPwError('Password must contain uppercase letter')
      return
    }
    if (!/[a-z]/.test(newAdminPw)) {
      setResetPwError('Password must contain lowercase letter')
      return
    }
    if (!/[0-9]/.test(newAdminPw)) {
      setResetPwError('Password must contain number')
      return
    }
    if (!/[!@#$%^&*]/.test(newAdminPw)) {
      setResetPwError('Password must contain special character (!@#$%^&*)')
      return
    }
    if (newAdminPw !== newAdminPwConfirm) {
      setResetPwError('Passwords do not match')
      return
    }

    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update-password', password: newAdminPw }),
    })

    if (res.ok) {
      setResetPwSuccess('Password updated successfully!')
      setTimeout(() => {
        setShowResetModal(false)
        setNewAdminPw('')
        setNewAdminPwConfirm('')
        setResetPwSuccess('')
      }, 2000)
    } else {
      setResetPwError('Failed to update password')
    }
  }

  async function handleForgotPassword() {
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'send-reset-link' }),
    })
    if (res.ok) {
      setShowForgot(true)
      setTimeout(() => {
        setShowForgot(false)
      }, 3000)
    } else {
      setPwError('Failed to send reset link')
    }
  }

  async function confirm(booking_id: string) {
    const res = await fetch('/api/admin/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'confirm', booking_id }),
    })
    if (res.ok) {
      setBookings(prev => prev.map(b => b.booking_id === booking_id ? { ...b, status: 'CONFIRMED' } : b))
      // Show success toast
      const evt = new CustomEvent('bookingUpdated', { detail: { booking_id, action: 'confirmed' } })
      window.dispatchEvent(evt)
    }
  }

  async function cancel(booking_id: string) {
    const res = await fetch('/api/admin/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel', booking_id }),
    })
    if (res.ok) {
      setBookings(prev => prev.map(b => b.booking_id === booking_id ? { ...b, status: 'CANCELLED' } : b))
      // Show success toast
      const evt = new CustomEvent('bookingUpdated', { detail: { booking_id, action: 'cancelled' } })
      window.dispatchEvent(evt)
    }
  }

  const bg = dark ? 'linear-gradient(135deg,#0a0f0a,#1a1008)' : 'linear-gradient(135deg,#fdf6ee,#ffecd2,#fff8f0)'
  const cardStyle = {
    background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.72)',
    backdropFilter: 'blur(40px)',
    border: dark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(255,255,255,0.85)',
    boxShadow: '0 20px 80px rgba(232,98,26,0.12), 0 4px 24px rgba(0,0,0,0.08)',
  }

  // Login Screen
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background: bg }}>
        <GlassBackground />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md rounded-3xl p-8 relative overflow-hidden"
          style={cardStyle}
        >
          {!showForgot ? (
            <>
              <div className="text-center mb-8">
                <Image src="/ayurshala_text.png" alt="Ayurshala" width={200} height={56} className="object-contain h-14 w-auto mx-auto mb-4" />
                <h1 className="font-serif text-2xl mb-1" style={{ color: '#E8621A' }}>Admin Portal</h1>
                <p className="font-sans text-xs text-stone-400">Enter password to continue</p>
              </div>

              <input
                type="password"
                value={pw}
                onChange={(e) => {
                  setPw(e.target.value)
                  setPwError('')
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="Password"
                className="w-full rounded-xl px-4 py-3 font-sans text-sm bg-white/50 border border-white/80 focus:outline-none focus:border-orange-300 backdrop-blur-md mb-4"
              />

              {pwError && <p className="font-sans text-xs text-red-500 mb-4 text-center">{pwError}</p>}

              <button
                onClick={handleLogin}
                className="w-full py-2.5 rounded-xl bg-orange-500 text-white font-sans text-sm hover:bg-orange-600 transition mb-3"
              >
                Login
              </button>

              <button
                onClick={handleForgotPassword}
                className="w-full py-2.5 rounded-xl bg-white/40 text-stone-700 font-sans text-sm hover:bg-white/60 transition border border-white/60"
              >
                Forgot Password?
              </button>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <h1 className="font-serif text-xl mb-1" style={{ color: '#E8621A' }}>Reset Password</h1>
              </div>
              <p className="font-sans text-sm text-stone-600 bg-blue-50 rounded-lg p-3 mb-4 border border-blue-200">
                Reset link sent to <strong>ayurshalapanchkarma@gmail.com</strong>
              </p>
              <button
                onClick={() => setShowForgot(false)}
                className="w-full py-2.5 rounded-xl bg-white/40 text-stone-700 font-sans text-sm hover:bg-white/60 transition border border-white/60"
              >
                Back to Login
              </button>
            </>
          )}
        </motion.div>
      </div>
    )
  }

  // Dashboard
  return (
    <AdminGuard>
      <div className="min-h-screen px-4 sm:px-6 py-8 relative overflow-hidden" style={{ background: bg }}>
        <GlassBackground />
      
      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <div className="rounded-2xl p-6 mb-6" style={cardStyle}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="font-serif text-4xl" style={{ color: '#E8621A' }}>Ayurshala Admin</h1>
              <p className="font-sans text-sm text-stone-600 mt-1">Logged in as: ayurshalapanchkarma@gmail.com</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-xs text-stone-500 flex items-center gap-1 justify-end mb-3">
                <Clock className="w-4 h-4" />{currentTime}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowResetModal(true)}
                  className="px-3 py-2 rounded-lg bg-blue-500 text-white text-xs hover:bg-blue-600 transition"
                >
                  Reset Password
                </button>
                <Link href="/" className="px-3 py-2 rounded-lg bg-white/40 text-stone-700 text-xs hover:bg-white/60 transition border border-white/60 flex items-center gap-1">
                  <Home className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => {
                    localStorage.removeItem('adminSessionTime')
                    setAuthed(false)
                    setPw('')
                  }}
                  className="px-3 py-2 rounded-lg bg-red-500 text-white text-xs hover:bg-red-600 transition flex items-center gap-1"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Today's", value: stats.today, color: 'bg-blue-500' },
            { label: 'Pending', value: stats.pending, color: 'bg-amber-500' },
            { label: 'Cash Pending', value: stats.cash, color: 'bg-purple-500' },
            { label: 'Revenue', value: `₹${stats.revenue}`, color: 'bg-green-500' },
          ].map((stat, i) => (
            <div key={i} className="rounded-xl p-4" style={cardStyle}>
              <p className="font-sans text-xs text-stone-600">{stat.label}</p>
              <p className={`text-2xl font-bold text-white mt-2 ${stat.color} bg-clip-text text-transparent`} style={{ backgroundImage: `linear-gradient(135deg, ${stat.color === 'bg-blue-500' ? '#3b82f6' : stat.color === 'bg-amber-500' ? '#f59e0b' : stat.color === 'bg-purple-500' ? '#a855f7' : '#10b981'}, #e8621a)` }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(['all', 'online', 'offline', 'refunds'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-sans transition whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-orange-500 text-white'
                  : 'bg-white/40 text-stone-700 border border-white/60 hover:bg-white/60'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Bookings Table */}
        {loading ? (
          <div className="text-center py-12 text-stone-400 font-sans">Loading...</div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12 text-stone-400 font-sans">No bookings found</div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={cardStyle}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead style={{ background: 'rgba(232,98,26,0.08)' }}>
                  <tr className="border-b border-white/30">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-stone-700 uppercase">Booking ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-stone-700 uppercase">Patient</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-stone-700 uppercase">Date & Time</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-stone-700 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-stone-700 uppercase">Payment</th>
                    {activeTab === 'online' && <th className="px-4 py-3 text-left text-xs font-semibold text-stone-700 uppercase">Amount</th>}
                    <th className="px-4 py-3 text-left text-xs font-semibold text-stone-700 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b, i) => (
                    <tr key={b.id} className={`border-b border-white/20 ${i % 2 === 0 ? 'bg-white/15' : 'bg-white/10'}`}>
                      <td className="px-4 py-3 font-mono text-xs font-semibold" style={{ color: '#E8621A' }}>{b.booking_id}</td>
                      <td className="px-4 py-3 text-sm text-stone-900"><p>{b.patient_name}</p><p className="text-xs text-stone-600">{b.patient_email}</p></td>
                      <td className="px-4 py-3 text-xs text-stone-700">{b.preferred_date} {b.preferred_time}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-1 rounded-lg text-xs ${statusConfig[b.status]?.cls || 'bg-gray-100'}`}>{statusConfig[b.status]?.label || b.status}</span></td>
                      <td className="px-4 py-3"><span className={`px-2 py-1 rounded-lg text-xs ${paymentStatusConfig[b.payment_status]?.cls || 'bg-gray-100'}`}>{paymentStatusConfig[b.payment_status]?.label || b.payment_status}</span></td>
                      {activeTab === 'online' && <td className="px-4 py-3 text-xs">₹{b.amount || 0}</td>}
                      <td className="px-4 py-3">
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
          </div>
        )}
      </div>

      {/* Reset Password Modal */}
      <AnimatePresence>
        {showResetModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowResetModal(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-3xl p-6 z-50"
              style={cardStyle}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-2xl" style={{ color: '#E8621A' }}>Reset Password</h2>
                <button onClick={() => setShowResetModal(false)} className="p-1 hover:bg-white/20 rounded-lg transition">
                  <X className="w-5 h-5 text-stone-600" />
                </button>
              </div>

              {resetPwSuccess ? (
                <div className="flex items-center gap-3 bg-green-100 border border-green-300 rounded-lg p-4">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="font-sans text-sm text-green-700">{resetPwSuccess}</p>
                </div>
              ) : (
                <>
                  <input
                    type="password"
                    value={newAdminPw}
                    onChange={(e) => {
                      setNewAdminPw(e.target.value)
                      setResetPwError('')
                    }}
                    placeholder="New Password"
                    className="w-full rounded-xl px-4 py-3 font-sans text-sm bg-white/50 border border-white/80 focus:outline-none focus:border-orange-300 backdrop-blur-md mb-3"
                  />

                  <input
                    type="password"
                    value={newAdminPwConfirm}
                    onChange={(e) => {
                      setNewAdminPwConfirm(e.target.value)
                      setResetPwError('')
                    }}
                    placeholder="Confirm Password"
                    className="w-full rounded-xl px-4 py-3 font-sans text-sm bg-white/50 border border-white/80 focus:outline-none focus:border-orange-300 backdrop-blur-md mb-4"
                  />

                  <p className="font-sans text-xs text-stone-600 mb-4 leading-relaxed">
                    Password must contain: 8+ characters, uppercase, lowercase, number, special character (!@#$%^&*)
                  </p>

                  {resetPwError && (
                    <div className="flex items-center gap-3 bg-red-100 border border-red-300 rounded-lg p-4 mb-4">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <p className="font-sans text-sm text-red-700">{resetPwError}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={handleResetPasswordModal}
                      className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white font-sans text-sm hover:bg-orange-600 transition"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => {
                        setShowResetModal(false)
                        setNewAdminPw('')
                        setNewAdminPwConfirm('')
                        setResetPwError('')
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-white/40 text-stone-700 font-sans text-sm hover:bg-white/60 transition border border-white/60"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
    </AdminGuard>
  )
}
