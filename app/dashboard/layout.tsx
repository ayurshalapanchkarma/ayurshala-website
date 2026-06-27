'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Moon, Sun, Settings, LogOut } from 'lucide-react'
import { useTheme } from 'next-themes'
import { AIAssistant } from '@/components/AIAssistant'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: '📊' },
  { label: 'Patients', href: '/dashboard/patients', icon: '👥' },
  { label: 'Appointments', href: '/dashboard/appointments', icon: '📅' },
  { label: 'Doctors', href: '/dashboard/doctors', icon: '👨‍⚕️' },
  { label: 'Therapists', href: '/dashboard/therapists', icon: '💆' },
  { label: 'Inventory', href: '/dashboard/inventory', icon: '📦' },
  { label: 'Purchases', href: '/dashboard/purchases', icon: '🛒' },
  { label: 'Pharmacy', href: '/dashboard/pharmacy', icon: '💊' },
  { label: 'Prescriptions', href: '/dashboard/prescriptions', icon: '📝' },
  { label: 'Treatments', href: '/dashboard/treatments', icon: '🏥' },
  { label: 'Finance', href: '/dashboard/finance', icon: '💰' },
  { label: 'CRM', href: '/dashboard/crm', icon: '🎯' },
  { label: 'Analytics', href: '/dashboard/analytics', icon: '📈' },
  { label: 'HR', href: '/dashboard/hr', icon: '👔' },
  { label: 'Settings', href: '/dashboard/settings', icon: '⚙️' },
  { label: 'AI Assistant', href: '/dashboard/ai', icon: '🤖' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-slate-800">
          {sidebarOpen && <span className="font-bold text-lg text-primary-600">Ayurshala</span>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                pathname === item.href
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
              title={sidebarOpen ? undefined : item.label}
            >
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="border-t border-gray-200 dark:border-slate-800 p-4 space-y-2">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
            title={sidebarOpen ? undefined : 'Toggle theme'}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            {sidebarOpen && <span className="text-sm font-medium">Theme</span>}
          </button>
          <button
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition"
            title={sidebarOpen ? undefined : 'Logout'}
          >
            <LogOut size={20} />
            {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-8">
          <div className="text-sm text-gray-600 dark:text-gray-400">Welcome back!</div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition">
              <Settings size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">{children}</div>
      </div>

      {/* AI Assistant */}
      <AIAssistant />
    </div>
  )
}
