'use client'

import Link from 'next/link'
import { Package, Layers, Users, TrendingUp, AlertTriangle, Clock, ShoppingCart, Truck, Plus, Upload, Download } from 'lucide-react'
import { InventoryPageWrapper } from '@/components/InventoryPageWrapper'

export default function InventoryOverview() {
  return (
    <InventoryPageWrapper title="Inventory Overview" subtitle="Track your inventory at a glance">
      <div className="space-y-6">
        {/* KPI Cards */}
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Key Metrics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Products', value: '0', icon: Package, color: 'blue' },
              { label: 'Categories', value: '0', icon: Layers, color: 'purple' },
              { label: 'Suppliers', value: '0', icon: Users, color: 'green' },
              { label: 'Stock Value', value: '₹0', icon: TrendingUp, color: 'amber' },
              { label: 'Low Stock', value: '0', icon: AlertTriangle, color: 'red' },
              { label: 'Expiring Soon', value: '0', icon: Clock, color: 'orange' },
              { label: 'Pending POs', value: '0', icon: ShoppingCart, color: 'indigo' },
              { label: 'Today\'s GRN', value: '0', icon: Truck, color: 'cyan' },
            ].map((kpi, i) => {
              const Icon = kpi.icon
              const colorMap: Record<string, string> = {
                blue: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/50',
                purple: 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/50',
                green: 'bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border-green-100 dark:border-green-900/50',
                amber: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/50',
                red: 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/50',
                orange: 'bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900/50',
                indigo: 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50',
                cyan: 'bg-cyan-50 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-400 border-cyan-100 dark:border-cyan-900/50',
              }
              return (
                <div key={i} className={`${colorMap[kpi.color]} rounded-lg p-4 border`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium opacity-75">{kpi.label}</p>
                      <p className="text-2xl font-semibold mt-2">{kpi.value}</p>
                    </div>
                    <Icon className="w-8 h-8 opacity-20" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Create Product', href: '/admin/inventory/products/create', icon: Plus },
              { label: 'Create PO', href: '/admin/inventory/purchase-orders', icon: ShoppingCart },
              { label: 'Receive GRN', href: '/admin/inventory/grn', icon: Truck },
              { label: 'Adjust Stock', href: '/admin/inventory/adjustments', icon: TrendingUp },
              { label: 'Import', href: '#', icon: Upload },
              { label: 'Export', href: '#', icon: Download },
            ].map((action, i) => {
              const Icon = action.icon
              return (
                <Link key={i} href={action.href} className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700 hover:shadow-md hover:border-orange-300 dark:hover:border-orange-600 transition text-center">
                  <div className="flex justify-center mb-2">
                    <Icon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <p className="text-xs font-medium text-slate-900 dark:text-white">{action.label}</p>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </InventoryPageWrapper>
  )
}
