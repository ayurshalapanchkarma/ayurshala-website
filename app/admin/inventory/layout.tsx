'use client'

import { AdminGuard } from '@/components/AdminGuard'

export default function InventoryLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      {children}
    </AdminGuard>
  )
}
