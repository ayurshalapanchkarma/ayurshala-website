import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)!
)

export async function GET(req: NextRequest) {
  const booking_id = req.nextUrl.searchParams.get('booking_id')
  const patient_uuid = req.nextUrl.searchParams.get('patient_uuid')

  if (booking_id) {
    const { data: booking, error } = await supabase
      .from('bookings_new').select('*').eq('booking_id', booking_id).single()
    if (error || !booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    const [{ data: patient }, { data: treatments }] = await Promise.all([
      supabase.from('patients').select('full_name,patient_id,email').eq('id', booking.patient_uuid).single(),
      supabase.from('booking_treatments_v2').select('treatment_name').eq('booking_uuid', booking.id),
    ])

    return NextResponse.json({ booking: { ...booking, patients: patient, booking_treatments_v2: treatments || [] } })
  }

  if (patient_uuid) {
    const { data: bookings } = await supabase
      .from('bookings_new').select('*')
      .eq('patient_uuid', patient_uuid).eq('is_deleted', false)
      .order('created_at', { ascending: false })

    if (!bookings?.length) return NextResponse.json({ bookings: [] })

    // Fetch treatments for all bookings in one query
    const ids = bookings.map(b => b.id)
    const { data: treatments } = await supabase
      .from('booking_treatments_v2').select('booking_uuid,treatment_name').in('booking_uuid', ids)

    const { data: payments } = await supabase
      .from('payments').select('booking_uuid,amount,status').in('booking_uuid', ids)

    const result = bookings.map(b => ({
      ...b,
      booking_treatments_v2: treatments?.filter(t => t.booking_uuid === b.id) || [],
      payments: payments?.filter(p => p.booking_uuid === b.id) || [],
    }))

    return NextResponse.json({ bookings: result })
  }

  return NextResponse.json({ error: 'Missing booking_id or patient_uuid' }, { status: 400 })
}
