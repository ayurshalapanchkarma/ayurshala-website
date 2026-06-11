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
  refund_status?: string
  refund_amount?: number
  refund_reason?: string
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
  const { status, payment_method, payment_status, amount, refund_amount } = booking

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

  // Refund states - check if refund exists
  if (refund_amount && refund_amount > 0) {
    if (refund_amount === amount) {
      return { label: `Fully Refunded ₹${refund_amount}`, cls: 'bg-blue-100/80 text-blue-900 dark:bg-blue-950/50 dark:text-blue-200' }
    } else {
      return { label: `Partially Refunded ₹${refund_amount}`, cls: 'bg-indigo-100/80 text-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-200' }
    }
  }

  // Preserve existing payment state for other statuses
  if (payment_status === 'PAID' || payment_status === 'SUCCESS') {
    return { label: 'Paid', cls: 'bg-green-100/80 text-green-900 dark:bg-green-950/50 dark:text-green-200' }
  }

  if (payment_status === 'PENDING' || payment_status === 'COD_PENDING') {
    return { label: 'Cash Pending', cls: 'bg-orange-100/80 text-orange-900 dark:bg-orange-950/50 dark:text-orange-200' }
  }

  if (payment_status === 'REFUND_PENDING') {
    return { label: 'Refund Pending', cls: 'bg-indigo-100/80 text-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-200' }
  }

  if (payment_status === 'NO_CASH_COLLECTED') {
    return { label: 'No Cash Collected', cls: 'bg-slate-100/80 text-slate-700 dark:bg-slate-800/80 dark:text-slate-200' }
  }

  if (payment_status === 'FAILED') {
    return { label: 'Failed', cls: 'bg-red-100/80 text-red-900 dark:bg-red-950/50 dark:text-red-200' }
  }

  return { label: payment_status || 'Unknown', cls: 'bg-gray-100/80 text-gray-900 dark:bg-gray-950/50 dark:text-gray-200' }
}

