import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { booking_id, action, amount_paid } = await req.json()
    if (!booking_id || !action) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

    if (action === 'collect_cash') {
      if (amount_paid <= 0) return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 })

      await supabase.from('bookings_new').update({
        payment_status: 'PAID',
        amount_paid: amount_paid,
        updated_at: new Date().toISOString(),
      }).eq('booking_id', booking_id)

      return NextResponse.json({ success: true, message: `Cash collected: ₹${amount_paid}` })
    }

    if (action === 'mark_no_cash') {
      await supabase.from('bookings_new').update({
        payment_status: 'NO_CASH_COLLECTED',
        amount_paid: 0,
        updated_at: new Date().toISOString(),
      }).eq('booking_id', booking_id)

      return NextResponse.json({ success: true, message: 'Marked as no cash collected' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Cash collection error:', error)
    return NextResponse.json({ error: 'Failed to process cash collection' }, { status: 500 })
  }
}
