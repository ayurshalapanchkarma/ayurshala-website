/**
 * AppointmentContext — represents a fully resolved appointment
 * with all identifiers needed for discharge summary operations.
 * 
 * This is the single source of truth for appointment data.
 * The UUID remains internal; the UI works with human-readable fields.
 */

export interface AppointmentContext {
  // Identifiers (all required)
  bookingUuid: string;        // Internal UUID, used for all DB operations
  bookingNumber: string;      // Human-readable AYB-2026-000052
  patientUuid: string;        // Internal UUID
  patientId: string;          // Human-readable AYP-2026-000002
  
  // Patient info (for auto-fill)
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  
  // Appointment info
  doctorName: string;
  appointmentDate: string;    // ISO date or formatted
  appointmentTime: string;    // HH:MM format
  
  // Status
  status: string;             // CONFIRMED, CANCELLED, etc.
}

/**
 * Search appointments by various criteria.
 * Used by the standalone discharge summary flow (Mode 2).
 */
export async function searchAppointments(query: string): Promise<AppointmentContext[]> {
  const res = await fetch(`/api/admin/appointments/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) {
    throw new Error(`Search failed: ${res.statusText}`);
  }
  const { results } = await res.json();
  return results;
}

/**
 * Get recent appointments, grouped by timeframe.
 * Used to pre-populate the selector UI in Mode 2.
 */
export interface RecentAppointmentsResponse {
  today: AppointmentContext[];
  yesterday: AppointmentContext[];
  last7days: AppointmentContext[];
}

export async function getRecentAppointments(): Promise<RecentAppointmentsResponse> {
  const res = await fetch('/api/admin/appointments/recent');
  if (!res.ok) {
    throw new Error(`Failed to fetch recent appointments`);
  }
  return res.json();
}

/**
 * Check if a discharge summary already exists for this booking.
 * Used to prevent duplicates.
 */
export async function checkExistingDischargeSummary(
  bookingUuid: string
): Promise<{ exists: boolean; id?: string }> {
  const res = await fetch(
    `/api/admin/discharge-summary/check?booking_uuid=${encodeURIComponent(bookingUuid)}`
  );
  if (!res.ok) {
    throw new Error('Failed to check for existing discharge summary');
  }
  return res.json();
}

/**
 * Resolve a booking UUID to full AppointmentContext.
 * This is the single source of truth for booking lookup.
 */
export async function resolveAppointmentContext(
  bookingUuid: string
): Promise<AppointmentContext> {
  const res = await fetch(
    `/api/admin/appointments/context?booking_uuid=${encodeURIComponent(bookingUuid)}`
  );
  if (!res.ok) {
    throw new Error('Failed to resolve appointment context');
  }
  const { context } = await res.json();
  return context;
}
