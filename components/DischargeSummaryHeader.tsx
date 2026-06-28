'use client'
import Image from 'next/image'
import Link from 'next/link'
import { Download } from 'lucide-react'

interface DischargeSummaryHeaderProps {
  onDownloadPDF?: () => void
  isLoading?: boolean
}

export function DischargeSummaryHeader({ onDownloadPDF, isLoading }: DischargeSummaryHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/30 dark:bg-black/30 border-b border-white/20 dark:border-white/10 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="h-10 relative w-auto">
            <Image
              src="/ayurshala_text.png"
              alt="Ayurshala Logo"
              height={40}
              width={120}
              className="object-contain"
            />
          </div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            Discharge Summary – Day Care
          </h1>
        </Link>

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
    </header>
  )
}