const getAvailableActions = (booking: Booking) => {
  const { status, refund_status } = booking

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

  // CANCELLED + REFUND_PENDING: Show Record Refund
  if (status === 'CANCELLED' && refund_status === 'REFUND_PENDING') return ['record_refund']

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
  const [stats, setStats] = useState({ today: 0, pending: 0, cash: 0, refunds: 0, completed: 0, grossRevenue: 0, totalRefunds: 0, netRevenue: 0 })
  const [refundModal, setRefundModal] = useState<{ booking_id: string; amount: number; reason: string } | null>(null)
  const [refundLoading, setRefundLoading] = useState(false)
  const [sortField, setSortField] = useState<'booking' | 'patient' | 'date' | 'status' | 'payment' | 'action'>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
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
    let grossRevenue = 0, totalRefunds = 0, netRevenue = 0
    try {
      const pRes = await fetch('/api/admin/revenue')
      const pData = await pRes.json()
      grossRevenue = pData.grossRevenue || 0
      totalRefunds = pData.totalRefunds || 0
      netRevenue = pData.netRevenue || 0
    } catch (e) {
      console.error('Failed to fetch revenue:', e)
    }
    
    setStats({
      today: today.length,
      pending: data?.filter((b: Booking) => b.status === 'PENDING_CONFIRMATION').length || 0,
      cash: data?.filter((b: Booking) => b.payment_method === 'CASH_ON_ARRIVAL').length || 0,
      refunds: data?.filter((b: Booking) => b.payment_status === 'REFUNDED').length || 0,
      completed: data?.filter((b: Booking) => b.status === 'COMPLETED').length || 0,
      grossRevenue,
      totalRefunds,
      netRevenue,
    })
    
    setBookings(data || [])
    setLoading(false)
  }

  async function performAction(booking_id: string, action: string) {
    if (action === 'record_refund') {
      setRefundModal({ booking_id, amount: 0, reason: '' })
      return
    }

    const endpoint = action === 'confirm' ? '/api/admin/confirm' : 
                     action === 'cancel' ? '/api/admin/cancel' :
                     action === 'approve_reschedule' ? '/api/admin/confirm-reschedule' :
                     action === 'reject_reschedule' ? '/api/admin/cancel-reschedule' :
                     '/api/admin/bookings'

    // Optimistic update for confirm/cancel
    const isOptimistic = action === 'confirm' || action === 'cancel'
    const newStatus = action === 'confirm' ? 'CONFIRMED' : action === 'cancel' ? 'CANCELLED' : null
    
    if (isOptimistic && newStatus) {
      setBookings(prev => prev.map(b => b.booking_id === booking_id ? { ...b, status: newStatus } : b))
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, booking_id }),
    })

    if (res.ok) {
      if (!isOptimistic) {
        await fetchBookings()
      }
      const evt = new CustomEvent('bookingUpdated', { detail: { booking_id, action } })
      window.dispatchEvent(evt)
    } else {
      // Revert optimistic update on error
      if (isOptimistic) {
        await fetchBookings()
      }
    }
  }

  async function submitRefund() {
    if (!refundModal || refundLoading) return
    const { booking_id, amount, reason } = refundModal
    const booking = bookings.find(b => b.booking_id === booking_id)
    if (!booking || amount < 0 || amount > (booking.amount || 0)) return

    setRefundLoading(true)
    const res = await fetch('/api/admin/refund', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_id, refund_amount: amount, refund_reason: reason }),
    })

    if (res.ok) {
      setRefundModal(null)
      await fetchBookings()
    }
    setRefundLoading(false)
  }

  function handleSort(field: typeof sortField) {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      // Default direction based on field
      setSortDirection(field === 'date' ? 'desc' : field === 'status' || field === 'payment' ? 'asc' : 'asc')
    }
  }

  const statusOrder = { PENDING_CONFIRMATION: 0, PAYMENT_PENDING: 1, CONFIRMED: 2, RESCHEDULED: 3, RESCHEDULE_CONFIRMED: 4, RESCHEDULE_REJECTED: 5, CANCELLED: 6, COMPLETED: 7, NO_SHOW: 8, IN_PROGRESS: 9 }
  const paymentOrder = { PAID: 0, REFUND_PENDING: 1, REFUNDED: 2, PENDING: 3, COD_PENDING: 4, SUCCESS: 0, FAILED: 5 }
  const actionPriority = (b: Booking) => {
    const actions = getAvailableActions(b)
    if (actions.includes('confirm')) return 0
    if (actions.includes('approve_reschedule')) return 1
    if (actions.includes('record_refund')) return 2
    if (actions.includes('cancel')) return 3
    return 4
  }

  const sortedBookings = [...bookings].sort((a, b) => {
    let compareResult = 0
    
    if (sortField === 'booking') {
      compareResult = a.booking_id.localeCompare(b.booking_id)
    } else if (sortField === 'patient') {
      compareResult = a.patient_name.localeCompare(b.patient_name)
    } else if (sortField === 'date') {
      const dateA = new Date(a.preferred_date + ' ' + a.preferred_time).getTime()
      const dateB = new Date(b.preferred_date + ' ' + b.preferred_time).getTime()
      compareResult = dateA - dateB
    } else if (sortField === 'status') {
      compareResult = (statusOrder[a.status as keyof typeof statusOrder] || 10) - (statusOrder[b.status as keyof typeof statusOrder] || 10)
    } else if (sortField === 'payment') {
      compareResult = (paymentOrder[a.payment_status as keyof typeof paymentOrder] || 10) - (paymentOrder[b.payment_status as keyof typeof paymentOrder] || 10)
    } else if (sortField === 'action') {
      compareResult = actionPriority(a) - actionPriority(b)
    }

    return sortDirection === 'desc' ? -compareResult : compareResult
  })

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
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
          {[
            { label: "Today's", value: stats.today, icon: Calendar },
            { label: 'Pending', value: stats.pending, icon: ClockIcon },
            { label: 'Cash Pending', value: stats.cash, icon: Wallet },
            { label: 'Gross Revenue', value: `₹${stats.grossRevenue}`, icon: TrendingUp },
            { label: 'Total Refunds', value: `₹${stats.totalRefunds}`, icon: TrendingUp },
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
                    <th onClick={() => handleSort('booking')} className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer select-none transition-colors hover:text-orange-600 ${dark ? 'text-gray-300' : 'text-stone-700'}`} title="Click to sort">Booking ID {sortField === 'booking' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                    <th onClick={() => handleSort('patient')} className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer select-none transition-colors hover:text-orange-600 ${dark ? 'text-gray-300' : 'text-stone-700'}`} title="Click to sort">Patient {sortField === 'patient' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                    <th onClick={() => handleSort('date')} className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer select-none transition-colors hover:text-orange-600 ${dark ? 'text-gray-300' : 'text-stone-700'}`} title="Click to sort">Date & Time {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                    <th onClick={() => handleSort('status')} className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer select-none transition-colors hover:text-orange-600 ${dark ? 'text-gray-300' : 'text-stone-700'}`} title="Click to sort">Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                    <th onClick={() => handleSort('payment')} className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer select-none transition-colors hover:text-orange-600 ${dark ? 'text-gray-300' : 'text-stone-700'}`} title="Click to sort">Payment {sortField === 'payment' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                    {activeTab === 'online' && <th className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider ${dark ? 'text-gray-300' : 'text-stone-700'}`}>Amount</th>}
                    <th onClick={() => handleSort('action')} className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer select-none transition-colors hover:text-orange-600 ${dark ? 'text-gray-300' : 'text-stone-700'}`} title="Click to sort">Action {sortField === 'action' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedBookings.map((b, i) => {
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
                              {actions.includes('record_refund') && (
                                <button onClick={() => performAction(b.booking_id, 'record_refund')} className="px-2 py-0.5 rounded bg-indigo-500 text-white text-xs hover:bg-indigo-600 transition">Record Refund</button>
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

        {/* Net Revenue Card */}
        <div className="mt-5 rounded-2xl p-6" style={cardStyle}>
          <h3 className={`text-lg font-semibold mb-4 ${dark ? 'text-white' : 'text-stone-900'}`}>Revenue Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg ${dark ? 'bg-slate-800/50' : 'bg-orange-50'}`}>
              <p className={`text-xs uppercase tracking-wider ${dark ? 'text-gray-400' : 'text-stone-500'}`}>Gross Revenue</p>
              <p className="text-2xl font-bold mt-2" style={{ color: '#E8621A' }}>₹{stats.grossRevenue}</p>
            </div>
            <div className={`p-4 rounded-lg ${dark ? 'bg-slate-800/50' : 'bg-red-50'}`}>
              <p className={`text-xs uppercase tracking-wider ${dark ? 'text-gray-400' : 'text-stone-500'}`}>Total Refunds</p>
              <p className="text-2xl font-bold mt-2 text-red-600">₹{stats.totalRefunds}</p>
            </div>
            <div className={`p-4 rounded-lg ${dark ? 'bg-slate-800/50' : 'bg-green-50'}`}>
              <p className={`text-xs uppercase tracking-wider ${dark ? 'text-gray-400' : 'text-stone-500'}`}>Net Revenue</p>
              <p className="text-2xl font-bold mt-2 text-green-600">₹{stats.netRevenue}</p>
            </div>
          </div>
        </div>

        {/* Refund Modal */}
        {refundModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <h2 className={`text-lg font-semibold mb-4 ${dark ? 'text-white' : 'text-stone-900'}`}>Record Refund</h2>
              {(() => {
                const booking = bookings.find(b => b.booking_id === refundModal.booking_id)
                return booking ? (
                  <div className={`text-sm space-y-4 ${dark ? 'text-gray-300' : 'text-stone-600'}`}>
                    <div>
                      <p className="font-medium">Booking ID</p>
                      <p>{booking.booking_id}</p>
                    </div>
                    <div>
                      <p className="font-medium">Paid Amount</p>
                      <p>₹{booking.amount || 0}</p>
                    </div>
                    <div>
                      <label className="block font-medium mb-1">Refund Amount (₹)</label>
                      <input type="number" min="0" max={booking.amount || 0} value={refundModal.amount} onChange={(e) => setRefundModal({ ...refundModal, amount: parseFloat(e.target.value) || 0 })} className={`w-full px-3 py-2 border rounded-lg ${dark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-stone-300 text-stone-900'}`} />
                    </div>
                    <div>
                      <label className="block font-medium mb-1">Reason</label>
                      <textarea value={refundModal.reason} onChange={(e) => setRefundModal({ ...refundModal, reason: e.target.value })} className={`w-full px-3 py-2 border rounded-lg text-sm ${dark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-stone-300 text-stone-900'}`} rows={3} placeholder="e.g., Patient cancelled, duplicate booking" />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button onClick={submitRefund} disabled={refundLoading} className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition disabled:opacity-50">{refundLoading ? 'Processing...' : 'Confirm Refund'}</button>
                      <button onClick={() => setRefundModal(null)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition">Cancel</button>
                    </div>
                  </div>
                ) : null
              })()}
            </motion.div>
          </div>
        )}
      </div>
      </div>
    </AdminGuard>
  )
}
