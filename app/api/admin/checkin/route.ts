import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { booking_id } = await req.json()
    if (!booking_id) return NextResponse.json({ error: 'booking_id required' }, { status: 400 })

    const { data: booking, error: bookingError } = await supabase
      .from('bookings_new')
      .select('*')
      .eq('booking_id', booking_id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.status === 'IN_PROGRESS') {
      return NextResponse.json({ error: 'Already checked in' }, { status: 409 })
    }

    if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
      return NextResponse.json({ error: `Cannot check in ${booking.status.toLowerCase()} booking` }, { status: 409 })
    }

    const { error: updateError } = await supabase
      .from('bookings_new')
      .update({
        status: 'IN_PROGRESS',
        checked_in_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('booking_id', booking_id)

    if (updateError) throw updateError

    return NextResponse.json({ success: true, status: 'IN_PROGRESS' })
  } catch (error) {
    console.error('Check-in error:', error)
    return NextResponse.json({ error: 'Failed to check in' }, { status: 500 })
  }
}
