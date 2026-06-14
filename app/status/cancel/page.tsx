'use client'
import StatusPage from '@/components/StatusPage'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'

function CancelContent() {
  const params = useSearchParams()
  const bookingId = params.get('booking_id')
  const type = params.get('type')
  const isAdmin = params.get('admin') === 'true'
  const router = useRouter()

  const patientConfig = {
    success: {
      statusType: 'error' as const,
      title: 'Appointment Cancelled',
      description: 'Your appointment has been successfully cancelled. You can book another appointment anytime.',
      primaryAction: { label: 'View My Bookings', href: '/my-bookings' },
      secondaryAction: { label: 'Return to Homepage', href: '/' },
    },
    already_cancelled: {
      statusType: 'warning' as const,
      title: 'Already Cancelled',
      description: 'Your appointment had already been cancelled previously. No further action is required.',
      primaryAction: { label: 'View My Bookings', href: '/my-bookings' },
      secondaryAction: { label: 'Return to Homepage', href: '/' },
    },
    invalid: {
      statusType: 'error' as const,
      title: 'Invalid Link',
      description: 'This cancellation link is invalid or has expired. Please contact support for assistance.',
      primaryAction: { label: 'View My Bookings', href: '/my-bookings' },
      secondaryAction: { label: 'Return to Homepage', href: '/' },
    },
  }

  const adminConfig = {
    success: {
      statusType: 'error' as const,
      title: 'Booking Cancelled',
      description: 'The appointment has been cancelled. The patient has been notified.',
      primaryAction: { label: 'View Bookings', href: '/admin' },
      secondaryAction: { label: 'Return to Dashboard', href: '/admin' },
    },
    already_cancelled: {
      statusType: 'warning' as const,
      title: 'Already Cancelled',
      description: 'This appointment was already cancelled.',
      primaryAction: { label: 'View Bookings', href: '/admin' },
      secondaryAction: { label: 'Return to Dashboard', href: '/admin' },
    },
    invalid: {
      statusType: 'error' as const,
      title: 'Invalid Link',
      description: 'This cancellation link is invalid or expired.',
      primaryAction: { label: 'View Bookings', href: '/admin' },
      secondaryAction: { label: 'Return to Dashboard', href: '/admin' },
    },
  }

  const config = isAdmin ? adminConfig : patientConfig
  const current = config[type as keyof typeof config] || config.success

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

export default function CancelStatus() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <CancelContent />
    </Suspense>
  )
}
