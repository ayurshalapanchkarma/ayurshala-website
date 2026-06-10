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
}

type Tab = 'all' | 'online' | 'offline' | 'refunds'

const getStatusBadge = (status: string, dark: boolean) => {
  const badges: Record<string, any> = {
    CONFIRMED: dark ? { label: 'Confirmed', cls: 'bg-green-900/40 text-green-300' } : { label: 'Confirmed', cls: 'bg-green-100 text-green-800' },
    PENDING_CONFIRMATION: dark ? { label: 'Pending', cls: 'bg-yellow-900/40 text-yellow-300' } : { label: 'Pending', cls: 'bg-yellow-100 text-yellow-800' },
    CANCELLED: dark ? { label: 'Cancelled', cls: 'bg-red-900/40 text-red-300' } : { label: 'Cancelled', cls: 'bg-red-100 text-red-800' },
    COMPLETED: dark ? { label: 'Completed', cls: 'bg-blue-900/40 text-blue-300' } : { label: 'Completed', cls: 'bg-blue-100 text-blue-700' },
    RESCHEDULED: dark ? { label: 'Rescheduled', cls: 'bg-orange-900/40 text-orange-300' } : { label: 'Rescheduled', cls: 'bg-orange-100 text-orange-800' },
  }
  return badges[status] || { label: status, cls: 'bg-gray-100 text-gray-700' }
}

const getPaymentBadge = (status: string, dark: boolean) => {
  const badges: Record<string, any> = {
    SUCCESS: dark ? { label: 'Paid', cls: 'bg-emerald-900/40 text-emerald-300' } : { label: 'Paid', cls: 'bg-green-100 text-green-800' },
    PENDING: dark ? { label: 'Pending', cls: 'bg-amber-900/40 text-amber-300' } : { label: 'Pending', cls: 'bg-amber-100 text-amber-800' },
    FAILED: dark ? { label: 'Failed', cls: 'bg-red-900/40 text-red-300' } : { label: 'Failed', cls: 'bg-red-100 text-red-800' },
    REFUNDED: dark ? { label: 'Refunded', cls: 'bg-blue-900/40 text-blue-300' } : { label: 'Refunded', cls: 'bg-blue-100 text-blue-700' },
    COD_PENDING: dark ? { label: 'Cash Pending', cls: 'bg-amber-900/40 text-amber-300' } : { label: 'Cash Pending', cls: 'bg-amber-100 text-amber-800' },
  }
  return badges[status] || { label: status, cls: 'bg-gray-100 text-gray-700' }
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
    
    setStats({
      today: today.length,
      pending: data?.filter((b: Booking) => b.status === 'PENDING_CONFIRMATION').length || 0,
      cash: data?.filter((b: Booking) => b.payment_method === 'CASH_ON_ARRIVAL').length || 0,
      refunds: data?.filter((b: Booking) => b.payment_status === 'REFUNDED').length || 0,
      completed: data?.filter((b: Booking) => b.status === 'COMPLETED').length || 0,
      revenue: data?.filter((b: Booking) => b.payment_status === 'SUCCESS').reduce((sum: number, b: Booking) => sum + (b.amount || 0), 0) || 0,
    })
    
    setBookings(data || [])
    setLoading(false)
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
                  onClick={() => setTheme(dark ? 'light' : 'dark')}
                  className="px-3 py-2 rounded-lg bg-white/40 text-stone-700 text-xs hover:bg-white/60 transition border border-white/60"
                  title="Toggle dark mode"
                >
                  {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
                <Link href="/" className="px-3 py-2 rounded-lg bg-white/40 text-stone-700 text-xs hover:bg-white/60 transition border border-white/60 flex items-center gap-1">
                  <Home className="w-4 h-4" />
                </Link>
                <button
                  onClick={async () => {
                    await supabase.auth.signOut()
                    router.push('/')
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
            { label: "Today's", value: stats.today, icon: Calendar },
            { label: 'Pending', value: stats.pending, icon: ClockIcon },
            { label: 'Cash Pending', value: stats.cash, icon: Wallet },
            { label: 'Revenue', value: `₹${stats.revenue}`, icon: TrendingUp },
          ].map((stat, i) => {
            const Icon = stat.icon
            return (
              <div key={i} className="rounded-3xl p-6 backdrop-blur-md border transition"
                style={{
                  background: dark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.65)',
                  backdropFilter: 'blur(20px)',
                  border: dark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(255, 255, 255, 0.4)',
                  boxShadow: dark ? '0 8px 32px rgba(232, 98, 26, 0.05)' : '0 8px 32px rgba(232, 98, 26, 0.12)',
                }}>
                <div className="flex items-start justify-between mb-3">
                  <p className={`font-sans text-sm ${dark ? 'text-gray-300' : 'text-gray-600'}`}>{stat.label}</p>
                  <Icon className="w-5 h-5" style={{ color: '#E8621A' }} />
                </div>
                <p className={`text-4xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
              </div>
            )
          })}
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
                    <tr key={b.id} className={`rounded-lg transition ${dark ? 'bg-slate-900/50 hover:bg-slate-800/50' : 'bg-white/60 hover:bg-white/80'} backdrop-blur-md border ${dark ? 'border-white/10' : 'border-white/20'}`}
                      style={{ boxShadow: dark ? 'inset 0 1px 0 rgba(255,255,255,0.1)' : 'inset 0 1px 0 rgba(255,255,255,0.5)' }}>
                      <td className="px-4 py-3 font-mono font-semibold tracking-wide" style={{ color: '#E8621A' }}>{b.booking_id}</td>
                      <td className={`px-4 py-3 text-sm ${dark ? 'text-gray-200' : 'text-stone-900'}`}><p>{b.patient_name}</p><p className={`text-xs ${dark ? 'text-gray-400' : 'text-stone-600'}`}>{b.patient_email}</p></td>
                      <td className={`px-4 py-3 text-xs ${dark ? 'text-gray-300' : 'text-stone-700'}`}>{b.preferred_date} {b.preferred_time}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-1 rounded-lg text-xs ${getStatusBadge(b.status, dark).cls}`}>{getStatusBadge(b.status, dark).label}</span></td>
                      <td className="px-4 py-3"><span className={`px-2 py-1 rounded-lg text-xs ${getPaymentBadge(b.payment_status, dark).cls}`}>{getPaymentBadge(b.payment_status, dark).label}</span></td>
                      {activeTab === 'online' && <td className={`px-4 py-3 text-xs ${dark ? 'text-gray-300' : 'text-stone-700'}`}>₹{b.amount || 0}</td>}
                      <td className="px-4 py-3">
                        {b.status === 'PENDING_CONFIRMATION' && (
                          <div className="flex gap-2">
                            <button onClick={() => confirm(b.booking_id)} className="px-2 py-1 rounded bg-green-500 text-white text-xs hover:bg-green-600 transition">Confirm</button>
                            <button onClick={() => cancel(b.booking_id)} className="px-2 py-1 rounded bg-red-500 text-white text-xs hover:bg-red-600 transition">Cancel</button>
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
      </div>
    </AdminGuard>
  )
}
