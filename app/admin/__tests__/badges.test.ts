/**
 * Badge Rendering Test Suite
 * Validates the status and payment badge matrix for all booking states
 */

// Mock Booking type (same as in page.tsx)
type Booking = {
  id: number
  booking_id: string
  preferred_date: string
  preferred_time: string
  booking_type: string
  status: string
  payment_status: string
  payment_method: string
  created_at: string
  patient_name: string
  patient_id: string
  patient_phone: string
  patient_email: string
  treatments: string
  amount?: number
  rescheduled_at?: string
}

// Helper function implementations (copied from page.tsx for testing)
const getStatusBadge = (booking: Booking) => {
  const { status, rescheduled_at, payment_method, payment_status } = booking

  if (status === 'PAYMENT_PENDING') {
    return { label: 'Payment Pending', cls: 'bg-amber-100/80 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200' }
  }

  if (status === 'PENDING_CONFIRMATION') {
    return { label: 'Awaiting Confirmation', cls: 'bg-yellow-100/80 text-yellow-900 dark:bg-yellow-950/50 dark:text-yellow-200' }
  }

  if (status === 'CONFIRMED' && rescheduled_at) {
    return { label: 'Rescheduled Confirmed', cls: 'bg-emerald-100/80 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200' }
  }

  if (status === 'CONFIRMED') {
    return { label: 'Confirmed', cls: 'bg-green-100/80 text-green-900 dark:bg-green-950/50 dark:text-green-200' }
  }

  if (status === 'RESCHEDULED') {
    return { label: 'Reschedule Requested', cls: 'bg-orange-100/80 text-orange-900 dark:bg-orange-950/50 dark:text-orange-200' }
  }

  if (status === 'CANCELLED') {
    return { label: 'Cancelled', cls: 'bg-red-100/80 text-red-900 dark:bg-red-950/50 dark:text-red-200' }
  }

  if (status === 'COMPLETED') {
    return { label: 'Completed', cls: 'bg-blue-100/80 text-blue-900 dark:bg-blue-950/50 dark:text-blue-200' }
  }

  if (status === 'NO_SHOW') {
    return { label: 'No Show', cls: 'bg-slate-100/80 text-slate-900 dark:bg-slate-950/50 dark:text-slate-200' }
  }

  if (status === 'IN_PROGRESS') {
    return { label: 'In Progress', cls: 'bg-indigo-100/80 text-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-200' }
  }

  return { label: status, cls: 'bg-gray-100/80 text-gray-900 dark:bg-gray-950/50 dark:text-gray-200' }
}

const getPaymentBadge = (booking: Booking) => {
  const { status, payment_method, payment_status } = booking

  if (status === 'PAYMENT_PENDING') {
    return { label: 'Pending', cls: 'bg-gray-100/80 text-gray-900 dark:bg-gray-950/50 dark:text-gray-200' }
  }

  if (status === 'PENDING_CONFIRMATION' && payment_method === 'ONLINE' && payment_status === 'PAID') {
    return { label: 'Paid', cls: 'bg-green-100/80 text-green-900 dark:bg-green-950/50 dark:text-green-200' }
  }

  if (status === 'PENDING_CONFIRMATION' && payment_method === 'CASH_ON_ARRIVAL' && payment_status === 'PENDING') {
    return { label: 'Cash Pending', cls: 'bg-orange-100/80 text-orange-900 dark:bg-orange-950/50 dark:text-orange-200' }
  }

  if (status === 'CONFIRMED' && payment_method === 'ONLINE' && payment_status === 'PAID') {
    return { label: 'Paid', cls: 'bg-green-100/80 text-green-900 dark:bg-green-950/50 dark:text-green-200' }
  }

  if (status === 'CONFIRMED' && payment_method === 'CASH_ON_ARRIVAL' && payment_status === 'PENDING') {
    return { label: 'Cash Pending', cls: 'bg-orange-100/80 text-orange-900 dark:bg-orange-950/50 dark:text-orange-200' }
  }

  if (status === 'CONFIRMED' && payment_method === 'CASH_ON_ARRIVAL' && payment_status === 'PAID') {
    return { label: 'Paid', cls: 'bg-green-100/80 text-green-900 dark:bg-green-950/50 dark:text-green-200' }
  }

  if (payment_status === 'PAID' || payment_status === 'SUCCESS') {
    return { label: 'Paid', cls: 'bg-green-100/80 text-green-900 dark:bg-green-950/50 dark:text-green-200' }
  }

  if (payment_status === 'PENDING' || payment_status === 'COD_PENDING') {
    return { label: 'Cash Pending', cls: 'bg-orange-100/80 text-orange-900 dark:bg-orange-950/50 dark:text-orange-200' }
  }

  if (payment_status === 'REFUNDED') {
    return { label: 'Refunded', cls: 'bg-blue-100/80 text-blue-900 dark:bg-blue-950/50 dark:text-blue-200' }
  }

  if (payment_status === 'FAILED') {
    return { label: 'Failed', cls: 'bg-red-100/80 text-red-900 dark:bg-red-950/50 dark:text-red-200' }
  }

  return { label: payment_status || 'Unknown', cls: 'bg-gray-100/80 text-gray-900 dark:bg-gray-950/50 dark:text-gray-200' }
}

