'use client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function BookAppointmentRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/book')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4" />
        <p className="text-stone-600">Redirecting to booking...</p>
      </div>
    </div>
  )
}
