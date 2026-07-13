'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import AdminPremiumHeader from '@/components/admin/AdminPremiumHeader'
import { BackButton } from '@/components/inventory/BackButton'
import { 
  LayoutDashboard, 
  Receipt, 
  ReceiptText, 
  CalendarCheck, 
  BarChart3, 
  Plus, 
  ChevronRight 
} from 'lucide-react'
import { motion } from 'framer-motion'

interface BillingModule {
  label: string
  icon: React.ReactNode
  href: string
  description: string
  color: string
}

const billingModules: BillingModule[] = [
  {
    label: 'Dashboard',
    icon: <LayoutDashboard className="w-6 h-6" />,
    href: '/admin/billing/dashboard',
    description: 'View billing overview and metrics',
    color: 'blue',
  },
  {
    label: 'Create Invoice',
    icon: <Plus className="w-6 h-6" />,
    href: '/admin/billing/create-invoice',
    description: 'Create new invoices for patients',
    color: 'green',
  },
  {
    label: 'Payments',
    icon: <Receipt className="w-6 h-6" />,
    href: '/admin/billing/payments',
    description: 'Track payments and collections',
    color: 'amber',
  },
  {
    label: 'Patient Ledger',
    icon: <ReceiptText className="w-6 h-6" />,
    href: '/admin/billing/patient-ledger',
    description: 'View patient billing history',
    color: 'purple',
  },
  {
    label: 'Daily Closing',
    icon: <CalendarCheck className="w-6 h-6" />,
    href: '/admin/billing/daily-closing',
    description: 'Close daily accounts and reconcile',
    color: 'indigo',
  },
  {
    label: 'Reports',
    icon: <BarChart3 className="w-6 h-6" />,
    href: '/admin/billing/reports',
    description: 'Billing analytics and reports',
    color: 'pink',
  },
]

const colorMap: Record<string, string> = {
  blue: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50',
  green: 'bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-900/50',
  amber: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50',
  purple: 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/50',
  indigo: 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50',
  pink: 'bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-900/50',
}

export default function BillingPage() {
  const [mounted, setMounted] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('admin-theme')
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setTheme('dark')
    } else {
      setTheme('light')
    }
  }, [])

  if (!mounted) return null

  const dark = theme === 'dark'

  return (
    <div className={`${dark ? 'bg-slate-950' : 'bg-gray-50'} min-h-screen transition-colors`}>
      {/* Header */}
      <AdminPremiumHeader 
        title="Ayurshala Billing Console"
        subtitle="Payment & Invoice Management"
        showBackButton
        backTo="/admin"
      />
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-28">
        {/* Back Button */}
        <div className="mb-6">
          <BackButton />
        </div>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${dark ? 'text-white' : 'text-slate-900'}`}>
            Billing Management
          </h1>
          <p className={`text-base ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
            Manage invoices, payments, and billing reports
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {billingModules.map((module, i) => {
            const colors = colorMap[module.color as keyof typeof colorMap]
            return (
              <Link key={i} href={module.href}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className={`rounded-lg p-4 border cursor-pointer transition ${
                    dark
                      ? 'bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:bg-slate-700/50'
                      : 'bg-white border-gray-200 hover:border-orange-300 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg ${colors} flex items-center justify-center mb-3 border`}>
                    {module.icon}
                  </div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className={`font-medium text-sm ${dark ? 'text-white' : 'text-slate-900'}`}>
                        {module.label}
                      </h3>
                      <p className={`text-xs mt-1 ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {module.description}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  </div>
                </motion.div>
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  )
}
