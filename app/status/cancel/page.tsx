'use client'
import StatusPage from '@/components/StatusPage'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function CancelContent() {
  const params = useSearchParams()
  const bookingId = params.get('booking_id')
  const type = params.get('type')

  const config = {
    success: {
      statusType: 'error' as const,
      title: 'Booking Cancelled',
      description: 'The appointment has been cancelled. The patient has been notified.',
    },
    already_cancelled: {
      statusType: 'warning' as const,
      title: 'Already Cancelled',
      description: 'This appointment was already cancelled.',
    },
  }

  const current = config[type as keyof typeof config] || config.success

  return (
    <StatusPage
      statusType={current.statusType}
      title={current.title}
      description={current.description}
      bookingId={bookingId || undefined}
      primaryAction={{ label: 'Back to Dashboard', href: '/admin' }}
      secondaryAction={{ label: 'Go to Website', href: '/' }}
    />
  )
}

export default function CancelStatus() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <CancelContent />
    </Suspense>
  )
}
