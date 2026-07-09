'use client'

import { ComponentType } from 'react'
import { Plus } from 'lucide-react'

interface InventoryPageHeaderProps {
  icon: ComponentType<{ className?: string }>
  iconColor: string
  bgColor: string
  title: string
  subtitle?: string
  onAdd?: () => void
  addButtonLabel?: string
}

/**
 * InventoryPageHeader — reusable colored page header for all Inventory pages.
 * 
 * The header now includes proper padding/spacing to match the reference design (Categories).
 * Icon spacing, title, and subtitle alignment are standardized across all pages.
 * Optional action button can be included via onAdd prop.
 *
 * Usage:
 *   import InventoryPageHeader from '@/components/inventory/InventoryPageHeader'
 *   import { Package } from 'lucide-react'
 *
 *   <InventoryPageHeader
 *     icon={Package}
 *     iconColor="text-sky-600 dark:text-sky-400"
 *     bgColor="bg-sky-100 dark:bg-sky-950/40"
 *     title="Products"
 *     subtitle="Manage inventory products"
 *     onAdd={handleAddProduct}
 *     addButtonLabel="Add Product"
 *   />
 */
export default function InventoryPageHeader({
  icon: Icon,
  iconColor,
  bgColor,
  title,
  subtitle,
  onAdd,
  addButtonLabel,
}: InventoryPageHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 mb-6 pt-0">
      <div className="flex items-center gap-4 flex-1">
        <div className={`${bgColor} rounded-xl p-3 flex-shrink-0`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {onAdd && (
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex-shrink-0"
        >
          <Plus size={20} /> {addButtonLabel || 'Add'}
        </button>
      )}
    </div>
  )
}
