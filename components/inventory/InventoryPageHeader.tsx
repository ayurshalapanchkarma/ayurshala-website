'use client'

import { ComponentType, ReactNode } from 'react'

interface InventoryPageHeaderProps {
  /** Pass either a Lucide component: icon={Package}  or JSX: icon={<Package className="w-6 h-6" />} */
  icon: ComponentType<{ className?: string }> | ReactNode
  iconColor: string
  bgColor: string
  title: string
  subtitle?: string
}

/**
 * InventoryPageHeader - Reusable multi-colored header for all Inventory pages.
 *
 * Accepts a Lucide icon component reference OR pre-rendered JSX:
 *
 * @example
 * // Component reference (preferred):
 * <InventoryPageHeader
 *   icon={Package}
 *   iconColor="text-sky-600 dark:text-sky-400"
 *   bgColor="bg-sky-100 dark:bg-sky-950/40"
 *   title="Products"
 *   subtitle="Manage inventory products"
 * />
 *
 * @example
 * // JSX element also works:
 * <InventoryPageHeader icon={<Package />} iconColor="..." bgColor="..." title="..." />
 */
export default function InventoryPageHeader({
  icon,
  iconColor,
  bgColor,
  title,
  subtitle,
}: InventoryPageHeaderProps) {
  // If icon is a component (function), render it; otherwise render as ReactNode
  const IconElement =
    typeof icon === 'function'
      ? (() => {
          const Icon = icon as ComponentType<{ className?: string }>
          return <Icon className={`w-6 h-6 ${iconColor}`} />
        })()
      : icon

  return (
    <div className="mb-6 flex items-start gap-4">
      {/* Colored icon container */}
      <div className={`${bgColor} rounded-xl p-3 flex-shrink-0 flex items-center justify-center`}>
        {IconElement}
      </div>

      {/* Title & Subtitle */}
      <div className="flex-1 min-w-0 pt-1">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}
