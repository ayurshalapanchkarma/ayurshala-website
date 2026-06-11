'use client'
import StatusPage from '@/components/StatusPage'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function RescheduleContent() {
  const params = useSearchParams()
  const bookingId = params.get('booking_id')
  const type = params.get('type')

  const config = {
    approved: {
      statusType: 'success' as const,
      title: 'Reschedule Approved',
      description: 'Your reschedule request has been approved. Check your email for details.',
    },
    rejected: {
      statusType: 'error' as const,
      title: 'Reschedule Rejected',
      description: 'Your reschedule request could not be approved. Please contact the clinic.',
    },
    already_processed: {
      statusType: 'warning' as const,
      title: 'Already Processed',
      description: 'This reschedule request has already been processed.',
    },
  }

  const current = config[type as keyof typeof config] || config.approved

  return (
    <StatusPage
      statusType={current.statusType}
      title={current.title}
      description={current.description}
      bookingId={bookingId || undefined}
      primaryAction={{ label: 'View My Bookings', href: '/my-bookings' }}
      secondaryAction={{ label: 'Go to Website', href: '/' }}
    />
  )
}

export default function RescheduleStatus() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <RescheduleContent />
    </Suspense>
  )
}
