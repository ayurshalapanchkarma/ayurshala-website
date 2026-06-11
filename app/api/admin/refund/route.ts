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

    // Update booking refund_status to REFUNDED
    const { error } = await supabase
      .from('bookings_new')
      .update({
        refund_status: 'REFUNDED',
        refunded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('booking_id', booking_id)

    if (error) {
      console.error('Refund error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Booking marked as refunded' })
  } catch (error) {
    console.error('Refund error:', error)
    return NextResponse.json({ error: 'Failed to mark refund' }, { status: 500 })
  }
}
