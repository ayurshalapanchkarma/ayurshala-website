'use client'
import StatusPage from '@/components/StatusPage'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function ConfirmContent() {
  const params = useSearchParams()
  const bookingId = params.get('booking_id')
  const patientName = params.get('patient_name')
  const type = params.get('type')
  const isAdmin = params.get('admin') === 'true'

  const patientConfig = {
    success: {
      statusType: 'success' as const,
      title: 'Appointment Confirmed',
      description: 'Your appointment has been successfully confirmed. You will receive a reminder before your visit.',
      primaryAction: { label: 'View My Bookings', href: '/my-bookings' },
      secondaryAction: { label: 'Return to Homepage', href: '/' },
    },
    cancelled: {
      statusType: 'error' as const,
      title: 'Cannot Confirm',
      description: 'This appointment was cancelled earlier and cannot be confirmed using this link.',
      primaryAction: { label: 'View My Bookings', href: '/my-bookings' },
      secondaryAction: { label: 'Return to Homepage', href: '/' },
    },
    already_confirmed: {
      statusType: 'info' as const,
      title: 'Already Confirmed',
      description: 'Your appointment has already been confirmed. No further action is required.',
      primaryAction: { label: 'View My Bookings', href: '/my-bookings' },
      secondaryAction: { label: 'Return to Homepage', href: '/' },
    },
    invalid: {
      statusType: 'error' as const,
      title: 'Invalid Link',
      description: 'This confirmation link is invalid or has expired. Please contact support for assistance.',
      primaryAction: { label: 'View My Bookings', href: '/my-bookings' },
      secondaryAction: { label: 'Return to Homepage', href: '/' },
    },
  }

  const adminConfig = {
    success: {
      statusType: 'success' as const,
      title: 'Booking Confirmed',
      description: 'The appointment has been confirmed. A confirmation email has been sent to the patient.',
      primaryAction: { label: 'View Bookings', href: '/admin' },
      secondaryAction: { label: 'Return to Dashboard', href: '/admin' },
    },
    cancelled: {
      statusType: 'error' as const,
      title: 'Cannot Confirm',
      description: 'This appointment was cancelled earlier and cannot be confirmed.',
      primaryAction: { label: 'View Bookings', href: '/admin' },
      secondaryAction: { label: 'Return to Dashboard', href: '/admin' },
    },
    already_confirmed: {
      statusType: 'info' as const,
      title: 'Already Confirmed',
      description: 'This appointment has already been confirmed.',
      primaryAction: { label: 'View Bookings', href: '/admin' },
      secondaryAction: { label: 'Return to Dashboard', href: '/admin' },
    },
    invalid: {
      statusType: 'error' as const,
      title: 'Invalid Link',
      description: 'This confirmation link is invalid or expired.',
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
      patientName={patientName || undefined}
      primaryAction={current.primaryAction}
      secondaryAction={current.secondaryAction}
    />
  )
}

export default function ConfirmStatus() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ConfirmContent />
    </Suspense>
  )
}
