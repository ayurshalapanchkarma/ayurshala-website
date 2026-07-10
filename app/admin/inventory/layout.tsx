'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import InventoryNavbar from '@/components/admin/InventoryNavbar'
import { 
  ChevronDown, Menu, X, Home, Tooltip,
  LayoutDashboard, Package2, Tags, Ruler, Factory, Truck as TruckIcon, MapPin,
  ShoppingCart, ClipboardList, Receipt, Boxes, SlidersHorizontal,
  Archive, ArrowLeftRight, BookOpen,
  CircleAlert, TriangleAlert, Clock,
  BarChart3, FileBarChart,
  Settings, ReceiptText
} from 'lucide-react'

interface NavSection {
  label: string
  icon: React.ReactNode
  items: { label: string; href: string; icon: React.ReactNode }[]
}

const navSections: NavSection[] = [
  {
    label: 'Overview',
    icon: <LayoutDashboard className="w-4 h-4" />,
    items: [
      { label: 'Dashboard', href: '/admin/inventory', icon: <LayoutDashboard className="w-4 h-4" /> },
    ]
  },
  {
    label: 'Masters',
    icon: <Package2 className="w-4 h-4" />,
    items: [
      { label: 'Products', href: '/admin/inventory/products', icon: <Package2 className="w-4 h-4" /> },
      { label: 'Categories', href: '/admin/inventory/categories', icon: <Tags className="w-4 h-4" /> },
      { label: 'Units', href: '/admin/inventory/units', icon: <Ruler className="w-4 h-4" /> },
      { label: 'Manufacturers', href: '/admin/inventory/manufacturers', icon: <Factory className="w-4 h-4" /> },
      { label: 'Suppliers', href: '/admin/inventory/suppliers', icon: <TruckIcon className="w-4 h-4" /> },
      { label: 'Warehouses', href: '/admin/inventory/warehouses', icon: <MapPin className="w-4 h-4" /> },
    ]
  },
  {
    label: 'Operations',
    icon: <ShoppingCart className="w-4 h-4" />,
    items: [
      { label: 'Purchase Orders', href: '/admin/inventory/purchase-orders', icon: <ClipboardList className="w-4 h-4" /> },
      { label: 'GRN', href: '/admin/inventory/grns', icon: <Receipt className="w-4 h-4" /> },
      { label: 'Batches', href: '/admin/inventory/batches', icon: <Boxes className="w-4 h-4" /> },
      { label: 'Adjustments', href: '/admin/inventory/adjustments', icon: <SlidersHorizontal className="w-4 h-4" /> },
    ]
  },
  {
    label: 'Stock',
    icon: <Boxes className="w-4 h-4" />,
    items: [
      { label: 'Current Stock', href: '/admin/inventory/current-stock', icon: <Archive className="w-4 h-4" /> },
      { label: 'Transactions', href: '/admin/inventory/transactions', icon: <ArrowLeftRight className="w-4 h-4" /> },
      { label: 'Stock Ledger', href: '/admin/inventory/stock-ledger', icon: <BookOpen className="w-4 h-4" /> },
    ]
  },
  {
    label: 'Monitoring',
    icon: <CircleAlert className="w-4 h-4" />,
    items: [
      { label: 'Low Stock', href: '/admin/inventory/low-stock', icon: <TriangleAlert className="w-4 h-4" /> },
      { label: 'Expiring Stock', href: '/admin/inventory/expiring-stock', icon: <Clock className="w-4 h-4" /> },
    ]
  },
  {
    label: 'Reports',
    icon: <BarChart3 className="w-4 h-4" />,
    items: [
      { label: 'Reports', href: '/admin/inventory/reports', icon: <FileBarChart className="w-4 h-4" /> },
    ]
  },
  {
    label: 'Settings',
    icon: <Settings className="w-4 h-4" />,
    items: [
      { label: 'Inventory Settings', href: '/admin/inventory/settings', icon: <Settings className="w-4 h-4" /> },
      { label: 'Tax Master', href: '/admin/inventory/settings/taxes', icon: <ReceiptText className="w-4 h-4" /> },
    ]
  }
]

export default function InventoryLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const [showTooltip, setShowTooltip] = useState<string | null>(null)
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

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-60' : 'w-16'} transition-all duration-300 flex flex-col overflow-hidden fixed h-screen z-40 pt-24`}>
        {/* Sidebar Glass Container */}
        <div className="m-3 flex-1 rounded-2xl bg-white/70 dark:bg-slate-900/65 backdrop-blur-xl border border-gray-200/50 dark:border-slate-700/50 shadow-xl overflow-hidden flex flex-col">
          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-2">
            {navSections.map(section => (
              <div key={section.label}>
                {/* Section header */}
                <button
                  onClick={() => toggleSection(section.label)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition relative ${expandedSections[section.label] ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'} hover:bg-gray-100 dark:hover:bg-slate-800`}
                  onMouseEnter={() => !sidebarOpen && setShowTooltip(section.label)}
                  onMouseLeave={() => setShowTooltip(null)}
                >
                  {section.icon}
                  {sidebarOpen && (
                    <>
                      <span className="flex-1 text-left text-xs">{section.label}</span>
                      <ChevronDown className={`w-3 h-3 transition ${expandedSections[section.label] ? 'rotate-180' : ''}`} />
                    </>
                  )}
                </button>

                {/* Tooltip for collapsed sidebar */}
                {!sidebarOpen && showTooltip === section.label && (
                  <div className="absolute left-16 top-14 bg-gray-900 dark:bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none">
                    {section.label}
                  </div>
                )}

                {/* Section items */}
                {(sidebarOpen && expandedSections[section.label]) && (
                  <div className="ml-2 mt-0.5 space-y-0.5">
                    {section.items.map(item => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs transition ${isActive(item.href) ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'}`}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Collapsed items - icon only */}
                {!sidebarOpen && expandedSections[section.label] && (
                  <div className="ml-0 mt-0.5 space-y-0.5">
                    {section.items.map(item => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center justify-center p-2 rounded text-xs transition relative group ${isActive(item.href) ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'}`}
                        title={item.label}
                      >
                        {item.icon}
                        {/* Tooltip for collapsed item */}
                        <div className="absolute left-16 bg-gray-900 dark:bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50 opacity-0 group-hover:opacity-100 transition pointer-events-none">
                          {item.label}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className={`${sidebarOpen ? 'ml-60' : 'ml-16'} flex-1 flex flex-col overflow-hidden transition-all duration-300`}>
        {/* Inventory Navbar - Full width, no margins */}
        <div className="px-0">
          <InventoryNavbar 
            title="Ayurshala Inventory Console"
            subtitle="Inventory • Procurement • Stock Control"
          />
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  )
}
