'use client'

import { AdminGuard } from '@/components/AdminGuard'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors">
        {/* Content - individual pages/modules provide their own headers */}
        <main className="max-w-full">
          {children}
        </main>
      </div>
    </AdminGuard>
  )
}
