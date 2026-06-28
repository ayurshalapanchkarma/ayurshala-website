'use client'

import { useEffect } from 'react'
import { AlertCircle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Products page error:', error)
  }, [error])

  return (
    <div className="p-8">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="text-red-600 dark:text-red-400" size={24} />
          <h2 className="text-lg font-semibold text-red-900 dark:text-red-100">Something went wrong</h2>
        </div>
        <p className="text-red-700 dark:text-red-300 mb-4">{error.message}</p>
        <button
          onClick={() => reset()}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
