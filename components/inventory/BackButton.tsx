'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

interface BackButtonProps {
  href?: string
}

export function BackButton({ href = '/admin/inventory' }: BackButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    if (href === '/admin/inventory' || href === '/admin') {
      router.push(href)
    } else {
      router.back()
    }
  }

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full 
        bg-white dark:bg-slate-800 
        border border-slate-200 dark:border-slate-700
        text-slate-600 dark:text-slate-300
        hover:bg-slate-50 dark:hover:bg-slate-700
        hover:text-slate-900 dark:hover:text-slate-100
        transition-colors duration-200
        font-medium text-sm"
    >
      <ChevronLeft size={18} />
      Back
    </button>
  )
}
