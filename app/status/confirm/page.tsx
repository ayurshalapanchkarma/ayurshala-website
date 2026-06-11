'use client'
import StatusPage from '@/components/StatusPage'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function ConfirmContent() {
  const params = useSearchParams()
  const bookingId = params.get('booking_id')
  const patientName = params.get('patient_name')
  const type = params.get('type')

  const config = {
    success: {
      statusType: 'success' as const,
      title: 'Booking Confirmed',
      description: 'The appointment has been confirmed. A confirmation email has been sent to the patient.',
    },
    cancelled: {
      statusType: 'cancelled' as const,
      title: 'Appointment Cancelled',
      description: 'This appointment was cancelled earlier and cannot be confirmed using this email link.',
    },
    already_confirmed: {
      statusType: 'info' as const,
      title: 'Already Confirmed',
      description: 'This appointment has already been confirmed. No further action is required.',
    },
  }

  const current = config[type as keyof typeof config] || config.success

  return (
    <StatusPage
      statusType={current.statusType}
      title={current.title}
      description={current.description}
      bookingId={bookingId || undefined}
      patientName={patientName || undefined}
      primaryAction={{ label: 'Back to Dashboard', href: '/admin' }}
      secondaryAction={{ label: 'Go to Website', href: '/' }}
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
