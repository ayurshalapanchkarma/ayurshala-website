'use client'
import StatusPage from '@/components/StatusPage'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function RescheduleContent() {
  const params = useSearchParams()
  const bookingId = params.get('booking_id')
  const type = params.get('type')
  const isAdmin = params.get('admin') === 'true'

  const patientConfig = {
    approved: {
      statusType: 'success' as const,
      title: 'Reschedule Approved',
      description: 'Your reschedule request has been approved. Check your email for your new appointment details.',
      primaryAction: { label: 'View My Bookings', href: '/my-bookings' },
      secondaryAction: { label: 'Return to Homepage', href: '/' },
    },
    rejected: {
      statusType: 'error' as const,
      title: 'Reschedule Not Approved',
      description: 'Unfortunately, your reschedule request could not be approved. Please contact the clinic for assistance.',
      primaryAction: { label: 'View My Bookings', href: '/my-bookings' },
      secondaryAction: { label: 'Return to Homepage', href: '/' },
    },
    already_processed: {
      statusType: 'info' as const,
      title: 'Already Processed',
      description: 'This reschedule request has already been processed. No further action is needed.',
      primaryAction: { label: 'View My Bookings', href: '/my-bookings' },
      secondaryAction: { label: 'Return to Homepage', href: '/' },
    },
    invalid: {
      statusType: 'error' as const,
      title: 'Invalid Link',
      description: 'This reschedule link is invalid or has expired. Please contact support for assistance.',
      primaryAction: { label: 'View My Bookings', href: '/my-bookings' },
      secondaryAction: { label: 'Return to Homepage', href: '/' },
    },
  }

  const adminConfig = {
    approved: {
      statusType: 'success' as const,
      title: 'Reschedule Approved',
      description: 'The reschedule request has been approved. Patient notified via email.',
      primaryAction: { label: 'View Bookings', href: '/admin' },
      secondaryAction: { label: 'Return to Dashboard', href: '/admin' },
    },
    rejected: {
      statusType: 'error' as const,
      title: 'Reschedule Rejected',
      description: 'The reschedule request has been rejected. Patient has been notified.',
      primaryAction: { label: 'View Bookings', href: '/admin' },
      secondaryAction: { label: 'Return to Dashboard', href: '/admin' },
    },
    already_processed: {
      statusType: 'warning' as const,
      title: 'Already Processed',
      description: 'This reschedule request has already been processed.',
      primaryAction: { label: 'View Bookings', href: '/admin' },
      secondaryAction: { label: 'Return to Dashboard', href: '/admin' },
    },
    invalid: {
      statusType: 'error' as const,
      title: 'Invalid Link',
      description: 'This reschedule link is invalid or expired.',
      primaryAction: { label: 'View Bookings', href: '/admin' },
      secondaryAction: { label: 'Return to Dashboard', href: '/admin' },
    },
  }

  const config = isAdmin ? adminConfig : patientConfig
  const current = config[type as keyof typeof config] || config.approved

  return (
    <StatusPage
      statusType={current.statusType}
      title={current.title}
      description={current.description}
      bookingId={bookingId || undefined}
      primaryAction={current.primaryAction}
      secondaryAction={current.secondaryAction}
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
