'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import GlassBackground from '@/components/GlassBackground'
import { AdminGuard } from '@/components/AdminGuard'
import { useTheme } from 'next-themes'
import { Home, LogOut, Clock, Moon, Sun, Calendar, Clock as ClockIcon, Wallet, TrendingUp } from 'lucide-react'
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
  rescheduled_at?: string
}

type Tab = 'all' | 'online' | 'offline' | 'refunds'

const getStatusBadge = (booking: Booking) => {
  const { status, rescheduled_at, payment_method, payment_status } = booking

  // State: PAYMENT_PENDING
  if (status === 'PAYMENT_PENDING') {
    return { label: 'Payment Pending', cls: 'bg-amber-100/80 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200' }
  }

  // State: PENDING_CONFIRMATION
  if (status === 'PENDING_CONFIRMATION') {
    return { label: 'Awaiting Confirmation', cls: 'bg-yellow-100/80 text-yellow-900 dark:bg-yellow-950/50 dark:text-yellow-200' }
  }

  // State: CONFIRMED + rescheduled_at NOT NULL
  if (status === 'CONFIRMED' && rescheduled_at) {
    return { label: 'Rescheduled Confirmed', cls: 'bg-emerald-100/80 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200' }
  }

  // State: CONFIRMED
  if (status === 'CONFIRMED') {
    return { label: 'Confirmed', cls: 'bg-green-100/80 text-green-900 dark:bg-green-950/50 dark:text-green-200' }
  }

  // State: RESCHEDULED
  if (status === 'RESCHEDULED') {
    return { label: 'Reschedule Requested', cls: 'bg-orange-100/80 text-orange-900 dark:bg-orange-950/50 dark:text-orange-200' }
  }

  // State: CANCELLED
  if (status === 'CANCELLED') {
    return { label: 'Cancelled', cls: 'bg-red-100/80 text-red-900 dark:bg-red-950/50 dark:text-red-200' }
  }

  // State: COMPLETED
  if (status === 'COMPLETED') {
    return { label: 'Completed', cls: 'bg-blue-100/80 text-blue-900 dark:bg-blue-950/50 dark:text-blue-200' }
  }

  // State: NO_SHOW
  if (status === 'NO_SHOW') {
    return { label: 'No Show', cls: 'bg-slate-100/80 text-slate-900 dark:bg-slate-950/50 dark:text-slate-200' }
  }

  // State: IN_PROGRESS
  if (status === 'IN_PROGRESS') {
    return { label: 'In Progress', cls: 'bg-indigo-100/80 text-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-200' }
  }

  return { label: status, cls: 'bg-gray-100/80 text-gray-900 dark:bg-gray-950/50 dark:text-gray-200' }
}

const getPaymentBadge = (booking: Booking) => {
  const { status, payment_method, payment_status } = booking

  // State: PAYMENT_PENDING
  if (status === 'PAYMENT_PENDING') {
    return { label: 'Pending', cls: 'bg-gray-100/80 text-gray-900 dark:bg-gray-950/50 dark:text-gray-200' }
  }

  // State: PENDING_CONFIRMATION + ONLINE + PAID
  if (status === 'PENDING_CONFIRMATION' && payment_method === 'ONLINE' && payment_status === 'PAID') {
    return { label: 'Paid', cls: 'bg-green-100/80 text-green-900 dark:bg-green-950/50 dark:text-green-200' }
  }

  // State: PENDING_CONFIRMATION + CASH_ON_ARRIVAL + PENDING
  if (status === 'PENDING_CONFIRMATION' && payment_method === 'CASH_ON_ARRIVAL' && payment_status === 'PENDING') {
    return { label: 'Cash Pending', cls: 'bg-orange-100/80 text-orange-900 dark:bg-orange-950/50 dark:text-orange-200' }
  }

  // State: CONFIRMED + ONLINE + PAID
  if (status === 'CONFIRMED' && payment_method === 'ONLINE' && payment_status === 'PAID') {
    return { label: 'Paid', cls: 'bg-green-100/80 text-green-900 dark:bg-green-950/50 dark:text-green-200' }
  }

  // State: CONFIRMED + CASH_ON_ARRIVAL + PENDING
  if (status === 'CONFIRMED' && payment_method === 'CASH_ON_ARRIVAL' && payment_status === 'PENDING') {
    return { label: 'Cash Pending', cls: 'bg-orange-100/80 text-orange-900 dark:bg-orange-950/50 dark:text-orange-200' }
  }

  // State: CONFIRMED + CASH_ON_ARRIVAL + PAID
  if (status === 'CONFIRMED' && payment_method === 'CASH_ON_ARRIVAL' && payment_status === 'PAID') {
    return { label: 'Paid', cls: 'bg-green-100/80 text-green-900 dark:bg-green-950/50 dark:text-green-200' }
  }

  // Preserve existing payment state for other statuses
  if (payment_status === 'PAID' || payment_status === 'SUCCESS') {
    return { label: 'Paid', cls: 'bg-green-100/80 text-green-900 dark:bg-green-950/50 dark:text-green-200' }
  }

  if (payment_status === 'PENDING' || payment_status === 'COD_PENDING') {
    return { label: 'Cash Pending', cls: 'bg-orange-100/80 text-orange-900 dark:bg-orange-950/50 dark:text-orange-200' }
  }

  if (payment_status === 'REFUNDED') {
    return { label: 'Refunded', cls: 'bg-blue-100/80 text-blue-900 dark:bg-blue-950/50 dark:text-blue-200' }
  }

  if (payment_status === 'FAILED') {
    return { label: 'Failed', cls: 'bg-red-100/80 text-red-900 dark:bg-red-950/50 dark:text-red-200' }
  }

  return { label: payment_status || 'Unknown', cls: 'bg-gray-100/80 text-gray-900 dark:bg-gray-950/50 dark:text-gray-200' }
}

