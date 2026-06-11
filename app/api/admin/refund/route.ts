import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { booking_id, refund_amount, refund_reason } = await req.json()
    if (!booking_id || refund_amount === undefined) return NextResponse.json({ error: 'booking_id and refund_amount required' }, { status: 400 })
    if (refund_amount < 0) return NextResponse.json({ error: 'Refund amount cannot be negative' }, { status: 400 })

    // Get booking to validate refund amount
    const { data: booking } = await supabase.from('bookings_new').select('*').eq('booking_id', booking_id).single()
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    if (refund_amount > (booking.amount || 0)) return NextResponse.json({ error: 'Refund amount exceeds paid amount' }, { status: 400 })

    // Update booking with refund details
    const { error } = await supabase
      .from('bookings_new')
      .update({
        refund_status: 'REFUNDED',
        refund_amount: refund_amount,
        refund_reason: refund_reason || null,
        refunded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('booking_id', booking_id)

    if (error) {
      console.error('Refund error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: `Refund of ₹${refund_amount} recorded` })
  } catch (error) {
    console.error('Refund error:', error)
    return NextResponse.json({ error: 'Failed to record refund' }, { status: 500 })
  }
}
