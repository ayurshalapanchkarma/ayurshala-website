'use client'
import Image from 'next/image'
import { Download, Save } from 'lucide-react'

interface DischargeSummaryHeaderProps {
  onSaveDraft?: () => void
  onDownloadPDF?: () => void
  isLoading?: boolean
}

export function DischargeSummaryHeader({ onSaveDraft, onDownloadPDF, isLoading }: DischargeSummaryHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/30 dark:bg-black/30 border-b border-white/20 dark:border-white/10 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 relative">
            <Image
              src="/ayurshala.png"
              alt="Ayurshala Logo"
              fill
              className="object-contain"
            />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Discharge Summary – Day Care
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {onSaveDraft && (
            <button
              onClick={onSaveDraft}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Save Draft
            </button>
          )}
          {onDownloadPDF && (
            <button
              onClick={onDownloadPDF}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isLoading ? 'Generating...' : 'Download PDF'}
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
