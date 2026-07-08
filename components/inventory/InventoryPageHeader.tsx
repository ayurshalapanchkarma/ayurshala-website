'use client'

import { ComponentType } from 'react'

interface InventoryPageHeaderProps {
  icon: ComponentType<{ className?: string }>
  iconColor: string
  bgColor: string
  title: string
  subtitle?: string
}

/**
 * InventoryPageHeader — reusable colored page header for all Inventory pages.
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
 *   />
 */
export default function InventoryPageHeader({
  icon: Icon,
  iconColor,
  bgColor,
  title,
  subtitle,
}: InventoryPageHeaderProps) {
  return (
    <div className="flex items-center gap-4 mb-6">
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
  )
}
