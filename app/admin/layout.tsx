'use client'

import { AdminGuard } from '@/components/AdminGuard'
import AdminHeader from '@/components/admin/AdminHeader'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors">
        {/* Global Admin Header */}
        <AdminHeader />
        
        {/* Content with proper spacing for header */}
        <main className="max-w-full">
          {children}
        </main>
      </div>
    </AdminGuard>
  )
}
