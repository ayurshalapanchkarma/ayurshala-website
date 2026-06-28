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
      <div className="h-20 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-6">
        {/* Left section */}
        <div className="flex items-center gap-6 min-w-0">
          <Link href="/admin/appointments" className="text-blue-600 hover:text-blue-700 text-sm flex-shrink-0">
            ← Back
          </Link>
          
          <div className="flex items-center gap-4 min-w-0">
            <div className="h-10 w-auto flex-shrink-0">
              <Image
                src="/ayurshala_text.png"
                alt="Ayurshala Logo"
                height={40}
                width={133}
                className="h-10 w-auto object-contain"
              />
            </div>
            <h1 className="text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
              Discharge Summary – Day Care
            </h1>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2 flex-shrink-0">
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
