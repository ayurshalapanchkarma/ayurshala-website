'use client'

import Link from 'next/link'
import { Package } from 'lucide-react'

interface InventoryCardProps {
  canAccess?: boolean
}

export function InventoryCard({ canAccess = false }: InventoryCardProps) {
  if (!canAccess) return null

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Inventory Management</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage products, purchases, stock, batches, suppliers and reports.
          </p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
          <Package size={24} className="text-amber-600 dark:text-amber-400" />
        </div>
      </div>
      <div className="flex gap-3">
        <Link
          href="/dashboard/inventory"
          className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition text-center text-sm font-medium"
        >
          Open Inventory
        </Link>
        <Link
          href="/dashboard/inventory/dashboard"
          className="flex-1 px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition text-center text-sm font-medium"
        >
          Dashboard
        </Link>
      </div>
    </div>
  )
}
