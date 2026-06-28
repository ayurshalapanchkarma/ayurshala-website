'use client'

import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'

export default function AccessDenied() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-950">
      <div className="text-center px-6">
        <div className="flex justify-center mb-6">
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-full">
            <ShieldAlert size={48} className="text-red-600 dark:text-red-400" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Access Denied</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          You do not have permission to access this resource. Contact your administrator if you believe this is a mistake.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mb-8">Error 403 - Forbidden</p>
        <Link
          href="/admin"
          className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
        >
          Return to Admin
        </Link>
      </div>
    </div>
  )
}
