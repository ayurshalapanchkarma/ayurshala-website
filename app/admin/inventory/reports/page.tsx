'use client'

import Link from 'next/link'
import {
  FileText,
  TrendingDown,
  Package,
  AlertTriangle,
  BarChart3,
  DollarSign,
  Archive,
  Receipt,
} from 'lucide-react'
import InventoryPageHeader from '@/components/inventory/InventoryPageHeader'
import { BackButton } from '@/components/inventory/BackButton'

const reports = [
  {
    name: 'Current Stock Report',
    description: 'View all products with current inventory levels',
    icon: Package,
    href: '/admin/inventory/reports/current-stock',
    color: 'bg-blue-100 dark:bg-blue-900',
    textColor: 'text-blue-700 dark:text-blue-300',
  },
  {
    name: 'Stock Movement Report',
    description: 'Track all inventory movements and transactions',
    icon: TrendingDown,
    href: '/admin/inventory/reports/stock-movement',
    color: 'bg-green-100 dark:bg-green-900',
    textColor: 'text-green-700 dark:text-green-300',
  },
  {
    name: 'Inventory Valuation',
    description: 'Calculate total inventory value and analysis',
    icon: DollarSign,
    href: '/admin/inventory/reports/inventory-valuation',
    color: 'bg-purple-100 dark:bg-purple-900',
    textColor: 'text-purple-700 dark:text-purple-300',
  },
  {
    name: 'Purchase Register',
    description: 'Summary of all purchase orders and GRNs',
    icon: Receipt,
    href: '/admin/inventory/reports/purchase-register',
    color: 'bg-orange-100 dark:bg-orange-900',
    textColor: 'text-orange-700 dark:text-orange-300',
  },
  {
    name: 'Batch Report',
    description: 'View all product batches and expiry details',
    icon: Package,
    href: '/admin/inventory/reports/batch',
    color: 'bg-pink-100 dark:bg-pink-900',
    textColor: 'text-pink-700 dark:text-pink-300',
  },
  {
    name: 'Expiry Report',
    description: 'Monitor batches expiring soon',
    icon: AlertTriangle,
    href: '/admin/inventory/reports/expiry',
    color: 'bg-red-100 dark:bg-red-900',
    textColor: 'text-red-700 dark:text-red-300',
  },
  {
    name: 'Low Stock Report',
    description: 'Items below reorder level',
    icon: AlertTriangle,
    href: '/admin/inventory/reports/low-stock',
    color: 'bg-yellow-100 dark:bg-yellow-900',
    textColor: 'text-yellow-700 dark:text-yellow-300',
  },
  {
    name: 'Dead Stock Report',
    description: 'Identify slow-moving or non-moving stock',
    icon: Archive,
    href: '/admin/inventory/reports/dead-stock',
    color: 'bg-gray-100 dark:bg-gray-900',
    textColor: 'text-gray-700 dark:text-gray-300',
  },
]

export default function ReportsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <InventoryPageHeader
        icon={BarChart3}
        iconColor="text-purple-600 dark:text-purple-400"
        bgColor="bg-purple-100 dark:bg-purple-950/40"
        title="Reports"
        subtitle="Inventory reports & analytics"
      />

      <BackButton />

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 mb-6">
        {reports.map((report) => {
          const Icon = report.icon
          return (
            <Link
              key={report.href}
              href={report.href}
              className="group bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
            >
              <div className={`${report.color} p-3 rounded-lg w-fit mb-4 group-hover:scale-110 transition-transform`}>
                <Icon size={24} className={report.textColor} />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">{report.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{report.description}</p>
              <div className="mt-4 text-blue-600 dark:text-blue-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
                View Report →
              </div>
            </Link>
          )
        })}
      </div>

      {/* Quick Stats */}
      <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mt-6">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1 text-sm">Export Formats</h3>
        <p className="text-xs text-blue-700 dark:text-blue-200 leading-5">
          All reports can be exported as CSV, PDF, or printed directly.
        </p>
      </div>
    </div>
  )
}
