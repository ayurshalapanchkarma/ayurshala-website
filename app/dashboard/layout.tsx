'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Moon, Sun, Settings, LogOut, ChevronDown } from 'lucide-react'
import { useTheme } from 'next-themes'
import { AIAssistant } from '@/components/AIAssistant'
import { canAccessInventory } from '@/lib/inventory-permission'

interface NavItem {
  label: string
  href?: string
  icon: string
  submenu?: { label: string; href: string }[]
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: '📊' },
  { label: 'Patients', href: '/dashboard/patients', icon: '👥' },
  { label: 'Appointments', href: '/dashboard/appointments', icon: '📅' },
  { label: 'Doctors', href: '/dashboard/doctors', icon: '👨⚕️' },
  { label: 'Therapists', href: '/dashboard/therapists', icon: '💆' },
  {
    label: 'Inventory',
    icon: '📦',
    submenu: [
      { label: 'Dashboard', href: '/dashboard/inventory/dashboard' },
      { label: 'Products', href: '/dashboard/inventory/products' },
      { label: 'Categories', href: '/dashboard/inventory/categories' },
      { label: 'Units', href: '/dashboard/inventory/units' },
      { label: 'Manufacturers', href: '/dashboard/inventory/manufacturers' },
      { label: 'Suppliers', href: '/dashboard/inventory/suppliers' },
      { label: 'Purchase Orders', href: '/dashboard/inventory/purchase-orders' },
      { label: 'GRN', href: '/dashboard/inventory/grn' },
      { label: 'Batches', href: '/dashboard/inventory/batches' },
      { label: 'Current Stock', href: '/dashboard/inventory/current-stock' },
      { label: 'Stock Ledger', href: '/dashboard/inventory/stock-ledger' },
      { label: 'Transactions', href: '/dashboard/inventory/transactions' },
      { label: 'Adjustments', href: '/dashboard/inventory/adjustments' },
      { label: 'Low Stock', href: '/dashboard/inventory/low-stock' },
      { label: 'Expiring Stock', href: '/dashboard/inventory/expiring-stock' },
      { label: 'Reports', href: '/dashboard/inventory/reports' },
      { label: 'Settings', href: '/dashboard/inventory/settings' },
    ],
  },
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

interface SidebarItemProps {
  item: NavItem
  isActive: boolean
  sidebarOpen: boolean
  canAccessInventory: boolean
  expandedMenu: string | null
  setExpandedMenu: (menu: string | null) => void
}

function SidebarItem({
  item,
  isActive,
  sidebarOpen,
  canAccessInventory: canAccess,
  expandedMenu,
  setExpandedMenu,
}: SidebarItemProps) {
  // Hide inventory if user can't access it
  if (item.label === 'Inventory' && !canAccess) {
    return null
  }

  const isExpanded = expandedMenu === item.label
  const hasSubmenu = item.submenu && item.submenu.length > 0

  if (hasSubmenu) {
    return (
      <div>
        <button
          onClick={() => setExpandedMenu(isExpanded ? null : item.label)}
          className={`w-full flex items-center justify-between gap-3 px-4 py-2 rounded-lg transition ${
            isActive ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
          }`}
          title={sidebarOpen ? undefined : item.label}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">{item.icon}</span>
            {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
          </div>
          {sidebarOpen && (
            <ChevronDown
              size={16}
              className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
          )}
        </button>

        {isExpanded && sidebarOpen && (
          <div className="ml-4 mt-1 space-y-1 border-l border-gray-200 dark:border-slate-700 pl-4">
            {item.submenu!.map((subitem) => (
              <Link
                key={subitem.href}
                href={subitem.href}
                className="flex items-center px-3 py-2 text-xs rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
              >
                {subitem.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Link
      href={item.href!}
      className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
        isActive ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
      }`}
      title={sidebarOpen ? undefined : item.label}
    >
      <span className="text-xl">{item.icon}</span>
      {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
    </Link>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null)
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  // Get user role from session/context (TODO: connect to auth)
  const userRole = 'ADMIN' // This would come from useAuth() or similar
  const canAccessInv = canAccessInventory(userRole)

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
            <SidebarItem
              key={item.label}
              item={item}
              isActive={item.href ? pathname === item.href : pathname.startsWith(`/dashboard/${item.label.toLowerCase()}`)}
              sidebarOpen={sidebarOpen}
              canAccessInventory={canAccessInv}
              expandedMenu={expandedMenu}
              setExpandedMenu={setExpandedMenu}
            />
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
