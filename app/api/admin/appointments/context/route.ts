import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const bookingUuid = req.nextUrl.searchParams.get('booking_uuid')

  if (!bookingUuid) {
    return NextResponse.json({ error: 'booking_uuid required' }, { status: 400 })
  }

  try {
    // Fetch booking and patient data
    const { data: booking, error: bookingError } = await supabase
      .from('bookings_new')
      .select(
        `
        id,
        booking_id,
        booking_uuid,
        patient_uuid,
        appointment_date,
        appointment_time,
        status,
        doctor_name,
        patients(id, patient_id, full_name, phone, email)
      `
      )
      .eq('booking_uuid', bookingUuid)
      .single()

    if (bookingError || !booking) {
      console.error('[CONTEXT] Booking not found:', bookingError?.message)
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    const patient = booking.patients[0] || {}

    const context = {
      bookingUuid: booking.booking_uuid,
      bookingNumber: booking.booking_id,
      patientUuid: booking.patient_uuid,
      patientId: patient.patient_id || '',
      patientName: patient.full_name || '',
      patientPhone: patient.phone || '',
      patientEmail: patient.email || '',
      doctorName: booking.doctor_name || 'Dr. Farha Naqvi',
      appointmentDate: booking.appointment_date || '',
      appointmentTime: booking.appointment_time || '',
      status: booking.status || 'PENDING',
    }

    return NextResponse.json({ context })
  } catch (error) {
    console.error('[CONTEXT] Exception:', error)
    return NextResponse.json({ error: 'Failed to resolve context' }, { status: 500 })
  }
}
