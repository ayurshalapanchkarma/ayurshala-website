'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function InventoryIndex() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/admin/inventory/products')
  }, [router])

  return null
}
