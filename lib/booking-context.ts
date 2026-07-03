/**
 * Booking context resolver.
 *
 * Resolves a booking_number (AYB-2026-000052) to all identifiers needed
 * for discharge summary operations.
 *
 * RULES:
 * - booking_number  = human-readable string (AYB-...)  — used in URLs, UI
 * - booking_uuid    = database UUID                     — used in all DB queries
 * - patient_id      = human-readable string (AYP-...)  — used in UI
 * - patient_uuid    = database UUID                     — used in all DB queries
 *
 * No downstream function should ever receive a booking_number and query
 * a UUID column with it.
 */

import { createClient } from '@supabase/supabase-js'

export interface BookingContext {
  /** Human-readable booking reference e.g. AYB-2026-000052 */
  booking_number: string
  /** Database UUID for the booking row */
  booking_uuid: string
  /** Human-readable patient reference e.g. AYP-2026-000002 */
  patient_id: string
  /** Database UUID for the patient row */
  patient_uuid: string
  /** Database UUID for an existing discharge summary row, null if none yet */
  discharge_summary_id: string | null
}

export type ResolveResult =
  | { ok: true; context: BookingContext }
  | { ok: false; error: string; code: 'NOT_FOUND' | 'DB_ERROR' | 'INVALID_INPUT' }

/**
 * Resolve a booking UUID to a full BookingContext.
 *
 * Called once at the entry point of every discharge summary request.
 * All downstream DB operations use the UUIDs returned here.
 */
export async function resolveBookingContext(
  bookingUuid: string,
  supabaseUrl: string,
  serviceRoleKey: string,
  requestLabel: string = 'REQUEST'
): Promise<ResolveResult> {
  console.log(`[${requestLabel}][RESOLVE] Starting resolution for booking_uuid=${bookingUuid}`)

  if (!bookingUuid || bookingUuid.trim() === '') {
    console.error(`[${requestLabel}][RESOLVE] FAILED - booking_uuid is empty`)
    return { ok: false, error: 'booking_uuid is required', code: 'INVALID_INPUT' }
  }

  // Reject if it looks like a booking_number instead of a UUID
  if (bookingUuid.startsWith('AYB-') || bookingUuid.startsWith('AYP-')) {
    console.error(
      `[${requestLabel}][RESOLVE] FAILED - received a booking_number where a UUID is required: ${bookingUuid}`
    )
    return {
      ok: false,
      error:
        'Unable to locate the appointment. Please reopen the discharge summary from the Appointments page.',
      code: 'INVALID_INPUT',
    }
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  // ── 1. Look up booking ──────────────────────────────────────────────────────
  console.log(`[${requestLabel}][RESOLVE] Querying bookings_new WHERE booking_uuid=${bookingUuid}`)

  const { data: booking, error: bookingError } = await supabase
    .from('bookings_new')
    .select('id, booking_id, booking_uuid, patient_uuid')
    .eq('booking_uuid', bookingUuid)
    .single()

  if (bookingError || !booking) {
    console.error(`[${requestLabel}][RESOLVE] Booking not found:`, bookingError?.message)
    console.error(`[${requestLabel}][RESOLVE] Full error:`, bookingError)
    return {
      ok: false,
      error: 'Unable to locate the appointment. Please reopen the discharge summary from the Appointments page.',
      code: 'NOT_FOUND',
    }
  }

  console.log(`[${requestLabel}][RESOLVE] Booking found: booking_number=${booking.booking_id}, patient_uuid=${booking.patient_uuid}`)

  // ── 2. Look up patient ──────────────────────────────────────────────────────
  console.log(`[${requestLabel}][RESOLVE] Querying patients WHERE id=${booking.patient_uuid}`)

  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('id, patient_id')
    .eq('id', booking.patient_uuid)
    .single()

  if (patientError || !patient) {
    console.error(`[${requestLabel}][RESOLVE] Patient not found:`, patientError?.message)
    return {
      ok: false,
      error: 'Patient record not found.',
      code: 'NOT_FOUND',
    }
  }

  console.log(`[${requestLabel}][RESOLVE] Patient found: patient_id=${patient.patient_id}`)

  // ── 3. Check for existing discharge summary ─────────────────────────────────
  console.log(`[${requestLabel}][RESOLVE] Querying discharge_summaries WHERE booking_id=${booking.booking_uuid}`)

  const { data: summary } = await supabase
    .from('discharge_summaries')
    .select('id')
    .eq('booking_id', booking.booking_uuid)
    .maybeSingle()

  const discharge_summary_id = summary?.id ?? null
  console.log(`[${requestLabel}][RESOLVE] Discharge summary: ${discharge_summary_id ?? 'none yet'}`)

  // ── 4. Log full resolved context ────────────────────────────────────────────
  const context: BookingContext = {
    booking_number: booking.booking_id,
    booking_uuid: booking.booking_uuid,
    patient_id: patient.patient_id,
    patient_uuid: patient.id,
    discharge_summary_id,
  }

  console.log(`[${requestLabel}][RESOLVE] Context resolved:`, {
    booking_number: context.booking_number,
    booking_uuid: context.booking_uuid,
    patient_id: context.patient_id,
    patient_uuid: context.patient_uuid,
    discharge_summary_id: context.discharge_summary_id,
  })

  return { ok: true, context }
}
