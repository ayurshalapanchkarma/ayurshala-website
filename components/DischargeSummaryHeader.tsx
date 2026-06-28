'use client'
import Image from 'next/image'
import Link from 'next/link'
import { Download, Save } from 'lucide-react'

interface DischargeSummaryHeaderProps {
  onSave?: () => void
  onDownloadPDF?: () => void
  isLoading?: boolean
  isSaving?: boolean
}

export function DischargeSummaryHeader({ onSave, onDownloadPDF, isLoading, isSaving }: DischargeSummaryHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/30 dark:bg-black/30 border-b border-white/20 dark:border-white/10 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <Link href="/admin/appointments" className="text-blue-600 hover:text-blue-700 text-sm">
            ← Back
          </Link>
          <Link href="/admin" className="h-9 relative w-auto hover:opacity-80 transition-opacity">
            <Image
              src="/ayurshala_text.png"
              alt="Ayurshala Logo"
              height={36}
              width={140}
              className="object-contain"
            />
          </Link>
          <h1 className="text-sm font-semibold text-gray-900 dark:text-white">
            Discharge Summary – Day Care
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {onSave && (
            <button
              onClick={onSave}
              disabled={isLoading || isSaving}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 whitespace-nowrap"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          )}
          {onDownloadPDF && (
            <button
              onClick={onDownloadPDF}
              disabled={isLoading || isSaving}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50 whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
