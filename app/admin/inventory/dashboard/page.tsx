'use client'

import Link from 'next/link'
import { Package, Layers, Users, TrendingUp, AlertTriangle, Clock, ShoppingCart, Truck, Plus } from 'lucide-react'

export default function InventoryDashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            blue: 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400',
            purple: 'bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400',
            green: 'bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400',
            amber: 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400',
            red: 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400',
            orange: 'bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400',
            indigo: 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400',
            cyan: 'bg-cyan-50 dark:bg-cyan-950/20 text-cyan-600 dark:text-cyan-400',
          }
          return (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
              <div className={`w-10 h-10 rounded-lg ${colorMap[kpi.color]} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{kpi.label}</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">{kpi.value}</p>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Create Product', href: '/admin/inventory/products/create', icon: Package },
            { label: 'Create PO', href: '/admin/inventory/purchase-orders', icon: ShoppingCart },
            { label: 'Receive GRN', href: '/admin/inventory/grn', icon: Truck },
            { label: 'Adjust Stock', href: '/admin/inventory/adjustments', icon: TrendingUp },
          ].map((action, i) => {
            const Icon = action.icon
            return (
              <Link key={i} href={action.href} className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-600 transition text-center">
                <div className="bg-orange-50 dark:bg-orange-950/20 w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Icon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <p className="text-xs font-medium text-slate-900 dark:text-white">{action.label}</p>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Inventory Modules */}
      <div>
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Inventory Modules</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: 'Masters', items: 5, color: 'blue' },
            { label: 'Procurement', items: 3, color: 'green' },
            { label: 'Stock', items: 4, color: 'purple' },
            { label: 'Monitoring', items: 2, color: 'amber' },
            { label: 'Reports', items: 1, color: 'indigo' },
            { label: 'Settings', items: 1, color: 'gray' },
          ].map((module, i) => {
            const colorMap: Record<string, string> = {
              blue: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50',
              green: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/50',
              purple: 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/50',
              amber: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50',
              indigo: 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/50',
              gray: 'bg-gray-50 dark:bg-gray-950/20 border-gray-200 dark:border-gray-900/50',
            }
            return (
              <div key={i} className={`${colorMap[module.color]} rounded-lg p-4 border cursor-pointer hover:shadow-md transition`}>
                <p className="font-medium text-slate-900 dark:text-white">{module.label}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{module.items} items</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
