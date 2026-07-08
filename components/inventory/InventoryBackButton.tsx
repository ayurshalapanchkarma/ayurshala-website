'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

interface InventoryBackButtonProps {
  className?: string
  label?: string
}

/**
 * Reusable back button for all Inventory pages.
 * Always navigates to /admin/inventory (the Inventory Dashboard).
 *
 * Usage:
 * <InventoryBackButton />
 * <InventoryBackButton label="Back to Dashboard" />
 */
export default function InventoryBackButton({
  className = '',
  label = 'Back',
}: InventoryBackButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    router.push('/admin/inventory')
  }

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition ${className}`}
    >
      <ChevronLeft size={18} />
      {label}
    </button>
  )
}
