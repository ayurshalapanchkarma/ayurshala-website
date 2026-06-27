'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { canAccessInventory } from '@/lib/inventory-permission'

export default function InventoryLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  // TODO: Get actual user role from auth context
  const userRole = 'ADMIN'

  useEffect(() => {
    // Check permission on mount and redirect if unauthorized
    if (!canAccessInventory(userRole)) {
      router.replace('/dashboard/inventory/unauthorized')
    }
  }, [userRole, router])

  // If no access, show nothing (will redirect)
  if (!canAccessInventory(userRole)) {
    return null
  }

  return <>{children}</>
}
