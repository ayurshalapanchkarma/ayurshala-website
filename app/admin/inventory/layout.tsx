'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AdminGuard } from '@/components/AdminGuard'
import { ChevronDown, Menu, X, Package, Settings, FileText, AlertCircle, TrendingUp, ShoppingCart, Truck, BarChart3, Home, Search, Plus, Bell, User, ChevronLeft, MapPin } from 'lucide-react'

interface NavSection {
  label: string
  icon: React.ReactNode
  items: { label: string; href: string }[]
}

const navSections: NavSection[] = [
  {
    label: 'Masters',
    icon: <Package className="w-4 h-4" />,
    items: [
      { label: 'Products', href: '/admin/inventory/products' },
      { label: 'Categories', href: '/admin/inventory/categories' },
      { label: 'Units', href: '/admin/inventory/units' },
      { label: 'Manufacturers', href: '/admin/inventory/manufacturers' },
      { label: 'Suppliers', href: '/admin/inventory/suppliers' },
      { label: 'Warehouses', href: '/admin/inventory/warehouses' },
    ]
  },
  {
    label: 'Operations',
    icon: <ShoppingCart className="w-4 h-4" />,
    items: [
      { label: 'Purchase Orders', href: '/admin/inventory/purchase-orders' },
      { label: 'GRN', href: '/admin/inventory/grns' },
      { label: 'Batches', href: '/admin/inventory/batches' },
    ]
  },
  {
    label: 'Stock',
    icon: <Truck className="w-4 h-4" />,
    items: [
      { label: 'Current Stock', href: '/admin/inventory/current-stock' },
      { label: 'Transactions', href: '/admin/inventory/transactions' },
      { label: 'Stock Ledger', href: '/admin/inventory/stock-ledger' },
      { label: 'Adjustments', href: '/admin/inventory/adjustments' },
    ]
  },
  {
    label: 'Monitoring',
    icon: <AlertCircle className="w-4 h-4" />,
    items: [
      { label: 'Low Stock', href: '/admin/inventory/low-stock' },
      { label: 'Expiring Stock', href: '/admin/inventory/expiring-stock' },
    ]
  },
  {
    label: 'Reports',
    icon: <BarChart3 className="w-4 h-4" />,
    items: [
      { label: 'Reports', href: '/admin/inventory/reports' },
    ]
  },
  {
    label: 'Settings',
    icon: <Settings className="w-4 h-4" />,
    items: [
      { label: 'Inventory Settings', href: '/admin/inventory/settings' },
    ]
  }
]

export default function InventoryLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const pathname = usePathname()

  useEffect(() => {
    const saved = localStorage.getItem('inventory-sidebar-expanded')
    if (saved) {
      setExpandedSections(JSON.parse(saved))
    } else {
      setExpandedSections({ Masters: true })
    }
  }, [])

  const toggleSection = (section: string) => {
    const newState = { ...expandedSections, [section]: !expandedSections[section] }
    setExpandedSections(newState)
    localStorage.setItem('inventory-sidebar-expanded', JSON.stringify(newState))
  }

  const isActive = (href: string) => pathname === href

  const getBreadcrumb = () => {
    const segments = pathname.split('/').filter(Boolean)
    if (segments.length <= 2) return null
    
    const lastSegment = segments[segments.length - 1]
    const formatted = lastSegment.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    return formatted
  }

  return (
    <AdminGuard>
      <div className="flex h-screen bg-gray-50 dark:bg-slate-950">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-60' : 'w-16'} bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 transition-all duration-300 flex flex-col overflow-hidden fixed h-screen z-40`}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
            {sidebarOpen && <h2 className="font-semibold text-slate-900 dark:text-white text-sm">📦 Inventory</h2>}
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded transition">
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-2">
            {/* Home link */}
            <Link href="/admin/inventory" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition mb-1 ${isActive('/admin/inventory') ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'}`}>
              <Home className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && <span>Overview</span>}
            </Link>

            {/* Section navigation */}
            {navSections.map(section => (
              <div key={section.label}>
                <button
                  onClick={() => toggleSection(section.label)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${expandedSections[section.label] ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'} hover:bg-gray-100 dark:hover:bg-slate-800`}
                >
                  {section.icon}
                  {sidebarOpen && (
                    <>
                      <span className="flex-1 text-left text-xs">{section.label}</span>
                      <ChevronDown className={`w-3 h-3 transition ${expandedSections[section.label] ? 'rotate-180' : ''}`} />
                    </>
                  )}
                </button>

                {(sidebarOpen && expandedSections[section.label]) && (
                  <div className="ml-2 mt-0.5 space-y-0.5">
                    {section.items.map(item => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`block px-3 py-1.5 rounded text-xs transition ${isActive(item.href) ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'}`}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Main content */}
        <div className={`${sidebarOpen ? 'ml-60' : 'ml-16'} flex-1 flex flex-col overflow-hidden transition-all duration-300`}>
          {/* Top bar */}
          <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-6 py-3 flex items-center justify-between gap-4 sticky top-0 z-30">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <Link href="/admin" className="flex items-center gap-1 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition">
                <ChevronLeft className="w-4 h-4" />
                Back
              </Link>
              {getBreadcrumb() && <span className="text-sm text-gray-600 dark:text-gray-400">{getBreadcrumb()}</span>}
            </div>
            <div className="flex items-center gap-3">
              <div className="relative hidden sm:block w-48">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input placeholder="Search..." className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition">
                <Plus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition relative">
                <Bell className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition">
                <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </div>
      </div>
    </AdminGuard>
  )
}