const getAvailableActions = (booking: Booking) => {
  const { status } = booking

  // PAYMENT_PENDING: No actions
  if (status === 'PAYMENT_PENDING') return []

  // PENDING_CONFIRMATION: Confirm, Cancel
  if (status === 'PENDING_CONFIRMATION') return ['confirm', 'cancel']

  // CONFIRMED (not rescheduled): Cancel only
  if (status === 'CONFIRMED' && !booking.rescheduled_at) return ['cancel']

  // CONFIRMED + rescheduled: Cancel only (no Reschedule button)
  if (status === 'CONFIRMED' && booking.rescheduled_at) return ['cancel']

  // RESCHEDULED: Approve Reschedule, Reject Reschedule
  if (status === 'RESCHEDULED') return ['approve_reschedule', 'reject_reschedule']

  // CANCELLED, COMPLETED, NO_SHOW: No actions
  if (['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(status)) return []

  // IN_PROGRESS: Mark Completed, Mark No Show
  if (status === 'IN_PROGRESS') return ['mark_completed', 'mark_no_show']

  return []
}

export default function AdminPage() {
  const [mounted, setMounted] = useState(false)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [currentTime, setCurrentTime] = useState('')
  const [stats, setStats] = useState({ today: 0, pending: 0, cash: 0, refunds: 0, completed: 0, revenue: 0 })
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const dark = mounted && theme === 'dark'

  useEffect(() => setMounted(true), [])

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
    fetchBookings()
  }, [activeTab])

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
    
    // Fetch revenue from payments table
    let revenue = 0
    try {
      const pRes = await fetch('/api/admin/revenue')
      const pData = await pRes.json()
      revenue = pData.revenue || 0
    } catch (e) {
      console.error('Failed to fetch revenue:', e)
      revenue = 0
    }
    
    setStats({
      today: today.length,
      pending: data?.filter((b: Booking) => b.status === 'PENDING_CONFIRMATION').length || 0,
      cash: data?.filter((b: Booking) => b.payment_method === 'CASH_ON_ARRIVAL').length || 0,
      refunds: data?.filter((b: Booking) => b.payment_status === 'REFUNDED').length || 0,
      completed: data?.filter((b: Booking) => b.status === 'COMPLETED').length || 0,
      revenue,
    })
    
    setBookings(data || [])
    setLoading(false)
  }

  async function performAction(booking_id: string, action: string) {
    const endpoint = action === 'confirm' ? '/api/admin/confirm' : 
                     action === 'cancel' ? '/api/admin/cancel' :
                     action === 'approve_reschedule' ? '/api/admin/confirm-reschedule' :
                     action === 'reject_reschedule' ? '/api/admin/cancel-reschedule' :
                     '/api/admin/bookings'

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, booking_id }),
    })

    if (res.ok) {
      await fetchBookings()
      const evt = new CustomEvent('bookingUpdated', { detail: { booking_id, action } })
      window.dispatchEvent(evt)
    }
  }

  const bg = dark ? 'linear-gradient(135deg,#1a2015,#2a1f10)' : 'linear-gradient(135deg,#fdf6ee,#ffecd2,#fff8f0)'
  const cardStyle = {
    background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.72)',
    backdropFilter: 'blur(40px)',
    border: dark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(255,255,255,0.85)',
    boxShadow: '0 20px 80px rgba(232,98,26,0.12), 0 4px 24px rgba(0,0,0,0.08)',
  }

  // Dashboard
  return (
    <AdminGuard>
      <div className="min-h-screen px-4 sm:px-6 py-6 relative overflow-hidden" style={{ background: bg }}>
        <GlassBackground />
      
      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <div className="rounded-2xl p-4 mb-5" style={cardStyle}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Link href="/">
                <Image src="/ayurshala_text.png" alt="Ayurshala" width={168} height={48} className="object-contain h-10 w-auto" />
              </Link>
              <div className="min-w-0">
                <h1 className="font-serif text-2xl" style={{ color: '#E8621A' }}>Admin Dashboard</h1>
                <p className={`font-sans text-xs ${dark ? 'text-gray-400' : 'text-stone-500'} truncate`}>Logged in as: ayurshalapanchkarma@gmail.com</p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className={`font-mono text-xs ${dark ? 'text-gray-400' : 'text-stone-500'} flex items-center gap-1 justify-end mb-2`}>
                <Clock className="w-3 h-3" />{currentTime}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setTheme(dark ? 'light' : 'dark')}
                  className={`p-1.5 rounded-lg text-xs transition border ${dark ? 'bg-gray-800/60 text-gray-300 border-gray-700' : 'bg-white/40 text-stone-700 border-white/60'} hover:opacity-80`}
                  title="Toggle dark mode"
                >
                  {dark ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
                </button>
                <Link href="/" className={`p-1.5 rounded-lg text-xs transition border flex items-center gap-1 ${dark ? 'bg-gray-800/60 text-gray-300 border-gray-700' : 'bg-white/40 text-stone-700 border-white/60'} hover:opacity-80`}>
                  <Home className="w-3 h-3" />
                </Link>
                <button
                  onClick={async () => {
                    await supabase.auth.signOut()
                    router.push('/')
                  }}
                  className="p-1.5 rounded-lg bg-red-500 text-white text-xs hover:bg-red-600 transition flex items-center gap-1"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: "Today's", value: stats.today, icon: Calendar },
            { label: 'Pending', value: stats.pending, icon: ClockIcon },
            { label: 'Cash Pending', value: stats.cash, icon: Wallet },
            { label: 'Revenue', value: `₹${stats.revenue}`, icon: TrendingUp },
          ].map((stat, i) => {
            const Icon = stat.icon
            return (
              <div key={i} className="rounded-2xl p-4 backdrop-blur-md border transition"
                style={{
                  background: dark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.65)',
                  backdropFilter: 'blur(20px)',
                  border: dark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(255, 255, 255, 0.4)',
                  boxShadow: dark ? '0 8px 32px rgba(232, 98, 26, 0.05)' : '0 8px 32px rgba(232, 98, 26, 0.12)',
                }}>
                <div className="flex items-start justify-between mb-2">
                  <p className={`font-sans text-xs ${dark ? 'text-gray-300' : 'text-gray-600'} uppercase tracking-wider`}>{stat.label}</p>
                  <Icon className="w-4 h-4" style={{ color: '#E8621A' }} />
                </div>
                <p className={`text-2xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
              </div>
            )
          })}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-2">
          {(['all', 'online', 'offline', 'refunds'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-sans transition whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-orange-500 text-white'
                  : `${dark ? 'bg-gray-800/60 text-gray-300 border-gray-700' : 'bg-white/40 text-stone-700 border border-white/60'} hover:opacity-80`
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Bookings Table */}
        {loading ? (
          <div className={`text-center py-8 ${dark ? 'text-gray-400' : 'text-stone-400'} font-sans`}>Loading...</div>
        ) : bookings.length === 0 ? (
          <div className={`text-center py-8 ${dark ? 'text-gray-400' : 'text-stone-400'} font-sans`}>No bookings found</div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={cardStyle}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead style={{ background: 'rgba(232,98,26,0.08)' }}>
                  <tr className="border-b border-white/30">
                    <th className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider ${dark ? 'text-gray-300' : 'text-stone-700'}`}>Booking ID</th>
                    <th className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider ${dark ? 'text-gray-300' : 'text-stone-700'}`}>Patient</th>
                    <th className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider ${dark ? 'text-gray-300' : 'text-stone-700'}`}>Date & Time</th>
                    <th className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider ${dark ? 'text-gray-300' : 'text-stone-700'}`}>Status</th>
                    <th className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider ${dark ? 'text-gray-300' : 'text-stone-700'}`}>Payment</th>
                    {activeTab === 'online' && <th className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider ${dark ? 'text-gray-300' : 'text-stone-700'}`}>Amount</th>}
                    <th className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider ${dark ? 'text-gray-300' : 'text-stone-700'}`}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b, i) => {
                    const actions = getAvailableActions(b)
                    return (
                      <tr key={b.id} className={`transition ${dark ? 'bg-slate-900/50 hover:bg-slate-800/50' : 'bg-white/60 hover:bg-white/80'} backdrop-blur-md border ${dark ? 'border-white/10' : 'border-white/20'}`}
                        style={{ boxShadow: dark ? 'inset 0 1px 0 rgba(255,255,255,0.1)' : 'inset 0 1px 0 rgba(255,255,255,0.5)' }}>
                        <td className="px-3 py-2 font-mono font-semibold tracking-wide text-sm" style={{ color: '#E8621A' }}>{b.booking_id}</td>
                        <td className={`px-3 py-2 text-xs ${dark ? 'text-gray-200' : 'text-stone-900'}`}><p>{b.patient_name}</p><p className={`text-xs ${dark ? 'text-gray-400' : 'text-stone-600'}`}>{b.patient_email}</p></td>
                        <td className={`px-3 py-2 text-xs ${dark ? 'text-gray-300' : 'text-stone-700'}`}>
                          <p className="font-medium">{new Date(b.preferred_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</p>
                          <p className={`${dark ? 'text-gray-400' : 'text-stone-500'}`}>{b.preferred_time}</p>
                        </td>
                        <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(b).cls}`}>{getStatusBadge(b).label}</span></td>
                        <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded text-xs font-medium ${getPaymentBadge(b).cls}`}>{getPaymentBadge(b).label}</span></td>
                        {activeTab === 'online' && <td className={`px-3 py-2 text-xs ${dark ? 'text-gray-300' : 'text-stone-700'}`}>₹{b.amount || 0}</td>}
                        <td className="px-3 py-2">
                          {actions.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {actions.includes('confirm') && (
                                <button onClick={() => performAction(b.booking_id, 'confirm')} className="px-2 py-0.5 rounded bg-green-500 text-white text-xs hover:bg-green-600 transition">Confirm</button>
                              )}
                              {actions.includes('cancel') && (
                                <button onClick={() => performAction(b.booking_id, 'cancel')} className="px-2 py-0.5 rounded bg-red-500 text-white text-xs hover:bg-red-600 transition">Cancel</button>
                              )}
                              {actions.includes('approve_reschedule') && (
                                <button onClick={() => performAction(b.booking_id, 'approve_reschedule')} className="px-2 py-0.5 rounded bg-blue-500 text-white text-xs hover:bg-blue-600 transition">Approve</button>
                              )}
                              {actions.includes('reject_reschedule') && (
                                <button onClick={() => performAction(b.booking_id, 'reject_reschedule')} className="px-2 py-0.5 rounded bg-orange-500 text-white text-xs hover:bg-orange-600 transition">Reject</button>
                              )}
                              {actions.includes('mark_completed') && (
                                <button onClick={() => performAction(b.booking_id, 'mark_completed')} className="px-2 py-0.5 rounded bg-blue-500 text-white text-xs hover:bg-blue-600 transition">Completed</button>
                              )}
                              {actions.includes('mark_no_show') && (
                                <button onClick={() => performAction(b.booking_id, 'mark_no_show')} className="px-2 py-0.5 rounded bg-slate-500 text-white text-xs hover:bg-slate-600 transition">No Show</button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      </div>
    </AdminGuard>
  )
}
