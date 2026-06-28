'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AdminGuard } from '@/components/AdminGuard'
import { ChevronDown, Menu, X, Package, Settings, FileText, AlertCircle, TrendingUp, ShoppingCart, Truck, BarChart3, Home } from 'lucide-react'

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
    ]
  },
  {
    label: 'Procurement',
    icon: <ShoppingCart className="w-4 h-4" />,
    items: [
      { label: 'Purchase Orders', href: '/admin/inventory/purchase-orders' },
      { label: 'GRN', href: '/admin/inventory/grn' },
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

  // Load sidebar state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('inventory-sidebar-expanded')
    if (saved) {
      setExpandedSections(JSON.parse(saved))
    } else {
      // Default: expand first section
      setExpandedSections({ Masters: true })
    }
  }, [])

  // Save sidebar state
  const toggleSection = (section: string) => {
    const newState = { ...expandedSections, [section]: !expandedSections[section] }
    setExpandedSections(newState)
    localStorage.setItem('inventory-sidebar-expanded', JSON.stringify(newState))
  }

  const isActive = (href: string) => pathname === href

  return (
    <AdminGuard>
      <div className="flex h-screen bg-gray-50 dark:bg-slate-950">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 transition-all duration-300 flex flex-col overflow-hidden`}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
            {sidebarOpen && <h2 className="font-semibold text-slate-900 dark:text-white text-sm">📦 Inventory</h2>}
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded">
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-2">
            {/* Home link */}
            <Link href="/admin/inventory" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition mb-2 ${isActive('/admin/inventory') ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'}`}>
              <Home className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && <span>Overview</span>}
            </Link>

            {/* Section navigation */}
            {navSections.map(section => (
              <div key={section.label} className="mb-1">
                <button
                  onClick={() => toggleSection(section.label)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                >
                  {section.icon}
                  {sidebarOpen && (
                    <>
                      <span className="flex-1 text-left">{section.label}</span>
                      <ChevronDown className={`w-4 h-4 transition ${expandedSections[section.label] ? 'rotate-180' : ''}`} />
                    </>
                  )}
                </button>

                {(sidebarOpen && expandedSections[section.label]) && (
                  <div className="ml-2 mt-1 space-y-0.5">
                    {section.items.map(item => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`block px-3 py-2 rounded-lg text-xs transition ${isActive(item.href) ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'}`}
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
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Inventory Management</h1>
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
