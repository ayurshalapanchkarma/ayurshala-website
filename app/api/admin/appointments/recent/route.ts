import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const todayStr = today.toISOString().split('T')[0]
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    const sevenDaysStr = sevenDaysAgo.toISOString().split('T')[0]

    // Get all three groups
    const [todayRes, yesterdayRes, lastWeekRes] = await Promise.all([
      supabase
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
        .eq('appointment_date', todayStr)
        .eq('is_deleted', false)
        .order('appointment_time', { ascending: true })
        .limit(50),

      supabase
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
        .eq('appointment_date', yesterdayStr)
        .eq('is_deleted', false)
        .order('appointment_time', { ascending: true })
        .limit(50),

      supabase
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
        .gte('appointment_date', sevenDaysStr)
        .lt('appointment_date', yesterdayStr)
        .eq('is_deleted', false)
        .order('appointment_date', { ascending: false })
        .limit(50),
    ])

    const mapBooking = (b: any) => ({
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
    })

    return NextResponse.json({
      today: (todayRes.data || []).map(mapBooking),
      yesterday: (yesterdayRes.data || []).map(mapBooking),
      last7days: (lastWeekRes.data || []).map(mapBooking),
    })
  } catch (error) {
    console.error('[RECENT] Error:', error)
    return NextResponse.json({ today: [], yesterday: [], last7days: [] })
  }
}