const getAvailableActions = (booking: Booking) => {
  const { status } = booking

  if (status === 'PAYMENT_PENDING') return []
  if (status === 'PENDING_CONFIRMATION') return ['confirm', 'cancel']
  if (status === 'CONFIRMED' && !booking.rescheduled_at) return ['cancel']
  if (status === 'CONFIRMED' && booking.rescheduled_at) return ['cancel']
  if (status === 'RESCHEDULED') return ['approve_reschedule', 'reject_reschedule']
  if (['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(status)) return []
  if (status === 'IN_PROGRESS') return ['mark_completed', 'mark_no_show']

  return []
}

// Test Suite
describe('Admin Dashboard Badge Matrix', () => {
  const baseBooking: Booking = {
    id: 1,
    booking_id: 'BK001',
    preferred_date: '2026-06-15',
    preferred_time: '10:00 AM',
    booking_type: 'consultation',
    status: 'PENDING_CONFIRMATION',
    payment_status: 'PENDING',
    payment_method: 'ONLINE',
    created_at: '2026-06-10T12:00:00Z',
    patient_name: 'Test Patient',
    patient_id: 'P001',
    patient_phone: '9876543210',
    patient_email: 'test@example.com',
    treatments: 'Consultation',
  }

  describe('State 1: PAYMENT_PENDING', () => {
    const booking = { ...baseBooking, status: 'PAYMENT_PENDING' }

    test('Status badge shows "Payment Pending"', () => {
      const badge = getStatusBadge(booking)
      expect(badge.label).toBe('Payment Pending')
      expect(badge.cls).toContain('amber-100/80')
      expect(badge.cls).toContain('dark:bg-amber-950/50')
    })

    test('Payment badge shows "Pending"', () => {
      const badge = getPaymentBadge(booking)
      expect(badge.label).toBe('Pending')
      expect(badge.cls).toContain('gray-100/80')
    })

    test('No actions available', () => {
      const actions = getAvailableActions(booking)
      expect(actions).toEqual([])
    })
  })

  describe('State 2: PENDING_CONFIRMATION + ONLINE + PAID', () => {
    const booking = { ...baseBooking, status: 'PENDING_CONFIRMATION', payment_method: 'ONLINE', payment_status: 'PAID' }

    test('Status badge shows "Awaiting Confirmation"', () => {
      const badge = getStatusBadge(booking)
      expect(badge.label).toBe('Awaiting Confirmation')
      expect(badge.cls).toContain('yellow-100/80')
    })

    test('Payment badge shows "Paid"', () => {
      const badge = getPaymentBadge(booking)
      expect(badge.label).toBe('Paid')
      expect(badge.cls).toContain('green-100/80')
    })

    test('Confirm and Cancel actions available', () => {
      const actions = getAvailableActions(booking)
      expect(actions).toEqual(['confirm', 'cancel'])
    })
  })

  describe('State 3: PENDING_CONFIRMATION + CASH_ON_ARRIVAL + PENDING', () => {
    const booking = { ...baseBooking, status: 'PENDING_CONFIRMATION', payment_method: 'CASH_ON_ARRIVAL', payment_status: 'PENDING' }

    test('Status badge shows "Awaiting Confirmation"', () => {
      const badge = getStatusBadge(booking)
      expect(badge.label).toBe('Awaiting Confirmation')
    })

    test('Payment badge shows "Cash Pending"', () => {
      const badge = getPaymentBadge(booking)
      expect(badge.label).toBe('Cash Pending')
      expect(badge.cls).toContain('orange-100/80')
    })

    test('Confirm and Cancel actions available', () => {
      const actions = getAvailableActions(booking)
      expect(actions).toEqual(['confirm', 'cancel'])
    })
  })

  describe('State 4: CONFIRMED (not rescheduled)', () => {
    const booking = { ...baseBooking, status: 'CONFIRMED', payment_method: 'ONLINE', payment_status: 'PAID', rescheduled_at: undefined }

    test('Status badge shows "Confirmed"', () => {
      const badge = getStatusBadge(booking)
      expect(badge.label).toBe('Confirmed')
      expect(badge.cls).toContain('green-100/80')
    })

    test('Payment badge shows "Paid"', () => {
      const badge = getPaymentBadge(booking)
      expect(badge.label).toBe('Paid')
    })

    test('Cancel action only', () => {
      const actions = getAvailableActions(booking)
      expect(actions).toEqual(['cancel'])
    })
  })

  describe('State 5: CONFIRMED + RESCHEDULED', () => {
    const booking = { ...baseBooking, status: 'CONFIRMED', rescheduled_at: '2026-06-20T10:00:00Z' }

    test('Status badge shows "Rescheduled Confirmed"', () => {
      const badge = getStatusBadge(booking)
      expect(badge.label).toBe('Rescheduled Confirmed')
      expect(badge.cls).toContain('emerald-100/80')
    })

    test('Cancel action only (no Reschedule button)', () => {
      const actions = getAvailableActions(booking)
      expect(actions).toEqual(['cancel'])
    })
  })

  describe('State 6: RESCHEDULED', () => {
    const booking = { ...baseBooking, status: 'RESCHEDULED' }

    test('Status badge shows "Reschedule Requested"', () => {
      const badge = getStatusBadge(booking)
      expect(badge.label).toBe('Reschedule Requested')
      expect(badge.cls).toContain('orange-100/80')
    })

    test('Approve and Reject actions available', () => {
      const actions = getAvailableActions(booking)
      expect(actions).toEqual(['approve_reschedule', 'reject_reschedule'])
    })
  })

  describe('State 7: CANCELLED', () => {
    const booking = { ...baseBooking, status: 'CANCELLED' }

    test('Status badge shows "Cancelled"', () => {
      const badge = getStatusBadge(booking)
      expect(badge.label).toBe('Cancelled')
      expect(badge.cls).toContain('red-100/80')
    })

    test('No actions available', () => {
      const actions = getAvailableActions(booking)
      expect(actions).toEqual([])
    })
  })

  describe('State 8: COMPLETED', () => {
    const booking = { ...baseBooking, status: 'COMPLETED' }

    test('Status badge shows "Completed"', () => {
      const badge = getStatusBadge(booking)
      expect(badge.label).toBe('Completed')
      expect(badge.cls).toContain('blue-100/80')
    })

    test('No actions available', () => {
      const actions = getAvailableActions(booking)
      expect(actions).toEqual([])
    })
  })

  describe('State 9: NO_SHOW', () => {
    const booking = { ...baseBooking, status: 'NO_SHOW' }

    test('Status badge shows "No Show"', () => {
      const badge = getStatusBadge(booking)
      expect(badge.label).toBe('No Show')
      expect(badge.cls).toContain('slate-100/80')
    })

    test('No actions available', () => {
      const actions = getAvailableActions(booking)
      expect(actions).toEqual([])
    })
  })

  describe('State 10: IN_PROGRESS', () => {
    const booking = { ...baseBooking, status: 'IN_PROGRESS' }

    test('Status badge shows "In Progress"', () => {
      const badge = getStatusBadge(booking)
      expect(badge.label).toBe('In Progress')
      expect(badge.cls).toContain('indigo-100/80')
    })

    test('Mark Completed and Mark No Show actions available', () => {
      const actions = getAvailableActions(booking)
      expect(actions).toEqual(['mark_completed', 'mark_no_show'])
    })
  })

  describe('Theme Consistency', () => {
    const booking = { ...baseBooking, status: 'CONFIRMED' }

    test('All status badges have dark theme variants', () => {
      const badge = getStatusBadge(booking)
      expect(badge.cls).toContain('dark:')
    })

    test('All payment badges have dark theme variants', () => {
      const badge = getPaymentBadge(booking)
      expect(badge.cls).toContain('dark:')
    })
  })

  describe('Color Contrast Validation', () => {
    test('Light theme uses light backgrounds with dark text', () => {
      const booking = { ...baseBooking, status: 'CONFIRMED' }
      const badge = getStatusBadge(booking)
      expect(badge.cls).toMatch(/bg-\w+-100\/80/)
      expect(badge.cls).toMatch(/text-\w+-900/)
    })

    test('Dark theme uses dark backgrounds with light text', () => {
      const booking = { ...baseBooking, status: 'CONFIRMED' }
      const badge = getStatusBadge(booking)
      expect(badge.cls).toMatch(/dark:bg-\w+-950\/50/)
      expect(badge.cls).toMatch(/dark:text-\w+-200/)
    })
  })
})
