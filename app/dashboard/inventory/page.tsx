'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function InventoryIndex() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard/inventory/dashboard')
  }, [router])

  return null
}
