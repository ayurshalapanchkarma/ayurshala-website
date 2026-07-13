'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AdminGuard } from '@/components/AdminGuard'
import AdminPremiumHeader from '@/components/admin/AdminPremiumHeader'
import { Calendar, Clock, Wallet, TrendingUp, FileText, Package, Users, Stethoscope, CreditCard, BarChart3, Settings, ClipboardList, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'

type Booking = {
  id: number
  preferred_date: string
  status: string
  payment_status: string
  amount?: number
}

const modules = [
  { label: 'Appointments', icon: Calendar, href: '/admin/appointments', color: 'blue', description: 'Manage appointments and bookings' },
  { label: 'Doctors', icon: Stethoscope, href: '/admin/doctors', color: 'green', description: 'Doctor profiles and availability' },
  { label: 'Patients', icon: Users, href: '/admin/patients', color: 'purple', description: 'Patient management' },
  { label: 'Billing', icon: CreditCard, href: '/admin/billing', color: 'amber', description: 'Payment and invoicing' },
  { label: 'Certificates', icon: FileText, href: '/admin/certificates', color: 'indigo', description: 'Medical certificates' },
  { label: 'Inventory', icon: Package, href: '/admin/inventory', color: 'emerald', description: 'Stock and products' },
  { label: 'Discharge Summaries', icon: ClipboardList, href: '/admin/discharge-summaries', color: 'cyan', description: 'Patient discharge records archive' },
  { label: 'Reports', icon: BarChart3, href: '/admin/reports', color: 'pink', description: 'Analytics and reports' },
  { label: 'Settings', icon: Settings, href: '/admin/settings', color: 'slate', description: 'System configuration' },
]

const colorMap = {
  blue: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50',
  green: 'bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-900/50',
  purple: 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/50',
  amber: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50',
  indigo: 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50',
  emerald: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50',
  cyan: 'bg-cyan-50 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-900/50',
  pink: 'bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-900/50',
  slate: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
}

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false)
  const [stats, setStats] = useState({ today: 0, pending: 0, cash: 0, revenue: 0, refunds: 0, alerts: 0 })
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('admin-theme')
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setTheme('dark')
      document.documentElement.classList.add('dark')
    } else {
      setTheme('light')
      document.documentElement.classList.remove('dark')
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    try {
      const res = await fetch('/api/admin/bookings?payment=ALL')
      const { bookings: data } = await res.json()
      
      const now = new Date()
      const today = data?.filter((b: Booking) => {
        const bDate = new Date(b.preferred_date)
        return bDate.toDateString() === now.toDateString()
      }) || []

      const pRes = await fetch('/api/admin/revenue')
      const pData = await pRes.json()

      setStats({
        today: today.length,
        pending: data?.filter((b: Booking) => b.status === 'PENDING_CONFIRMATION').length || 0,
        cash: data?.filter((b: Booking) => b.payment_status === 'PENDING' || b.payment_status === 'COD_PENDING').length || 0,
        revenue: pData.grossRevenue || 0,
        refunds: pData.totalRefunds || 0,
        alerts: 0,
      })
    } catch (e) {
      console.error('Failed to fetch stats:', e)
    }
  }

  const dark = mounted && theme === 'dark'

  return (
    <div className={`${dark ? 'bg-slate-950' : 'bg-gray-50'}`}>
      {/* Admin Premium Header */}
      <AdminPremiumHeader 
        title="Ayurshala Admin Console"
        subtitle="Clinical Management System"
      />
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            {[
              { label: 'Today', value: stats.today, icon: Calendar },
              { label: 'Pending', value: stats.pending, icon: Clock },
              { label: 'Cash Pending', value: stats.cash, icon: Wallet },
              { label: 'Revenue', value: `₹${stats.revenue}`, icon: TrendingUp },
              { label: 'Refunds', value: `₹${stats.refunds}`, icon: FileText },
              { label: 'Alerts', value: stats.alerts, icon: Package },
            ].map((kpi, i) => {
              const Icon = kpi.icon
              return (
                <div key={i} className={`rounded-lg p-4 border transition ${dark ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-700/50' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <p className={`text-xs font-medium uppercase tracking-wide ${dark ? 'text-slate-400' : 'text-slate-600'}`}>{kpi.label}</p>
                    <Icon className="w-4 h-4 text-orange-600" />
                  </div>
                  <p className={`text-2xl font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>{kpi.value}</p>
                </div>
              )
            })}
          </div>

          {/* Module Grid */}
          <div>
            <h2 className={`text-sm font-semibold uppercase tracking-wider mb-4 ${dark ? 'text-slate-400' : 'text-slate-600'}`}>Modules</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {modules.map((module, i) => {
                const Icon = module.icon
                const colors = colorMap[module.color as keyof typeof colorMap]
                return (
                  <Link key={i} href={module.href}>
                    <motion.div whileHover={{ y: -4 }} className={`rounded-lg p-4 border cursor-pointer transition ${dark ? 'bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:bg-slate-700/50' : 'bg-white border-gray-200 hover:border-orange-300 hover:bg-gray-50'}`}>
                      <div className={`w-10 h-10 rounded-lg ${colors} flex items-center justify-center mb-3 border`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className={`font-medium text-sm ${dark ? 'text-white' : 'text-slate-900'}`}>{module.label}</h3>
                          <p className={`text-xs mt-1 ${dark ? 'text-slate-400' : 'text-slate-600'}`}>{module.description}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                      </div>
                    </motion.div>
                  </Link>
                )
              })}
            </div>
          </div>
        </main>
      </div>
  )
}
