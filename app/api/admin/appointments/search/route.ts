import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const query = req.nextUrl.searchParams.get('q')?.trim()

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  try {
    // Search by patient name, patient ID, booking number, phone, or appointment date
    // This is a broad search to support multiple input patterns
    const likePattern = `%${query}%`

    const { data: bookings, error } = await supabase
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
        patients!inner(
          id,
          patient_id,
          full_name,
          phone,
          email
        )
      `
      )
      .or(
        `patients.full_name.ilike.${likePattern},patients.patient_id.ilike.${likePattern},booking_id.ilike.${likePattern},patients.phone.ilike.${likePattern}`
      )
      .eq('is_deleted', false)
      .order('appointment_date', { ascending: false })
      .limit(20)

    if (error) {
      console.error('[SEARCH] Error:', error)
      return NextResponse.json({ results: [] })
    }

    const results = bookings.map((b: any) => ({
      bookingUuid: b.booking_uuid,
      bookingNumber: b.booking_id,
      patientUuid: b.patient_uuid,
      patientId: b.patients[0]?.patient_id || '',
      patientName: b.patients[0]?.full_name || '',
      patientPhone: b.patients[0]?.phone || '',
      patientEmail: b.patients[0]?.email || '',
      doctorName: b.doctor_name || 'Dr. Farha Naqvi',
      appointmentDate: b.appointment_date || '',
      appointmentTime: b.appointment_time || '',
      status: b.status || 'PENDING',
    }))

    return NextResponse.json({ results })
  } catch (error) {
    console.error('[SEARCH] Exception:', error)
    return NextResponse.json({ results: [] })
  }
}
